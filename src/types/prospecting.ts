export type ProspectSegment =
  | 'CIDADANIA_ITALIANA'
  | 'CIDADANIA_PORTUGUESA_ESPANHOLA'
  | 'VISTOS_IMIGRACAO'
  | 'INTERCAMBIO'
  | 'ENSINO_INTERNACIONAL'
  | 'ADVOCACIA_INTERNACIONAL'
  | 'COMERCIO_EXTERIOR'
  | 'IMPORTACAO_EXPORTACAO'
  | 'CONSULTORIA_INTERNACIONAL'
  | 'MULTINACIONAL'
  | 'RECRUTAMENTO_INTERNACIONAL'
  | 'TURISMO_CORPORATIVO';

export const PROSPECT_SEGMENT_LABELS: Record<ProspectSegment, string> = {
  CIDADANIA_ITALIANA: 'Assessoria de Cidadania Italiana',
  CIDADANIA_PORTUGUESA_ESPANHOLA: 'Assessoria de Cidadania Portuguesa / Espanhola',
  VISTOS_IMIGRACAO: 'Vistos e Imigração',
  INTERCAMBIO: 'Agência de Intercâmbio',
  ENSINO_INTERNACIONAL: 'Instituição de Ensino Internacional',
  ADVOCACIA_INTERNACIONAL: 'Advocacia Internacional',
  COMERCIO_EXTERIOR: 'Comércio Exterior (COMEX)',
  IMPORTACAO_EXPORTACAO: 'Importação & Exportação',
  CONSULTORIA_INTERNACIONAL: 'Consultoria Empresarial Internacional',
  MULTINACIONAL: 'Empresa Multinacional',
  RECRUTAMENTO_INTERNACIONAL: 'Recrutamento Internacional',
  TURISMO_CORPORATIVO: 'Turismo Corporativo e Negócios',
};

export type ProspectStage =
  | 'DESCOBERTA'
  | 'CONTATO_PENDENTE'
  | 'CONTATO_VERIFICADO'
  | 'ELEGIBILIDADE_CONFIRMADA'
  | 'CAMPANHA_PROGRAMADA'
  | 'EMAIL_ENVIADO'
  | 'RESPOSTA_RECEBIDA'
  | 'LEAD_QUALIFICADO'
  | 'ORCAMENTO'
  | 'NEGOCIACAO'
  | 'CLIENTE'
  // Exception states
  | 'CONTATO_INVALIDO'
  | 'NAO_CONTACTAR'
  | 'DESCADASTRO'
  | 'CAMPANHA_PAUSADA'
  | 'SEM_INTERESSE';

export const PROSPECT_STAGE_LABELS: Record<ProspectStage, { label: string; color: string }> = {
  DESCOBERTA: { label: 'Descoberta', color: 'slate' },
  CONTATO_PENDENTE: { label: 'Pendente de Verificação', color: 'amber' },
  CONTATO_VERIFICADO: { label: 'Contato Verificado', color: 'blue' },
  ELEGIBILIDADE_CONFIRMADA: { label: 'Elegibilidade Confirmada', color: 'indigo' },
  CAMPANHA_PROGRAMADA: { label: 'Campanha Programada', color: 'amber' },
  EMAIL_ENVIADO: { label: 'E-mail Enviado', color: 'cyan' },
  RESPOSTA_RECEBIDA: { label: 'Resposta Recebida', color: 'purple' },
  LEAD_QUALIFICADO: { label: 'Lead Qualificado', color: 'emerald' },
  ORCAMENTO: { label: 'Orçamento Solicitado', color: 'orange' },
  NEGOCIACAO: { label: 'Em Negociação', color: 'teal' },
  CLIENTE: { label: 'Cliente Convertido', color: 'green' },
  CONTATO_INVALIDO: { label: 'Contato Inválido', color: 'rose' },
  NAO_CONTACTAR: { label: 'Não Contactar', color: 'red' },
  DESCADASTRO: { label: 'Descadastrado (LGPD)', color: 'zinc' },
  CAMPANHA_PAUSADA: { label: 'Pausado', color: 'yellow' },
  SEM_INTERESSE: { label: 'Sem Interesse', color: 'gray' },
};

export type LegalBasis = 'LEGITIMATE_INTEREST' | 'CONSENT' | 'PRE_CONTRACTUAL';

export interface ProspectActivity {
  id: string;
  companyId: string;
  type:
    | 'DISCOVERY'
    | 'EMAIL_SENT'
    | 'REPLY_RECEIVED'
    | 'STATUS_CHANGE'
    | 'NOTE_ADDED'
    | 'LEAD_CONVERTED'
    | 'OPT_OUT';
  description: string;
  timestamp: string;
  actor: 'AI_AGENT' | 'SYSTEM' | string;
  metadata?: Record<string, any>;
}

export interface ProspectCompany {
  id: string;
  tenantId: string;
  name: string; // Razão Social ou Nome Fantasia
  tradeName?: string; // Nome Fantasia
  cnpj?: string;
  segment: ProspectSegment;
  city: string;
  state: string; // UF
  website?: string;
  contactEmail: string;
  phone?: string;
  whatsapp?: string;
  contactPageUrl?: string;
  contactPerson?: {
    name?: string;
    role?: string;
    email?: string;
  };
  source: 'BRASIL_API' | 'RECEITA_FEDERAL' | 'BUSCA_PUBLICA' | 'DIRETORIO_EMPRESARIAL' | 'MANUAL';
  discoveredAt: string;
  status: ProspectStage;
  fitScore: number; // 0 a 100
  relevantServices: string[];
  targetLanguages: string[];
  aiAnalysis: {
    summary: string;
    reasoning: string;
    suggestedHook: string;
  };
  campaignId?: string;
  lastContactedAt?: string;
  contactCount: number;
  optOut: boolean;
  optOutAt?: string;
  legalBasis: LegalBasis;
  activities: ProspectActivity[];
  convertedLeadId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachCampaign {
  id: string;
  tenantId: string;
  name: string;
  segment: ProspectSegment | 'ALL';
  targetStates: string[]; // ['SP', 'RJ', 'PR'] or ['ALL']
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT';
  subjectTemplate: string;
  bodyTemplate: string;
  dailyLimit: number; // e.g. 20
  sentCount: number;
  deliveredCount: number;
  replyCount: number;
  interestedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundMessageRecord {
  id: string;
  tenantId: string;
  campaignId: string;
  companyId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  messageId: string;
  sentAt: string;
  status: 'SENT' | 'FAILED' | 'BOUNCED';
  error?: string;
  idempotencyKey: string;
}

export type ProspectReplyClassification =
  | 'INTERESSE_PARCERIA'
  | 'SOLICITACAO_ORCAMENTO'
  | 'PEDIDO_APRESENTACAO'
  | 'PEDIDO_INFORMACOES'
  | 'SEM_INTERESSE'
  | 'SOLICITACAO_REMOCAO'
  | 'RESPOSTA_AUTOMATICA'
  | 'ERRO_ENTREGA';

export interface InboundProspectReply {
  id: string;
  tenantId: string;
  companyId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  bodyText: string;
  classification: ProspectReplyClassification;
  confidence: number;
  suggestedFollowUp?: string;
  receivedAt: string;
  processed: boolean;
  convertedToLead: boolean;
}

export interface SuppressionRecord {
  id: string;
  tenantId: string;
  email: string;
  domain?: string;
  reason: 'OPTOUT' | 'BOUNCE' | 'COMPLAINT' | 'MANUAL';
  addedAt: string;
  notes?: string;
}

export interface ProspectingSettings {
  id: string;
  tenantId: string;
  dailyDiscoveryTarget: number; // default 100
  dailySendLimit: number; // default 200
  intervalMinutes: number; // default 5
  autoSendEligible: boolean; // default true
  warmupMode?: boolean; // Gradual volume ramp-up to protect domain reputation
  warmupDay?: number; // Current day in the warm-up cycle (1 to 14)
  senderName: string;
  senderEmail: string; // contato@traduztudo.com
  replyToEmail: string;
  activeSegments: ProspectSegment[];
  targetStates: string[]; // UFs
  allowedSources?: Array<'BUSCA_PUBLICA' | 'DIRETORIO_EMPRESARIAL' | 'BRASIL_API'>;
  customSearchKeywords?: string[];
  enableHostingerSmtp: boolean;
  circuitBreakerTripped: boolean;
  lastCronRunAt?: string;
  lastDiscoveryCount?: number;
  lastDispatchCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectingDashboardStats {
  totalCompanies: number;
  newCompaniesToday: number;
  validContactsCount: number;
  eligibleCount: number;
  emailsSent: number; // Total histórico acumulado
  emailsSentToday: number; // Disparados especificamente hoje
  deliveredCount: number;
  repliesReceived: number;
  interestedCount: number;
  quotesRequested: number;
  proposalsApproved: number;
  convertedClients: number;
  sendFailures: number;
  optOutCount: number;
  conversionRate: number;
  responseRate: number;
  hostingerSmtpOnline: boolean;
  autoSendActive: boolean;
}
