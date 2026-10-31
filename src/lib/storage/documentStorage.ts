/**
 * High-performance browser storage for document files and blobs.
 * Uses IndexedDB with in-memory caching to support large PDFs and documents (up to hundreds of MBs)
 * without exceeding localStorage quotas or hitting URL length limits in browser iframes.
 */

const DB_NAME = 'traduztudo_storage_v1';
const STORE_NAME = 'document_blobs';
const DB_VERSION = 1;

// In-memory cache for ultra-fast synchronous retrieval in the active session
const inMemoryBlobs = new Map<string, Blob>();
const activeBlobUrls = new Set<string>();

/**
 * Robust base64 to Blob converter with 512KB chunking.
 * Prevents "Maximum call stack size exceeded" errors with large files.
 */
export function base64ToBlob(base64OrDataUrl: string, defaultMime = 'application/pdf'): Blob {
  let base64 = base64OrDataUrl;
  let mimeType = defaultMime;

  if (base64.includes(';base64,')) {
    const parts = base64.split(';base64,');
    const match = parts[0].match(/data:(.*?)$/);
    if (match && match[1]) {
      mimeType = match[1];
    }
    base64 = parts[1];
  } else if (base64.startsWith('data:')) {
    const parts = base64.split(',');
    base64 = parts[1] || '';
  }

  // If string is a file path or URL (e.g. /uploads/...), it is not base64
  if (base64.startsWith('/') || base64.startsWith('http')) {
    return new Blob([], { type: mimeType });
  }

  try {
    const byteCharacters = atob(base64);
    const sliceSize = 1024 * 512; // 512 KB per chunk
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays as unknown as BlobPart[], { type: mimeType });
  } catch (err) {
    console.warn('Failed to convert base64 to Blob, returning empty blob:', err);
    return new Blob([], { type: mimeType });
  }
}

/**
 * Validates if a Blob is a genuine, parsable PDF binary (starts with %PDF)
 */
export async function isValidPdfBlob(blob: Blob | null | undefined): Promise<boolean> {
  if (!blob || blob.size < 50) return false;
  try {
    const header = await blob.slice(0, 5).text();
    return header.startsWith('%PDF');
  } catch {
    return false;
  }
}

/**
 * Open IndexedDB database
 */
function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error, falling back to memory cache');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save document blob to memory and IndexedDB
 */
export async function saveDocumentBlob(
  id: string,
  source: Blob | File | ArrayBuffer | Uint8Array | string,
  name?: string,
  mimeType?: string
): Promise<Blob> {
  let blob: Blob;

  if (source instanceof Blob) {
    blob = source;
  } else if (typeof source === 'string') {
    blob = base64ToBlob(source, mimeType || (source.startsWith('data:image') ? 'image/png' : 'application/pdf'));
  } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
    blob = new Blob([source as unknown as BlobPart], { type: mimeType || 'application/pdf' });
  } else {
    blob = new Blob([], { type: mimeType || 'application/octet-stream' });
  }

  // Save to in-memory map
  inMemoryBlobs.set(id, blob);

  // Save to IndexedDB asynchronously
  const db = await openIndexedDb();
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        id,
        blob,
        name: name || id,
        type: blob.type,
        size: blob.size,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to persist blob in IndexedDB:', err);
    }
  }

  return blob;
}

/**
 * Get document Blob by ID with fallback support
 */
export async function getDocumentBlob(
  id: string,
  fallbackDataUrl?: string,
  mimeType?: string
): Promise<Blob | null> {
  // 1. Check in-memory cache
  if (inMemoryBlobs.has(id)) {
    const memBlob = inMemoryBlobs.get(id)!;
    if (memBlob && memBlob.size > 50 && memBlob.type !== 'text/plain') {
      return memBlob;
    }
  }

  // 2. Check IndexedDB
  const db = await openIndexedDb();
  if (db) {
    try {
      const record = await new Promise<any>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (record && record.blob instanceof Blob && record.blob.size > 50 && record.blob.type !== 'text/plain') {
        inMemoryBlobs.set(id, record.blob);
        return record.blob;
      }
    } catch (err) {
      console.warn('Error reading from IndexedDB:', err);
    }
  }

  // 3. Fallback to provided dataUrl or remote URL if valid
  if (fallbackDataUrl && typeof fallbackDataUrl === 'string') {
    if (fallbackDataUrl.startsWith('data:') && fallbackDataUrl.length > 500) {
      const blob = base64ToBlob(fallbackDataUrl, mimeType || 'application/pdf');
      inMemoryBlobs.set(id, blob);
      // Persist in background
      saveDocumentBlob(id, blob, id, mimeType).catch(() => {});
      return blob;
    } else if (fallbackDataUrl.startsWith('http://') || fallbackDataUrl.startsWith('https://')) {
      try {
        const res = await fetch(fallbackDataUrl);
        if (res.ok) {
          const blob = await res.blob();
          inMemoryBlobs.set(id, blob);
          saveDocumentBlob(id, blob, id, mimeType || blob.type).catch(() => {});
          return blob;
        }
      } catch (e) {
        console.warn('Could not fetch remote document file:', e);
      }
    }
  }

  return null;
}

/**
 * Create a Blob URL for direct browser rendering (iframe/object/embed/window.open)
 */
export async function createDocumentBlobUrl(
  id: string,
  fallbackDataUrl?: string,
  mimeType?: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const blob = await getDocumentBlob(id, fallbackDataUrl, mimeType);
  if (!blob) return null;

  try {
    const url = URL.createObjectURL(blob);
    activeBlobUrls.add(url);
    return url;
  } catch (err) {
    console.error('Failed to create Object URL:', err);
    return null;
  }
}

/**
 * Revoke Blob URL to free browser memory
 */
export function revokeDocumentBlobUrl(url: string | null | undefined): void {
  if (url && typeof window !== 'undefined' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
      activeBlobUrls.delete(url);
    } catch {
      // Ignored
    }
  }
}

/**
 * Delete document blob
 */
export async function deleteDocumentBlob(id: string): Promise<void> {
  inMemoryBlobs.delete(id);
  const db = await openIndexedDb();
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
    } catch {
      // Ignored
    }
  }
}

/**
 * Universal helper to download any document or quote file in the browser.
 * Works seamlessly with Blobs, base64 dataUrls, remote URLs, and local files.
 */
export async function downloadDocumentFile(file: {
  id?: string;
  name: string;
  url?: string;
  fileUrl?: string;
  dataUrl?: string;
  size?: number;
  type?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const fileName = file.name || 'documento.pdf';

  // 1. If doc has an ID, try loading blob from IndexedDB / memory cache
  if (file.id) {
    try {
      const blob = await getDocumentBlob(file.id, file.dataUrl || file.fileUrl || file.url, file.type);
      if (blob && blob.size > 50 && blob.type !== 'text/plain') {
        triggerBlobDownload(blob, fileName);
        return true;
      }
    } catch (e) {
      console.warn('Could not retrieve blob by ID:', e);
    }
  }

  // 2. If dataUrl (base64) is provided
  const rawData =
    file.dataUrl ||
    (file.url?.startsWith('data:') ? file.url : undefined) ||
    (file.fileUrl?.startsWith('data:') ? file.fileUrl : undefined);

  if (rawData && rawData.startsWith('data:')) {
    try {
      const mime = file.type || (rawData.match(/^data:([^;]+);/)?.[1]) || 'application/pdf';
      const blob = base64ToBlob(rawData, mime);
      if (blob && blob.size > 0) {
        triggerBlobDownload(blob, fileName);
        return true;
      }
    } catch (e) {
      console.warn('Could not convert dataUrl to blob:', e);
    }
  }

  // 3. If remote URL (HTTP / HTTPS)
  const remoteUrl = file.url || file.fileUrl;
  if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
    try {
      const res = await fetch(remoteUrl);
      if (res.ok) {
        const blob = await res.blob();
        triggerBlobDownload(blob, fileName);
        return true;
      }
    } catch {
      // Fallback: direct anchor with download and target="_blank"
      const a = document.createElement('a');
      a.href = remoteUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  }

  // 4. If relative path (/attachments/...)
  if (remoteUrl && remoteUrl.startsWith('/')) {
    const a = document.createElement('a');
    a.href = remoteUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }

  // 5. Fallback informative placeholder if only file metadata exists
  const fallbackContent = `TRADUZTUDO TRADUÇÕES JURAMENTADAS E CERTIFICADAS\n\nArquivo: ${fileName}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nEste arquivo foi registrado na solicitação de orçamento do cliente.`;
  const fallbackBlob = new Blob([fallbackContent], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(fallbackBlob, fileName.endsWith('.txt') ? fileName : `${fileName}.txt`);
  return true;
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
}

