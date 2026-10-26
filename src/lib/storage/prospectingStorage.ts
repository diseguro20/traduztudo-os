import {
  ProspectCompany,
  ProspectStage,
  ProspectSegment,
  ProspectActivity,
  OutreachCampaign,
  OutboundMessageRecord,
  InboundProspectReply,
  SuppressionRecord,
  ProspectingSettings,
  ProspectingDashboardStats,
} from '@/types/prospecting';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';

const COLLECTIONS = {
  COMPANIES: 'traduztudo_prospect_companies',
  CAMPAIGNS: 'traduztudo_prospect_campaigns',
  OUTBOUND: 'traduztudo_prospect_outbound',
  INBOUND: 'traduztudo_prospect_inbound',
  SUPPRESSION: 'traduztudo_prospect_suppression',
  SETTINGS: 'traduztudo_prospect_settings',
};

// In-memory cache for ultra-fast serverless execution and resilient fallback
const companiesStore = new Map<string, ProspectCompany>();
const campaignsStore = new Map<string, OutreachCampaign>();
const outboundStore = new Map<string, OutboundMessageRecord>();
const inboundStore = new Map<string, InboundProspectReply>();
const suppressionStore = new Map<string, SuppressionRecord>();

// Pre-populate default campaigns
function getDefaultCampaigns(): OutreachCampaign[] {
  return [
    {
      id: 'camp-cidadania',
      tenantId: 'traduztudo-matriz',
      name: 'Campanha Cidadania Italiana & Europeia B2B',
      segment: 'CIDADANIA_ITALIANA',
      targetStates: ['ALL'],
      status: 'ACTIVE',
      subjectTemplate: 'Tradução Juramentada, técnica e simultânea — {{company_name}} & Traduz Tudo',
      bodyTemplate:
        'Olá equipe da {{company_name}},\n\n' +
        'Notamos o excelente trabalho de assessoria que vocês realizam com processos de cidadania.\n\n' +
        'Somos a Traduz Tudo, especializados em Traduções Juramentadas para italiano e demais idiomas europeus, com tradutores habilitados na Junta Comercial e integração de Apostilamento de Haia.\n\n' +
        'Oferecemos tabela exclusiva para assessorias parceiras com entrega rápida (física e digital com assinatura eletrônica aceita nos tribunais e consulados).\n\n' +
        'Podemos agendar uma breve conversa ou enviar nossa tabela de parceiros?\n\n' +
        'Atenciosamente,\n' +
        'Comercial Traduz Tudo\n' +
        'contato@traduztudo.com | www.traduztudo.com\n' +
        'WhatsApp: +55 (11) 94748-5091',
      dailyLimit: 25,
      sentCount: 0,
      deliveredCount: 0,
      replyCount: 0,
      interestedCount: 0,
      createdAt: '2026-10-16T10:00:00.000Z',
      updatedAt: '2026-10-16T10:00:00.000Z',
    },
    {
      id: 'camp-comex',
      tenantId: 'traduztudo-matriz',
      name: 'Campanha Comércio Exterior & Jurídico Internacional',
      segment: 'COMERCIO_EXTERIOR',
      targetStates: ['ALL'],
      status: 'ACTIVE',
      subjectTemplate: 'Tradução Juramentada, técnica e simultânea — {{company_name}} & Traduz Tudo',
      bodyTemplate:
        'Prezados da {{company_name}},\n\n' +
        'A Traduz Tudo apoia empresas de Comércio Exterior e escritórios internacionais na tradução juramentada e técnica de contratos, faturas, certidões e relatórios com total rigor terminológico e validade internacional.\n\n' +
        'Atendemos demandas corporativas com prazos urgentes, emissão de nota fiscal empresarial e faturamento para PJ.\n\n' +
        'Gostariam de receber nossa apresentação institucional para futuras cotações?\n\n' +
        'Um abraço,\n' +
        'Equipe Traduz Tudo\n' +
        'contato@traduztudo.com | www.traduztudo.com\n' +
        'WhatsApp: +55 (11) 94748-5091',
      dailyLimit: 25,
      sentCount: 0,
      deliveredCount: 0,
      replyCount: 0,
      interestedCount: 0,
      createdAt: '2026-10-16T10:00:00.000Z',
      updatedAt: '2026-10-16T10:00:00.000Z',
    },
  ];
}

const defaultSettings: ProspectingSettings = {
  id: 'settings-default',
  tenantId: 'traduztudo-matriz',
  dailyDiscoveryTarget: 100,
  dailySendLimit: 200,
  intervalMinutes: 10,
  autoSendEligible: true, // Controlled autonomous daily outreach (Target: 200/day distributed in safe batches)
  warmupMode: false, // Set to true for new domains, or false for immediate 200/day capacity
  warmupDay: 14,
  senderName: 'Iago Peixoto | Traduz Tudo',
  senderEmail: 'contato@traduztudo.com',
  replyToEmail: 'contato@traduztudo.com',
  activeSegments: [
    'CIDADANIA_ITALIANA',
    'CIDADANIA_PORTUGUESA_ESPANHOLA',
    'VISTOS_IMIGRACAO',
    'INTERCAMBIO',
    'ADVOCACIA_INTERNACIONAL',
    'COMERCIO_EXTERIOR',
    'IMPORTACAO_EXPORTACAO',
    'CONSULTORIA_INTERNACIONAL',
  ],
  targetStates: ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'DF', 'BA'],
  allowedSources: ['BUSCA_PUBLICA', 'DIRETORIO_EMPRESARIAL', 'BRASIL_API'],
  customSearchKeywords: [],
  enableHostingerSmtp: true,
  circuitBreakerTripped: false,
  createdAt: '2026-10-16T10:00:00.000Z',
  updatedAt: '2026-10-16T10:00:00.000Z',
};

let currentSettings: ProspectingSettings = { ...defaultSettings };

export class ProspectingStorage {
  private static instance: ProspectingStorage;

  private constructor() {
    for (const c of getDefaultCampaigns()) {
      campaignsStore.set(c.id, c);
    }
  }

  public static getInstance(): ProspectingStorage {
    if (!ProspectingStorage.instance) {
      ProspectingStorage.instance = new ProspectingStorage();
    }
    return ProspectingStorage.instance;
  }

  // --- Settings ---
  public async getSettings(): Promise<ProspectingSettings> {
    try {
      if (db) {
        const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'default'));
        if (snap.exists()) {
          currentSettings = { ...currentSettings, ...(snap.data() as ProspectingSettings) };
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Failed to fetch settings from Firestore, using memory:', e);
    }
    return currentSettings;
  }

  public async updateSettings(updates: Partial<ProspectingSettings>): Promise<ProspectingSettings> {
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    currentSettings = {
      ...currentSettings,
      ...cleanUpdates,
      updatedAt: new Date().toISOString(),
    };
    try {
      if (db) {
        const serialized = JSON.parse(JSON.stringify(currentSettings));
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default'), serialized, { merge: true });
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Failed to persist settings to Firestore:', e);
    }
    return currentSettings;
  }

  // --- Deduplication & Existence Checks ---
  public async hasCompany(cnpj?: string, domain?: string, email?: string): Promise<boolean> {
    const cleanCnpj = cnpj?.replace(/\D/g, '');
    const cleanDomain = domain?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
    const cleanEmail = email?.toLowerCase().trim();

    // 1. Fast in-memory check
    for (const company of companiesStore.values()) {
      if (cleanCnpj && company.cnpj && company.cnpj.replace(/\D/g, '') === cleanCnpj) return true;
      if (cleanEmail && company.contactEmail.toLowerCase().trim() === cleanEmail) return true;
      if (cleanDomain && company.website) {
        const compDomain = company.website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
        if (compDomain && compDomain === cleanDomain) return true;
      }
    }

    // 2. Check Firestore
    try {
      if (db) {
        if (cleanCnpj) {
          const q = query(collection(db, COLLECTIONS.COMPANIES), where('cnpj', '==', cnpj), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) return true;
        }
        if (cleanEmail) {
          const q = query(collection(db, COLLECTIONS.COMPANIES), where('contactEmail', '==', cleanEmail), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) return true;
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore check error:', e);
    }

    return false;
  }

  // --- Suppression / Opt-Out List (LGPD) ---
  public async isSuppressed(email: string, domain?: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanDomain = domain?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim() || cleanEmail.split('@')[1];

    if (suppressionStore.has(cleanEmail)) return true;
    if (cleanDomain && suppressionStore.has(`domain:${cleanDomain}`)) return true;

    try {
      if (db) {
        const qEmail = query(collection(db, COLLECTIONS.SUPPRESSION), where('email', '==', cleanEmail), limit(1));
        const snap = await getDocs(qEmail);
        if (!snap.empty) {
          suppressionStore.set(cleanEmail, snap.docs[0].data() as SuppressionRecord);
          return true;
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Suppression check warning:', e);
    }

    return false;
  }

  public async addToSuppression(email: string, domain?: string, reason: SuppressionRecord['reason'] = 'OPTOUT', notes?: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    const rec: SuppressionRecord = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: 'traduztudo-matriz',
      email: cleanEmail,
      domain,
      reason,
      addedAt: new Date().toISOString(),
      notes,
    };
    suppressionStore.set(cleanEmail, rec);

    // Also update any existing company matching this email
    for (const [id, comp] of companiesStore.entries()) {
      if (comp.contactEmail.toLowerCase().trim() === cleanEmail) {
        comp.status = 'DESCADASTRO';
        comp.optOut = true;
        comp.optOutAt = rec.addedAt;
        comp.activities.push({
          id: `act-${Date.now()}`,
          companyId: id,
          type: 'OPT_OUT',
          description: `Contato descadastrado e adicionado à lista de supressão (LGPD). Motivo: ${reason}`,
          timestamp: rec.addedAt,
          actor: 'SYSTEM',
        });
        companiesStore.set(id, comp);
      }
    }

    try {
      if (db) {
        await setDoc(doc(db, COLLECTIONS.SUPPRESSION, rec.id), rec);
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Failed to save suppression to Firestore:', e);
    }
  }

  public async listSuppressed(): Promise<SuppressionRecord[]> {
    return Array.from(suppressionStore.values());
  }

  // --- Companies CRUD ---
  public async saveCompany(company: ProspectCompany): Promise<ProspectCompany> {
    companiesStore.set(company.id, company);
    try {
      if (db) {
        await setDoc(doc(db, COLLECTIONS.COMPANIES, company.id), JSON.parse(JSON.stringify(company)), { merge: true });
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore save company warning:', e);
    }
    return company;
  }

  public async updateCompany(id: string, updates: Partial<ProspectCompany>): Promise<ProspectCompany | null> {
    const existing = await this.getCompanyById(id);
    if (!existing) return null;

    const updated: ProspectCompany = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    companiesStore.set(id, updated);
    try {
      if (db) {
        await setDoc(doc(db, COLLECTIONS.COMPANIES, id), JSON.parse(JSON.stringify(updated)), { merge: true });
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore update company warning:', e);
    }
    return updated;
  }

  public async getCompanyById(id: string): Promise<ProspectCompany | null> {
    if (companiesStore.has(id)) return companiesStore.get(id)!;
    try {
      if (db) {
        const snap = await getDoc(doc(db, COLLECTIONS.COMPANIES, id));
        if (snap.exists()) {
          const comp = snap.data() as ProspectCompany;
          companiesStore.set(id, comp);
          return comp;
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore getCompanyById error:', e);
    }
    return null;
  }

  public async getCompanyByEmail(email: string): Promise<ProspectCompany | null> {
    const clean = email.toLowerCase().trim();
    for (const comp of companiesStore.values()) {
      if (comp.contactEmail.toLowerCase().trim() === clean) return comp;
    }
    try {
      if (db) {
        const q = query(collection(db, COLLECTIONS.COMPANIES), where('contactEmail', '==', clean), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const comp = snap.docs[0].data() as ProspectCompany;
          companiesStore.set(comp.id, comp);
          return comp;
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore getCompanyByEmail error:', e);
    }
    return null;
  }

  public async listCompanies(filters?: {
    segment?: ProspectSegment | 'ALL';
    status?: ProspectStage | 'ALL';
    state?: string | 'ALL';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ProspectCompany[]; total: number }> {
    let list: ProspectCompany[] = [];

    try {
      if (db) {
        let q;
        if (filters?.status && filters.status !== 'ALL') {
          q = query(collection(db, COLLECTIONS.COMPANIES), where('status', '==', filters.status), limit(filters?.limit || 500));
        } else {
          q = query(collection(db, COLLECTIONS.COMPANIES), limit(1500));
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach((d) => {
            const item = d.data() as ProspectCompany;
            companiesStore.set(item.id, item);
          });
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore list fallback:', e);
    }

    list = Array.from(companiesStore.values());

    // Sort descending by discoveredAt / createdAt
    list.sort((a, b) => new Date(b.discoveredAt || b.createdAt).getTime() - new Date(a.discoveredAt || a.createdAt).getTime());

    // Filter
    if (filters?.segment && filters.segment !== 'ALL') {
      list = list.filter((c) => c.segment === filters.segment);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters?.state && filters.state !== 'ALL') {
      list = list.filter((c) => c.state === filters.state);
    }
    if (filters?.search) {
      const term = filters.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.tradeName?.toLowerCase().includes(term) ||
          c.contactEmail.toLowerCase().includes(term) ||
          c.city.toLowerCase().includes(term) ||
          c.cnpj?.includes(term)
      );
    }

    const total = list.length;
    const offset = filters?.offset || 0;
    const pageLimit = filters?.limit || 100;
    const paged = list.slice(offset, offset + pageLimit);

    return { items: paged, total };
  }

  public async ensureCompaniesHydrated(limitCount = 1500): Promise<void> {
    try {
      if (db) {
        const q = query(collection(db, COLLECTIONS.COMPANIES), limit(limitCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach((d) => {
            const item = d.data() as ProspectCompany;
            companiesStore.set(item.id, item);
          });
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore hydration notice:', e);
    }
  }

  // --- Campaign Eligible Prospects Query ---
  public async getEligibleProspectsForCampaign(campaignSegment?: ProspectSegment | 'ALL', limitCount = 30): Promise<ProspectCompany[]> {
    if (db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.COMPANIES),
          where('status', 'in', ['DESCOBERTA', 'CONTATO_VERIFICADO', 'ELEGIBILIDADE_CONFIRMADA', 'CAMPANHA_PROGRAMADA']),
          limit(Math.max(limitCount * 5, 200))
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach((d) => {
            const item = d.data() as ProspectCompany;
            companiesStore.set(item.id, item);
          });
        }
      } catch (e) {
        console.warn('[ProspectingStorage] Firestore eligible query fallback:', e);
        await this.ensureCompaniesHydrated(1500);
      }
    } else {
      await this.ensureCompaniesHydrated(1500);
    }

    const list = Array.from(companiesStore.values());
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const eligible = list.filter((comp) => {
      // 1. Must not be opted out
      if (comp.optOut || comp.status === 'DESCADASTRO' || comp.status === 'NAO_CONTACTAR' || comp.status === 'CONTATO_INVALIDO') {
        return false;
      }
      // 2. Must have valid contact email
      if (!comp.contactEmail || !comp.contactEmail.includes('@')) {
        return false;
      }
      // 3. Segment filter if specified
      if (campaignSegment && campaignSegment !== 'ALL' && comp.segment !== campaignSegment) {
        return false;
      }
      // 4. Must be in eligible stage
      const validStages: ProspectStage[] = ['DESCOBERTA', 'CONTATO_VERIFICADO', 'ELEGIBILIDADE_CONFIRMADA', 'CAMPANHA_PROGRAMADA'];
      if (!validStages.includes(comp.status)) {
        return false;
      }
      // 5. Anti-spam interval: no send in last 30 days
      if (comp.lastContactedAt && new Date(comp.lastContactedAt).getTime() > thirtyDaysAgo) {
        return false;
      }

      return true;
    });

    return eligible.slice(0, limitCount);
  }

  // --- Activity Log ---
  public async addActivity(companyId: string, activity: Omit<ProspectActivity, 'id' | 'companyId' | 'timestamp'>): Promise<void> {
    const comp = await this.getCompanyById(companyId);
    if (!comp) return;

    const newAct: ProspectActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      companyId,
      timestamp: new Date().toISOString(),
      ...activity,
    };

    comp.activities.unshift(newAct);
    await this.updateCompany(companyId, { activities: comp.activities });
  }

  // --- Campaigns CRUD ---
  public async listCampaigns(): Promise<OutreachCampaign[]> {
    return Array.from(campaignsStore.values());
  }

  public async getCampaignById(id: string): Promise<OutreachCampaign | null> {
    return campaignsStore.get(id) || null;
  }

  public async saveCampaign(campaign: OutreachCampaign): Promise<OutreachCampaign> {
    campaignsStore.set(campaign.id, campaign);
    try {
      if (db) {
        await setDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaign.id), JSON.parse(JSON.stringify(campaign)), { merge: true });
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Failed to save campaign:', e);
    }
    return campaign;
  }

  public async updateCampaign(id: string, updates: Partial<OutreachCampaign>): Promise<OutreachCampaign | null> {
    const existing = campaignsStore.get(id);
    if (!existing) return null;
    const updated: OutreachCampaign = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    campaignsStore.set(id, updated);
    try {
      if (db) {
        await setDoc(doc(db, COLLECTIONS.CAMPAIGNS, id), JSON.parse(JSON.stringify(updated)), { merge: true });
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Failed to update campaign:', e);
    }
    return updated;
  }

  // --- Outbound Messages & Replies ---
  public async saveOutboundMessage(record: OutboundMessageRecord): Promise<OutboundMessageRecord> {
    outboundStore.set(record.id, record);
    try {
      if (db) {
        await setDoc(doc(db, COLLECTIONS.OUTBOUND, record.id), JSON.parse(JSON.stringify(record)), { merge: true });
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Failed to save outbound message:', e);
    }
    return record;
  }

  public async listOutboundMessages(companyId?: string, limitCount = 50): Promise<OutboundMessageRecord[]> {
    try {
      if (db) {
        const q = query(collection(db, COLLECTIONS.OUTBOUND), orderBy('sentAt', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach((d) => {
            const item = d.data() as OutboundMessageRecord;
            outboundStore.set(item.id, item);
          });
        }
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Firestore listOutboundMessages fallback:', e);
    }
    let all = Array.from(outboundStore.values());
    if (companyId) {
      all = all.filter((m) => m.companyId === companyId);
    }
    return all.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).slice(0, limitCount);
  }

  public async saveInboundReply(reply: InboundProspectReply): Promise<InboundProspectReply> {
    inboundStore.set(reply.id, reply);
    try {
      if (db) {
        await setDoc(doc(db, COLLECTIONS.INBOUND, reply.id), JSON.parse(JSON.stringify(reply)), { merge: true });
      }
    } catch (e) {
      console.warn('[ProspectingStorage] Failed to save inbound reply:', e);
    }
    return reply;
  }

  public async listInboundReplies(limitCount = 50): Promise<InboundProspectReply[]> {
    return Array.from(inboundStore.values())
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, limitCount);
  }

  // --- Comprehensive Dashboard Stats ---
  public async getDashboardStats(): Promise<ProspectingDashboardStats> {
    await this.ensureCompaniesHydrated(1500);
    const companies = Array.from(companiesStore.values());
    const total = companies.length;
    // Use Brasília timezone (UTC-3) for accurate day calculation
    const brtDate = new Date(Date.now() - 3 * 3600 * 1000);
    const todayStr = brtDate.toISOString().split('T')[0];

    const newToday = companies.filter((c) => (c.discoveredAt || c.createdAt) && (c.discoveredAt || c.createdAt).includes(todayStr)).length;
    const sentToday = companies.filter((c) => c.lastContactedAt && c.lastContactedAt.includes(todayStr)).length;
    const validContacts = companies.filter((c) => !!c.contactEmail && c.status !== 'CONTATO_INVALIDO').length;
    const eligible = companies.filter((c) => ['CONTATO_VERIFICADO', 'ELEGIBILIDADE_CONFIRMADA', 'CAMPANHA_PROGRAMADA'].includes(c.status) && !c.optOut).length;
    const sent = companies.filter((c) => ['EMAIL_ENVIADO', 'RESPOSTA_RECEBIDA', 'LEAD_QUALIFICADO', 'ORCAMENTO', 'NEGOCIACAO', 'CLIENTE'].includes(c.status)).length;
    const replies = companies.filter((c) => ['RESPOSTA_RECEBIDA', 'LEAD_QUALIFICADO', 'ORCAMENTO', 'NEGOCIACAO', 'CLIENTE'].includes(c.status)).length;
    const interested = companies.filter((c) => ['LEAD_QUALIFICADO', 'ORCAMENTO', 'NEGOCIACAO', 'CLIENTE'].includes(c.status)).length;
    const quotes = companies.filter((c) => ['ORCAMENTO', 'NEGOCIACAO', 'CLIENTE'].includes(c.status)).length;
    const clients = companies.filter((c) => c.status === 'CLIENTE').length;
    const optOut = companies.filter((c) => c.optOut || c.status === 'DESCADASTRO').length;
    const failures = Array.from(outboundStore.values()).filter((m) => m.status === 'FAILED' || m.status === 'BOUNCED').length;

    const conversionRate = sent > 0 ? Number(((clients / sent) * 100).toFixed(1)) : 0;
    const responseRate = sent > 0 ? Number(((replies / sent) * 100).toFixed(1)) : 0;

    const hasSmtp = !!process.env.HOSTINGER_SMTP_PASS;
    const settings = await this.getSettings();

    return {
      totalCompanies: total,
      newCompaniesToday: newToday,
      validContactsCount: validContacts,
      eligibleCount: eligible,
      emailsSent: sent,
      emailsSentToday: sentToday,
      deliveredCount: sent,
      repliesReceived: replies,
      interestedCount: interested,
      quotesRequested: quotes,
      proposalsApproved: clients,
      convertedClients: clients,
      sendFailures: failures,
      optOutCount: optOut,
      conversionRate,
      responseRate,
      hostingerSmtpOnline: hasSmtp,
      autoSendActive: settings.autoSendEligible,
    };
  }
}

export const prospectingStorage = ProspectingStorage.getInstance();
