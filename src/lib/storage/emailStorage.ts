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

// Server-level in-memory cache for ultra-fast local development and resilient fallback
const memoryStore = new Map<string, EmailMessage>();
const processedMessageIds = new Set<string>();

/**
 * Initializes seeds if empty for demonstration and testing.
 */
function getInitialSeedEmails(): EmailMessage[] {
  return [
    {
      id: 'email-seed-1',
      tenantId: 'traduztudo-matriz',
      messageId: '<20261014120000.certidao.venezuela@gmail.com>',
      threadId: 'thread-venezuela-1',
      from: {
        name: 'Maria Valentina Rodriguez',
        email: 'maria.rodriguez.vzla@gmail.com',
      },
      to: ['contato@traduztudo.com'],
      subject: 'Orçamento para Tradução Juramentada — Certidão de Nascimento Venezuela',
      bodyText: 'Olá, boa tarde!\n\nPreciso fazer a tradução juramentada de uma certidão de nascimento venezuelana (SAREN) para português para dar entrada na Polícia Federal no Brasil. Em anexo envio a certidão digitalizada.\n\nQual seria o valor e quanto tempo demora para ficar pronta?\n\nMuito obrigada!',
      snippet: 'Preciso fazer a tradução juramentada de uma certidão de nascimento venezuelana (SAREN) para português para dar entrada na Polícia Federal...',
      attachments: [
        {
          id: 'att-1',
          name: 'Registro_nascimento_venezuela_SAREN.pdf',
          mimeType: 'application/pdf',
          size: 450200,
        },
      ],
      receivedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'AWAITING_APPROVAL',
      classification: {
        category: 'ORCAMENTO',
        urgency: 'MEDIA',
        confidence: 0.98,
        serviceType: 'Tradução Juramentada Oficial',
        sourceLanguage: 'Espanhol',
        targetLanguage: 'Português',
        documentCount: 1,
        missingInformation: ['Confirmação de prazo limite desejado'],
      },
      aiAnalysis: {
        summary: 'Cliente solicita tradução juramentada de Certidão de Nascimento da Venezuela (espanhol para português) para Polícia Federal. 1 anexo em PDF recebido.',
        sentiment: 'POSITIVO',
        recommendedAction: 'CRIAR_ORCAMENTO',
        suggestedDraft: 'Olá Maria Valentina,\n\nAgradecemos pelo contato com a Traduz Tudo!\n\nConfirmamos o recebimento da sua Certidão de Nascimento venezuelana (SAREN) em anexo. Nossa equipe de tradutores juramentados já está analisando o documento para contabilizar a quantidade de laudas oficiais.\n\nPara que possamos finalizar sua proposta personalizada:\n1. A tradução precisa ser entregue em alguma data específica?\n2. Você necessitará apenas da versão digital com assinatura digital autorizada, ou também precisará do envio da via física impressa pelos Correios?\n\nEm instantes nosso comercial encaminhará sua proposta com as melhores condições.\n\nAtenciosamente,\nEquipe Traduz Tudo\ncontato@traduztudo.com',
        draftConfidence: 0.96,
        rationale: 'Solicitação de orçamento com documento anexado. O rascunho confirma o recebimento dos arquivos sem inventar preços e solicita requisitos adicionais para a proposta.',
        jailbreakAttemptDetected: false,
        modelUsed: 'TraduzTudo AI Reasoning Engine v2.0',
        processingTimeMs: 220,
      },
      approval: {},
      auditTrail: [
        {
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          action: 'E-mail recebido via Hostinger Mail Webhook',
          details: 'Mensagem registrada com sucesso sob ID <20261014120000.certidao.venezuela@gmail.com>',
        },
        {
          timestamp: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
          action: 'Análise de Inteligência Artificial Concluída',
          details: 'Classificado como ORCAMENTO com 98% de confiança. Rascunho gerado aguardando aprovação humana.',
        },
      ],
      isAutoSubmitted: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'email-seed-2',
      tenantId: 'traduztudo-matriz',
      messageId: '<20261014153000.cidadania.italiana@outlook.com>',
      threadId: 'thread-cidadania-2',
      from: {
        name: 'Carlos Eduardo Ferrari',
        email: 'carlos.ferrari.adv@outlook.com',
      },
      to: ['contato@traduztudo.com'],
      subject: 'Dúvida sobre Apostilamento de Haia e Cidadania Italiana',
      bodyText: 'Prezados, boa tarde.\n\nEstou montando a pasta de cidadania italiana judicial via Tribunal de Roma para minha família. Vocês realizam o apostilamento de Haia das traduções juramentadas aqui no Brasil? Tenho cerca de 12 certidões de inteiro teor.\n\nComo funciona o procedimento de envio dos documentos e prazo médio?\n\nObrigado,\nCarlos Ferrari',
      snippet: 'Estou montando a pasta de cidadania italiana judicial via Tribunal de Roma para minha família. Vocês realizam o apostilamento de Haia...',
      attachments: [],
      receivedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'AWAITING_APPROVAL',
      classification: {
        category: 'CIDADANIA',
        urgency: 'MEDIA',
        confidence: 0.95,
        serviceType: 'Tradução para Cidadania & Apostilamento',
        sourceLanguage: 'Português',
        targetLanguage: 'Italiano',
        documentCount: 12,
        missingInformation: ['Envio das certidões digitalizadas para contagem de laudas'],
      },
      aiAnalysis: {
        summary: 'Advogado/cliente consulta sobre tradução juramentada e Apostilamento de Haia para 12 certidões em processo de cidadania italiana judicial no Tribunal de Roma.',
        sentiment: 'POSITIVO',
        recommendedAction: 'SOLICITAR_DOCS',
        suggestedDraft: 'Olá Dr. Carlos Ferrari,\n\nAgradecemos por entrar em contato com a Traduz Tudo!\n\nSim, realizamos o serviço completo tanto da Tradução Juramentada para o italiano quanto do Apostilamento de Haia (Convenção da Haia) em cartório oficial parceiro, entregando a pasta 100% pronta e válida perante os Tribunais e Consulados Italianos.\n\nPara elaborarmos uma proposta detalhada com condições especiais para o lote de 12 certidões:\n1. Por gentileza, nos envie as certidões em inteiro teor digitalizadas (em PDF) por aqui ou link de nuvem;\n2. Confirme se as certidões brasileiras originais já foram apostiladas ou se você também precisará do apostilamento dos documentos em português.\n\nNossos tradutores juramentados são devidamente habilitados e emitimos com assinatura digital aceita na Itália ou envio das vias físicas com selo notarial.\n\nEstamos à disposição para agilizar o seu processo!\n\nAtenciosamente,\nSetor de Cidadania Italiana\nTraduz Tudo — contato@traduztudo.com',
        draftConfidence: 0.95,
        rationale: 'Dúvida e pré-orçamento de cidadania italiana. O rascunho responde afirmativamente sobre o apostilamento sem inventar preços e solicita o envio das certidões.',
        jailbreakAttemptDetected: false,
        modelUsed: 'TraduzTudo AI Reasoning Engine v2.0',
        processingTimeMs: 190,
      },
      approval: {},
      auditTrail: [
        {
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          action: 'E-mail recebido via Hostinger Mail Webhook',
          details: 'Mensagem registrada com sucesso sob ID <20261014153000.cidadania.italiana@outlook.com>',
        },
      ],
      isAutoSubmitted: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];
}

// Populate memory store initially
if (memoryStore.size === 0) {
  for (const item of getInitialSeedEmails()) {
    memoryStore.set(item.id, item);
    processedMessageIds.add(item.messageId);
    if (item.eventId) processedMessageIds.add(item.eventId);
  }
}

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
