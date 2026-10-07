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

  // Clean whitespace/newlines
  base64 = base64.replace(/\s/g, '');

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
    console.error('Failed to convert base64 to Blob:', err);
    return new Blob([base64], { type: 'text/plain' });
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
    return inMemoryBlobs.get(id)!;
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

      if (record && record.blob instanceof Blob) {
        inMemoryBlobs.set(id, record.blob);
        return record.blob;
      }
    } catch (err) {
      console.warn('Error reading from IndexedDB:', err);
    }
  }

  // 3. Fallback to provided dataUrl if valid (not truncated)
  if (fallbackDataUrl && typeof fallbackDataUrl === 'string') {
    // Check if it's not a truncated placeholder
    if (fallbackDataUrl.startsWith('data:') && fallbackDataUrl.length > 500) {
      const blob = base64ToBlob(fallbackDataUrl, mimeType || 'application/pdf');
      inMemoryBlobs.set(id, blob);
      // Persist in background
      saveDocumentBlob(id, blob, id, mimeType).catch(() => {});
      return blob;
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
