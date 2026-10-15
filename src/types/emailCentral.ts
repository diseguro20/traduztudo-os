export type EmailCategory =
  | 'ORCAMENTO'
  | 'DUVIDA'
  | 'CIDADANIA'
  | 'STATUS_PEDIDO'
  | 'CORPORATIVO'
  | 'OUTROS'
  | 'SPAM';

export type EmailUrgency = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type EmailSentiment = 'POSITIVO' | 'NEUTRO' | 'URGENTE' | 'INSATISFEITO';

export type EmailRecommendedAction =
  | 'RESPONDER'
  | 'SOLICITAR_DOCS'
  | 'CRIAR_ORCAMENTO'
  | 'ENCAMINHAR_HUMANO'
  | 'IGNORAR';

export type EmailMessageStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'DRAFTED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'SENDING'
  | 'SENT'
  | 'REJECTED'
  | 'FAILED'
  | 'MANUAL_REQUIRED';

export interface EmailAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  sha256?: string;
}

export interface EmailClassification {
  category: EmailCategory;
  urgency: EmailUrgency;
  confidence: number; // 0 to 1
  serviceType?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  documentCount?: number;
  deadlineRequested?: string;
  missingInformation: string[];
}

export interface EmailAIAnalysis {
  summary: string;
  sentiment: EmailSentiment;
  recommendedAction: EmailRecommendedAction;
  suggestedDraft: string;
  draftConfidence: number; // 0 to 1
  rationale: string;
  jailbreakAttemptDetected: boolean;
  modelUsed: string;
  processingTimeMs: number;
}

export interface EmailApproval {
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  editedDraft?: string;
  finalBodySent?: string;
  sendMethod?: 'HOSTINGER_API' | 'HOSTINGER_SMTP' | 'RESEND' | 'SIMULATION';
  sentMessageId?: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface EmailAuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  userName?: string;
  details?: string;
}

export interface EmailMessage {
  id: string;
  tenantId: string;
  messageId: string; // RFC 5322 Message-ID for idempotency
  threadId: string;
  inReplyTo?: string;
  references?: string[];
  eventId?: string; // Webhook event ID
  from: {
    name: string;
    email: string;
  };
  to: string[];
  cc?: string[];
  replyTo?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  snippet: string;
  attachments: EmailAttachment[];
  receivedAt: string; // ISO
  status: EmailMessageStatus;
  classification: EmailClassification;
  aiAnalysis: EmailAIAnalysis;
  approval: EmailApproval;
  auditTrail: EmailAuditLogEntry[];
  isAutoSubmitted: boolean;
  linkedQuoteId?: string;
  linkedLeadId?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface HostingerWebhookPayload {
  event?: string;
  event_id?: string;
  timestamp?: number | string;
  account?: string;
  data?: {
    id?: string;
    message_id?: string;
    from?: string | { name?: string; email?: string };
    to?: string | string[] | Array<{ name?: string; email?: string }>;
    cc?: string | string[] | Array<{ name?: string; email?: string }>;
    subject?: string;
    date?: string;
    body_text?: string;
    body_html?: string;
    text?: string;
    html?: string;
    snippet?: string;
    attachments?: Array<{
      name?: string;
      filename?: string;
      mime_type?: string;
      content_type?: string;
      size?: number;
      url?: string;
    }>;
    in_reply_to?: string;
    references?: string | string[];
    headers?: Record<string, string>;
  };
  // Flat format fallback
  id?: string;
  message_id?: string;
  from?: any;
  to?: any;
  subject?: string;
  body_text?: string;
  body_html?: string;
  attachments?: any[];
}
