export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'FINANCE'
  | 'ATTENDANT'
  | 'TRANSLATOR'
  | 'REVIEWER'
  | 'VIEWER';

export type SaaSPlan = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  document: string; // CNPJ / CPF
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  logoUrl?: string;
  plan: SaaSPlan;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  active: boolean;
  permissions?: string[];
  lastLoginAt?: string;
  createdAt: string;
}

export type CustomerType = 'PF' | 'PJ';

export interface Customer {
  id: string;
  tenantId: string;
  type: CustomerType;
  // PF
  name: string;
  cpf?: string;
  // PJ
  companyName?: string;
  tradeName?: string;
  cnpj?: string;
  contactPerson?: string;
  // Contact
  email: string;
  phone: string;
  whatsapp?: string;
  // Address
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  // Metrics & metadata
  notes?: string;
  totalSpent: number;
  ordersCount: number;
  activeOrdersCount: number;
  pendingBalance: number;
  lastContactAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type LeadStatus =
  | 'novo'
  | 'contato_realizado'
  | 'orcamento_solicitado'
  | 'orcamento_enviado'
  | 'negociacao'
  | 'convertido'
  | 'perdido';

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  type: CustomerType;
  email: string;
  phone: string;
  whatsapp?: string;
  origin: string; // 'Site TraduzTudo', 'Indicação', 'Google', 'WhatsApp', etc.
  interestedServiceId?: string;
  interestedServiceName?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  estimatedVolume?: string;
  notes?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  status: LeadStatus;
  customerId?: string; // if converted
  quoteId?: string; // if quote generated
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type BillingUnit =
  | 'palavra'
  | 'pagina'
  | 'lauda'
  | 'caractere'
  | 'documento'
  | 'hora'
  | 'servico_fechado';

export interface TranslationService {
  id: string;
  tenantId: string;
  name: string;
  code: string; // 'juramentada', 'certificada', 'tecnica', 'simples', 'revisao', 'apostilamento'
  description: string;
  unit: BillingUnit;
  defaultPrice: number;
  defaultTurnaroundDays: number;
  active: boolean;
  notes?: string;
  allowedLanguagePairIds?: string[];
  createdAt: string;
}

export interface Language {
  id: string;
  tenantId: string;
  code: string; // 'pt', 'en', 'es', 'fr', 'it', 'de', 'zh', 'ja', 'ru'
  name: string;
  nativeName?: string;
  active: boolean;
}

export type InboundRequestStatus =
  | 'nova'
  | 'em_analise'
  | 'aguardando_informacao'
  | 'orcamento_em_preparacao'
  | 'convertida'
  | 'cancelada';

export interface InboundRequest {
  id: string;
  tenantId: string;
  customerName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  serviceId?: string;
  serviceName: string;
  sourceLanguage: string;
  targetLanguage: string;
  estimatedVolume?: string;
  notes?: string;
  origin: string;
  status: InboundRequestStatus;
  files?: Array<{ name: string; url: string; size?: number }>;
  convertedQuoteId?: string;
  createdAt: string;
}

export type QuoteStatus =
  | 'rascunho'
  | 'enviado'
  | 'visualizado'
  | 'aprovado'
  | 'recusado'
  | 'expirado'
  | 'cancelado';

export interface QuoteItem {
  id: string;
  serviceId: string;
  serviceName: string;
  description: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  quantity: number;
  unit: BillingUnit;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Quote {
  id: string;
  tenantId: string;
  code: string; // ORC-000001
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument?: string;
  requestId?: string;
  assignedUserId: string;
  assignedUserName: string;
  issueDate: string;
  expirationDate: string;
  estimatedDeliveryDays: number;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  additionalCost: number;
  total: number;
  conditions: string;
  notes?: string;
  status: QuoteStatus;
  approvalToken: string;
  approvedAt?: string;
  approvedIp?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  workOrderId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type WorkOrderStatus =
  | 'aguardando_documentos'
  | 'documentos_recebidos'
  | 'em_traducao'
  | 'em_revisao'
  | 'correcao'
  | 'finalizacao'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export type Priority = 'baixa' | 'normal' | 'alta' | 'urgente';

export interface WorkOrder {
  id: string;
  tenantId: string;
  code: string; // OS-000001
  quoteId?: string;
  quoteCode?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  sourceLanguage: string;
  targetLanguage: string;
  priority: Priority;
  deadline: string;
  assignedUserId: string; // Responsável interno
  assignedUserName: string;
  translatorId?: string;
  translatorName?: string;
  reviewerId?: string;
  reviewerName?: string;
  amount: number;
  notes?: string;
  status: WorkOrderStatus;
  paymentStatus: 'pendente' | 'pago' | 'parcial';
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  deletedAt?: string | null;
}

export type DocumentCategory =
  | 'original'
  | 'trabalho'
  | 'traducao'
  | 'revisao'
  | 'final'
  | 'comprovante'
  | 'outro';

export interface DocumentItem {
  id: string;
  tenantId: string;
  workOrderId?: string;
  customerId?: string;
  quoteId?: string;
  name: string;
  category: DocumentCategory;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  version: number;
  uploaderUserId: string;
  uploaderName: string;
  downloadCount: number;
  createdAt: string;
}

export type TaskStatus = 'a_fazer' | 'em_andamento' | 'concluida' | 'cancelada';

export interface OrderTask {
  id: string;
  tenantId: string;
  workOrderId: string;
  title: string;
  description?: string;
  assignedToName: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Translator {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  languages: string[]; // e.g. ['Inglês -> Português', 'Espanhol -> Português']
  specialties: string[]; // e.g. ['Jurídica', 'Médica', 'Contratos', 'Acadêmica']
  contractType: 'freelancer' | 'pj' | 'clt';
  ratePerWord?: number;
  ratePerLauda?: number;
  bankInfo?: string;
  pixKey?: string;
  active: boolean;
  assignedOrdersCount: number;
  completedOrdersCount: number;
  pendingPaymentAmount: number;
  notes?: string;
  createdAt: string;
}

export interface Reviewer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  languages: string[];
  specialties: string[];
  contractType: 'freelancer' | 'pj' | 'clt';
  active: boolean;
  assignedOrdersCount: number;
  completedOrdersCount: number;
  pendingPaymentAmount: number;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'pix' | 'cartao_credito' | 'boleto' | 'transferencia' | 'dinheiro';

export interface AccountReceivable {
  id: string;
  tenantId: string;
  workOrderId?: string;
  workOrderCode?: string;
  quoteId?: string;
  customerId: string;
  customerName: string;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paymentMethod: PaymentMethod;
  status: 'pendente' | 'pago' | 'parcial' | 'vencido' | 'cancelado';
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface AccountPayable {
  id: string;
  tenantId: string;
  workOrderId?: string;
  workOrderCode?: string;
  recipientType: 'tradutor' | 'revisor' | 'fornecedor' | 'outro';
  recipientId?: string;
  recipientName: string;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  description: string;
  category:
    | 'tradutores'
    | 'revisores'
    | 'salarios'
    | 'software'
    | 'marketing'
    | 'impostos'
    | 'aluguel'
    | 'internet'
    | 'contabilidade'
    | 'outros';
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  tenantId: string;
  userId?: string; // specific user or all
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}
