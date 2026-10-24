import { EmailMessage, EmailMessageStatus } from '@/types/emailCentral';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

const COLLECTION_NAME = 'traduztudo_email_messages';

// Server-level in-memory cache for ultra-fast performance and resilient fallback
// Starts 100% clean and empty. NO dummy or seed data allowed.
const memoryStore = new Map<string, EmailMessage>();
const processedMessageIds = new Set<string>();

export class EmailStorage {
  private static instance: EmailStorage;

  private constructor() {}

  public static getInstance(): EmailStorage {
    if (!EmailStorage.instance) {
      EmailStorage.instance = new EmailStorage();
    }
    return EmailStorage.instance;
  }

  /**
   * Idempotency check: returns true if the message or event was already processed.
   */
  public async hasMessageBeenProcessed(messageId: string, eventId?: string): Promise<boolean> {
    if (!messageId && !eventId) return false;

    // 1. Fast in-memory check
    if (messageId && processedMessageIds.has(messageId)) return true;
    if (eventId && processedMessageIds.has(eventId)) return true;

    // 2. Check in Firestore for persistent serverless reliability
    try {
      if (db) {
        if (messageId) {
          const q = query(
            collection(db, COLLECTION_NAME),
            where('messageId', '==', messageId),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            processedMessageIds.add(messageId);
            return true;
          }
        }

        if (eventId) {
          const q = query(
            collection(db, COLLECTION_NAME),
            where('eventId', '==', eventId),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            processedMessageIds.add(eventId);
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('[EmailStorage] Firestore idempotency lookup warning:', e);
    }

    return false;
  }

  /**
   * Saves a new inbound email atomically.
   */
  public async saveEmail(email: EmailMessage): Promise<EmailMessage> {
    memoryStore.set(email.id, email);
    if (email.messageId) processedMessageIds.add(email.messageId);
    if (email.eventId) processedMessageIds.add(email.eventId);

    // Save to Firestore
    try {
      if (db) {
        const docRef = doc(db, COLLECTION_NAME, email.id);
        await setDoc(docRef, JSON.parse(JSON.stringify(email)), { merge: true });
      }
    } catch (e) {
      console.warn('[EmailStorage] Firestore save warning (using memory storage):', e);
    }

    return email;
  }

  /**
   * Updates an existing email (e.g. status transition, approval, draft edit).
   */
  public async updateEmail(id: string, updates: Partial<EmailMessage>): Promise<EmailMessage | null> {
    const existing = await this.getEmailById(id);
    if (!existing) return null;

    const merged: EmailMessage = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.set(id, merged);

    try {
      if (db) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await setDoc(docRef, JSON.parse(JSON.stringify(merged)), { merge: true });
      }
    } catch (e) {
      console.warn('[EmailStorage] Firestore update warning:', e);
    }

    return merged;
  }

  /**
   * Finds an email by ID.
   */
  public async getEmailById(id: string): Promise<EmailMessage | null> {
    if (memoryStore.has(id)) {
      return memoryStore.get(id)!;
    }

    try {
      if (db) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as EmailMessage;
          memoryStore.set(id, data);
          return data;
        }
      }
    } catch (e) {
      console.warn('[EmailStorage] Firestore getDoc warning:', e);
    }

    return null;
  }

  /**
   * Lists emails with optional filtering by status, category, search, and pagination.
   */
  public async listEmails(filters?: {
    status?: EmailMessageStatus | 'ALL';
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<EmailMessage[]> {
    let results: EmailMessage[] = [];

    // Try loading from Firestore first
    try {
      if (db) {
        const q = query(collection(db, COLLECTION_NAME), limit(filters?.limit || 100));
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach((d) => {
            const item = d.data() as EmailMessage;
            if (!item.isDeleted) {
              results.push(item);
              memoryStore.set(item.id, item);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[EmailStorage] Firestore list fallback to memory store:', e);
    }

    // If Firestore yielded nothing, use in-memory store
    if (results.length === 0) {
      results = Array.from(memoryStore.values()).filter((e) => !e.isDeleted);
    }

    // Sort descending by receivedAt
    results.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    // Apply filters
    if (filters?.status && filters.status !== 'ALL') {
      results = results.filter((e) => e.status === filters.status);
    }

    if (filters?.category && filters.category !== 'ALL') {
      results = results.filter((e) => e.classification.category === filters.category);
    }

    if (filters?.search) {
      const term = filters.search.toLowerCase().trim();
      results = results.filter(
        (e) =>
          e.subject.toLowerCase().includes(term) ||
          e.from.name.toLowerCase().includes(term) ||
          e.from.email.toLowerCase().includes(term) ||
          e.bodyText.toLowerCase().includes(term)
      );
    }

    return results;
  }

  /**
   * Completely deletes an email from storage.
   */
  public async deleteEmail(id: string): Promise<boolean> {
    memoryStore.delete(id);
    try {
      if (db) {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      }
    } catch (e) {
      console.warn('[EmailStorage] Firestore deleteEmail error:', e);
    }
    return true;
  }

  /**
   * LGPD: Deletes or anonymizes an email message.
   */
  public async deleteOrAnonymize(id: string): Promise<boolean> {
    const existing = await this.getEmailById(id);
    if (!existing) return false;

    // Mark as deleted and clear personal info
    const anonymized: EmailMessage = {
      ...existing,
      from: { name: 'Cliente Anonimizado (LGPD)', email: 'anonimizado@lgpd.local' },
      bodyText: '[Conteúdo Excluído conforme solicitação LGPD]',
      bodyHtml: '<p>[Conteúdo Excluído conforme solicitação LGPD]</p>',
      snippet: '[Excluído LGPD]',
      attachments: [],
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    };

    memoryStore.set(id, anonymized);

    try {
      if (db) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      }
    } catch (e) {
      console.warn('[EmailStorage] Firestore deletion note:', e);
    }

    return true;
  }
}

export const emailStorage = EmailStorage.getInstance();
