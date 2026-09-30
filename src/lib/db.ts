import {
  Customer,
  Lead,
  TranslationService,
  Language,
  InboundRequest,
  Quote,
  WorkOrder,
  DocumentItem,
  OrderTask,
  Translator,
  Reviewer,
  AccountReceivable,
  AccountPayable,
  Expense,
  NotificationItem,
  AuditLog,
  Tenant,
  User,
  UserRole,
  UserStatus,
} from '@/types';
import {
  INITIAL_TENANT,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_LEADS,
  INITIAL_SERVICES,
  INITIAL_LANGUAGES,
  INITIAL_QUOTES,
  INITIAL_WORK_ORDERS,
  INITIAL_DOCUMENTS,
  INITIAL_TASKS,
  INITIAL_TRANSLATORS,
  INITIAL_REVIEWERS,
  INITIAL_RECEIVABLES,
  INITIAL_PAYABLES,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './seedData';
import { db } from './firebase';
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
} from 'firebase/firestore';

// In-memory persistent fallback store to ensure zero-latency UI and offline resilience
class DatabaseStore {
  private tenant: Tenant = INITIAL_TENANT;
  private users: User[] = [...INITIAL_USERS];
  private customers: Customer[] = [...INITIAL_CUSTOMERS];
  private leads: Lead[] = [...INITIAL_LEADS];
  private services: TranslationService[] = [...INITIAL_SERVICES];
  private languages: Language[] = [...INITIAL_LANGUAGES];
  private requests: InboundRequest[] = [];
  private quotes: Quote[] = [...INITIAL_QUOTES];
  private workOrders: WorkOrder[] = [...INITIAL_WORK_ORDERS];
  private documents: DocumentItem[] = [...INITIAL_DOCUMENTS];
  private tasks: OrderTask[] = [...INITIAL_TASKS];
  private translators: Translator[] = [...INITIAL_TRANSLATORS];
  private reviewers: Reviewer[] = [...INITIAL_REVIEWERS];
  private receivables: AccountReceivable[] = [...INITIAL_RECEIVABLES];
  private payables: AccountPayable[] = [...INITIAL_PAYABLES];
  private expenses: Expense[] = [...INITIAL_EXPENSES];
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

  // Helper to sync to Firestore in background without blocking UI
  private async syncFirestore(collectionName: string, id: string, data: any) {
    try {
      if (typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
        const docRef = doc(db, 'tenants', this.tenant.id, collectionName, id);
        await setDoc(docRef, JSON.parse(JSON.stringify(data)), { merge: true });
      }
    } catch (e) {
      console.warn(`Firestore sync note for ${collectionName}/${id}:`, e);
    }
  }

  // --- TENANT & USERS ---
  getTenant(): Tenant {
    return this.tenant;
  }

  updateTenant(data: Partial<Tenant>): Tenant {
    this.tenant = { ...this.tenant, ...data, updatedAt: new Date().toISOString() };
    this.syncFirestore('settings', 'profile', this.tenant);
    return this.tenant;
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'status'> & { status?: UserStatus }): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      status: userData.status || 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.users.unshift(newUser);
    this.syncFirestore('users', newUser.id, newUser);
    this.createNotification({
      title: 'Nova Solicitação de Cadastro',
      message: `${newUser.name} se cadastrou como ${newUser.requestedRole || newUser.role} e aguarda aprovação no Painel Admin.`,
      type: 'warning',
      link: '/admin',
    });
    this.logAudit(newUser.name, 'Solicitação de Cadastro', 'User', newUser.id, `Novo usuário registrado no sistema`);
    return newUser;
  }

  updateUser(id: string, data: Partial<User>): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...data };
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit('Carlos Silva (Admin)', 'Atualização de Usuário', 'User', id, `Atualizou dados/cargo do usuário ${this.users[idx].name}`);
    return this.users[idx];
  }

  approveUser(id: string, role: UserRole, permissions?: string[]): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = {
      ...this.users[idx],
      role,
      permissions: permissions || this.users[idx].permissions,
      status: 'ACTIVE',
      active: true,
      approvedAt: new Date().toISOString(),
      approvedBy: 'Carlos Silva (Owner/Admin)',
    };
    this.syncFirestore('users', id, this.users[idx]);
    this.createNotification({
      title: 'Usuário Aprovado no Painel Admin',
      message: `O cadastro de ${this.users[idx].name} foi aprovado com o cargo ${role}.`,
      type: 'success',
      link: '/admin',
    });
    this.logAudit('Carlos Silva (Admin)', 'Aprovação de Cadastro', 'User', id, `Aprovou o usuário ${this.users[idx].name} com o cargo ${role}`);
    return this.users[idx];
  }

  rejectUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.users[idx].status = 'REJECTED';
    this.users[idx].active = false;
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit('Carlos Silva (Admin)', 'Rejeição de Cadastro', 'User', id, `Rejeitou a solicitação do usuário ${this.users[idx].name}`);
    return true;
  }

  blockUser(id: string): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx].status = 'BLOCKED';
    this.users[idx].active = false;
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit('Carlos Silva (Admin)', 'Bloqueio de Usuário', 'User', id, `Bloqueou o acesso do usuário ${this.users[idx].name}`);
    return this.users[idx];
  }

  unblockUser(id: string): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx].status = 'ACTIVE';
    this.users[idx].active = true;
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit('Carlos Silva (Admin)', 'Desbloqueio de Usuário', 'User', id, `Reativou o usuário ${this.users[idx].name}`);
    return this.users[idx];
  }

  deleteUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const name = this.users[idx].name;
    this.users.splice(idx, 1);
    this.logAudit('Carlos Silva (Admin)', 'Exclusão de Usuário', 'User', id, `Removeu o usuário ${name} da empresa`);
    return true;
  }

  private currentUserId: string = 'user-carlos';

  getCurrentUser(): User {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('traduztudo_current_user_id');
      if (savedId) {
        const found = this.users.find((u) => u.id === savedId);
        if (found) return found;
      }
    }
    const fallback = this.users.find((u) => u.id === this.currentUserId) || this.users[0];
    return fallback;
  }

  setCurrentUser(user: User): void {
    this.currentUserId = user.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('traduztudo_current_user_id', user.id);
    }
  }

  // --- CUSTOMERS ---
  getCustomers(): Customer[] {
    return this.customers.filter((c) => !c.deletedAt);
  }

  getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id && !c.deletedAt);
  }

  createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'ordersCount' | 'activeOrdersCount' | 'pendingBalance'>): Customer {
    const newCustomer: Customer = {
      ...data,
      id: `cli-${Date.now()}`,
      totalSpent: 0,
      ordersCount: 0,
      activeOrdersCount: 0,
      pendingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    this.syncFirestore('customers', newCustomer.id, newCustomer);
    this.logAudit('Carlos Silva', 'Criação de Cliente', 'Customer', newCustomer.id, `Cadastrou o cliente ${newCustomer.name}`);
    return newCustomer;
  }

  updateCustomer(id: string, data: Partial<Customer>): Customer | undefined {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.customers[idx] = {
      ...this.customers[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.syncFirestore('customers', id, this.customers[idx]);
    this.logAudit('Carlos Silva', 'Atualização de Cliente', 'Customer', id, `Atualizou os dados do cliente ${this.customers[idx].name}`);
    return this.customers[idx];
  }

  deleteCustomer(id: string): boolean {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.customers[idx].deletedAt = new Date().toISOString();
    this.syncFirestore('customers', id, this.customers[idx]);
    this.logAudit('Carlos Silva', 'Exclusão de Cliente', 'Customer', id, `Removeu o cliente ${this.customers[idx].name}`);
    return true;
  }

  // --- LEADS ---
  getLeads(): Lead[] {
    return this.leads.filter((l) => !l.deletedAt);
  }

  getLeadById(id: string): Lead | undefined {
    return this.leads.find((l) => l.id === id && !l.deletedAt);
  }

  createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
    const newLead: Lead = {
      ...data,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leads.unshift(newLead);
    this.syncFirestore('leads', newLead.id, newLead);
    this.logAudit('Juliana Mendes', 'Novo Lead', 'Lead', newLead.id, `Novo lead registrado: ${newLead.name} via ${newLead.origin}`);
    this.createNotification({
      title: 'Novo Lead',
      message: `${newLead.name} entrou em contato via ${newLead.origin}.`,
      type: 'info',
      link: '/crm/leads',
    });
    return newLead;
  }

  updateLead(id: string, data: Partial<Lead>): Lead | undefined {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    this.leads[idx] = {
      ...this.leads[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.syncFirestore('leads', id, this.leads[idx]);
    return this.leads[idx];
  }

  convertLeadToCustomer(leadId: string): { customer: Customer; lead: Lead } | undefined {
    const lead = this.getLeadById(leadId);
    if (!lead) return undefined;

    const customer = this.createCustomer({
      tenantId: this.tenant.id,
      type: lead.type,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      notes: `Convertido do Lead ${lead.name}. Interesse: ${lead.interestedServiceName || 'N/A'}. Obs: ${lead.notes || ''}`,
    });

    this.updateLead(leadId, {
      status: 'convertido',
      customerId: customer.id,
    });

    this.logAudit('Juliana Mendes', 'Conversão de Lead', 'Lead', leadId, `Lead ${lead.name} convertido em cliente ID ${customer.id}`);
    return { customer, lead };
  }

  deleteLead(id: string): boolean {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    this.leads[idx].deletedAt = new Date().toISOString();
    this.syncFirestore('leads', id, this.leads[idx]);
    return true;
  }

  // --- SERVICES & LANGUAGES ---
  getServices(): TranslationService[] {
    return this.services;
  }

  createService(data: Omit<TranslationService, 'id' | 'createdAt'>): TranslationService {
    const newService: TranslationService = {
      ...data,
      id: `srv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.services.push(newService);
    this.syncFirestore('services', newService.id, newService);
    return newService;
  }

  updateService(id: string, data: Partial<TranslationService>): TranslationService | undefined {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.services[idx] = { ...this.services[idx], ...data };
    this.syncFirestore('services', id, this.services[idx]);
    return this.services[idx];
  }

  getLanguages(): Language[] {
    return this.languages;
  }

  createLanguage(code: string, name: string, nativeName?: string): Language {
    const newLang: Language = {
      id: `lang-${code}`,
      tenantId: this.tenant.id,
      code,
      name,
      nativeName,
      active: true,
    };
    this.languages.push(newLang);
    this.syncFirestore('languages', newLang.id, newLang);
    return newLang;
  }

  // --- INBOUND REQUESTS (from Site TraduzTudo) ---
  getRequests(): InboundRequest[] {
    return this.requests;
  }

  createRequest(data: Omit<InboundRequest, 'id' | 'createdAt'>): InboundRequest {
    const newReq: InboundRequest = {
      ...data,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.requests.unshift(newReq);
    this.syncFirestore('requests', newReq.id, newReq);

    // Also register as a lead automatically
    this.createLead({
      tenantId: this.tenant.id,
      name: newReq.customerName,
      type: 'PF',
      email: newReq.email,
      phone: newReq.phone,
      whatsapp: newReq.whatsapp,
      origin: newReq.origin || 'Site TraduzTudo',
      interestedServiceName: newReq.serviceName,
      sourceLanguage: newReq.sourceLanguage,
      targetLanguage: newReq.targetLanguage,
      notes: newReq.notes,
      status: 'novo',
    });

    this.createNotification({
      title: 'Nova Solicitação do Site',
      message: `${newReq.customerName} enviou solicitação para ${newReq.serviceName}.`,
      type: 'info',
      link: '/operacao/solicitacoes',
    });

    return newReq;
  }

  updateRequestStatus(id: string, status: InboundRequest['status']): InboundRequest | undefined {
    const req = this.requests.find((r) => r.id === id);
    if (!req) return undefined;
    req.status = status;
    this.syncFirestore('requests', id, req);
    return req;
  }

  // --- QUOTES ---
  getQuotes(): Quote[] {
    return this.quotes.filter((q) => !q.deletedAt);
  }

  getQuoteById(id: string): Quote | undefined {
    return this.quotes.find((q) => q.id === id && !q.deletedAt);
  }

  getQuoteByToken(token: string): Quote | undefined {
    return this.quotes.find((q) => q.approvalToken === token && !q.deletedAt);
  }

  getNextQuoteCode(): string {
    const count = this.quotes.length + 1;
    return `ORC-${String(count).padStart(6, '0')}`;
  }

  createQuote(data: Omit<Quote, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'approvalToken'>): Quote {
    const code = this.getNextQuoteCode();
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newQuote: Quote = {
      ...data,
      id: `quote-${Date.now()}`,
      code,
      approvalToken: token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.quotes.unshift(newQuote);
    this.syncFirestore('quotes', newQuote.id, newQuote);
    this.logAudit('Juliana Mendes', 'Criação de Orçamento', 'Quote', newQuote.id, `Criou o orçamento ${code} para ${newQuote.customerName} total R$ ${newQuote.total.toFixed(2)}`);
    return newQuote;
  }

  updateQuote(id: string, data: Partial<Quote>): Quote | undefined {
    const idx = this.quotes.findIndex((q) => q.id === id);
    if (idx === -1) return undefined;
    this.quotes[idx] = {
      ...this.quotes[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.syncFirestore('quotes', id, this.quotes[idx]);
    return this.quotes[idx];
  }

  approveQuote(idOrToken: string, ipAddress?: string): { quote: Quote; workOrder: WorkOrder } | undefined {
    const quote = this.quotes.find((q) => (q.id === idOrToken || q.approvalToken === idOrToken) && !q.deletedAt);
    if (!quote) return undefined;

    quote.status = 'aprovado';
    quote.approvedAt = new Date().toISOString();
    quote.approvedIp = ipAddress || '127.0.0.1';
    quote.updatedAt = new Date().toISOString();

    // Automatically create a Work Order (OS) for this quote
    const workOrder = this.createWorkOrderFromQuote(quote);
    quote.workOrderId = workOrder.id;

    this.syncFirestore('quotes', quote.id, quote);
    this.logAudit('Sistema', 'Aprovação de Orçamento', 'Quote', quote.id, `Orçamento ${quote.code} aprovado pelo cliente (IP: ${quote.approvedIp}). OS ${workOrder.code} gerada.`);

    this.createNotification({
      title: 'Orçamento Aprovado!',
      message: `${quote.customerName} aprovou o orçamento ${quote.code}. OS ${workOrder.code} criada.`,
      type: 'success',
      link: `/operacao/ordens-servico/${workOrder.id}`,
    });

    return { quote, workOrder };
  }

  rejectQuote(idOrToken: string, reason?: string): Quote | undefined {
    const quote = this.quotes.find((q) => (q.id === idOrToken || q.approvalToken === idOrToken) && !q.deletedAt);
    if (!quote) return undefined;
    quote.status = 'recusado';
    quote.rejectedAt = new Date().toISOString();
    quote.rejectedReason = reason || 'Não informado pelo cliente';
    quote.updatedAt = new Date().toISOString();
    this.syncFirestore('quotes', quote.id, quote);
    this.logAudit('Cliente', 'Recusa de Orçamento', 'Quote', quote.id, `Orçamento ${quote.code} recusado. Motivo: ${quote.rejectedReason}`);
    return quote;
  }

  // --- WORK ORDERS (OS) ---
  getWorkOrders(): WorkOrder[] {
    return this.workOrders.filter((o) => !o.deletedAt);
  }

  getWorkOrderById(id: string): WorkOrder | undefined {
    return this.workOrders.find((o) => o.id === id && !o.deletedAt);
  }

  getNextWorkOrderCode(): string {
    const count = this.workOrders.length + 1;
    return `OS-${String(count).padStart(6, '0')}`;
  }

  createWorkOrderFromQuote(quote: Quote): WorkOrder {
    const code = this.getNextWorkOrderCode();
    const primaryItem = quote.items[0];

    const newOrder: WorkOrder = {
      id: `order-${Date.now()}`,
      tenantId: this.tenant.id,
      code,
      quoteId: quote.id,
      quoteCode: quote.code,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      serviceName: primaryItem ? primaryItem.serviceName : 'Tradução',
      sourceLanguage: primaryItem?.sourceLanguage || 'Português',
      targetLanguage: primaryItem?.targetLanguage || 'Inglês',
      priority: 'normal',
      deadline: new Date(Date.now() + (quote.estimatedDeliveryDays || 3) * 86400000).toISOString(),
      assignedUserId: quote.assignedUserId,
      assignedUserName: quote.assignedUserName,
      amount: quote.total,
      paidAmount: 0,
      paymentStatus: 'pendente',
      status: 'documentos_recebidos',
      notes: `Gerada a partir do orçamento ${quote.code}. Condições: ${quote.conditions}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workOrders.unshift(newOrder);
    this.syncFirestore('workOrders', newOrder.id, newOrder);

    // Create Account Receivable automatically
    this.createReceivable({
      tenantId: this.tenant.id,
      workOrderId: newOrder.id,
      workOrderCode: newOrder.code,
      quoteId: quote.id,
      customerId: newOrder.customerId,
      customerName: newOrder.customerName,
      description: `Honorários de serviço ${newOrder.code} - ${newOrder.serviceName}`,
      amount: newOrder.amount,
      paidAmount: 0,
      dueDate: newOrder.deadline,
      paymentMethod: 'pix',
      status: 'pendente',
    });

    // Create standard default tasks
    this.createTask({
      tenantId: this.tenant.id,
      workOrderId: newOrder.id,
      title: 'Conferência de documentos e contagem de laudas',
      assignedToName: newOrder.assignedUserName,
      dueDate: newOrder.deadline,
      priority: 'normal',
      status: 'a_fazer',
    });

    this.createTask({
      tenantId: this.tenant.id,
      workOrderId: newOrder.id,
      title: 'Atribuição e briefing com o Tradutor',
      assignedToName: newOrder.assignedUserName,
      dueDate: newOrder.deadline,
      priority: 'normal',
      status: 'a_fazer',
    });

    return newOrder;
  }

  createWorkOrder(data: Omit<WorkOrder, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'paymentStatus'>): WorkOrder {
    const code = this.getNextWorkOrderCode();
    const newOrder: WorkOrder = {
      ...data,
      id: `order-${Date.now()}`,
      code,
      paidAmount: 0,
      paymentStatus: 'pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workOrders.unshift(newOrder);
    this.syncFirestore('workOrders', newOrder.id, newOrder);
    this.logAudit('Mariana Costa', 'Criação de Ordem de Serviço', 'WorkOrder', newOrder.id, `Criou a ${code} para ${newOrder.customerName}`);
    return newOrder;
  }

  updateWorkOrder(id: string, data: Partial<WorkOrder>): WorkOrder | undefined {
    const idx = this.workOrders.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    this.workOrders[idx] = {
      ...this.workOrders[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.syncFirestore('workOrders', id, this.workOrders[idx]);
    return this.workOrders[idx];
  }

  // --- DOCUMENTS ---
  getDocuments(workOrderId?: string): DocumentItem[] {
    if (workOrderId) {
      return this.documents.filter((d) => d.workOrderId === workOrderId);
    }
    return this.documents;
  }

  createDocument(data: Omit<DocumentItem, 'id' | 'createdAt' | 'downloadCount' | 'version'>): DocumentItem {
    const newDoc: DocumentItem = {
      ...data,
      id: `doc-${Date.now()}`,
      version: 1,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.documents.unshift(newDoc);
    this.syncFirestore('documents', newDoc.id, newDoc);
    this.logAudit(data.uploaderName, 'Upload de Documento', 'Document', newDoc.id, `Arquivo enviado: ${newDoc.name} (${newDoc.category})`);
    return newDoc;
  }

  deleteDocument(id: string): boolean {
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.documents.splice(idx, 1);
    return true;
  }

  // --- TASKS ---
  getTasks(workOrderId?: string): OrderTask[] {
    if (workOrderId) {
      return this.tasks.filter((t) => t.workOrderId === workOrderId);
    }
    return this.tasks;
  }

  createTask(data: Omit<OrderTask, 'id' | 'createdAt'>): OrderTask {
    const newTask: OrderTask = {
      ...data,
      id: `tsk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    this.syncFirestore('tasks', newTask.id, newTask);
    return newTask;
  }

  updateTask(id: string, data: Partial<OrderTask>): OrderTask | undefined {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.tasks[idx] = { ...this.tasks[idx], ...data };
    this.syncFirestore('tasks', id, this.tasks[idx]);
    return this.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    return true;
  }

  // --- TRANSLATORS & REVIEWERS ---
  getTranslators(): Translator[] {
    return this.translators;
  }

  createTranslator(data: Omit<Translator, 'id' | 'createdAt' | 'assignedOrdersCount' | 'completedOrdersCount' | 'pendingPaymentAmount'>): Translator {
    const newTranslator: Translator = {
      ...data,
      id: `trans-${Date.now()}`,
      assignedOrdersCount: 0,
      completedOrdersCount: 0,
      pendingPaymentAmount: 0,
      createdAt: new Date().toISOString(),
    };
    this.translators.push(newTranslator);
    this.syncFirestore('translators', newTranslator.id, newTranslator);
    return newTranslator;
  }

  getReviewers(): Reviewer[] {
    return this.reviewers;
  }

  createReviewer(data: Omit<Reviewer, 'id' | 'createdAt' | 'assignedOrdersCount' | 'completedOrdersCount' | 'pendingPaymentAmount'>): Reviewer {
    const newRev: Reviewer = {
      ...data,
      id: `rev-${Date.now()}`,
      assignedOrdersCount: 0,
      completedOrdersCount: 0,
      pendingPaymentAmount: 0,
      createdAt: new Date().toISOString(),
    };
    this.reviewers.push(newRev);
    this.syncFirestore('reviewers', newRev.id, newRev);
    return newRev;
  }

  // --- FINANCIAL ---
  getReceivables(): AccountReceivable[] {
    return this.receivables;
  }

  createReceivable(data: Omit<AccountReceivable, 'id' | 'createdAt'>): AccountReceivable {
    const newRec: AccountReceivable = {
      ...data,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.receivables.unshift(newRec);
    this.syncFirestore('accountsReceivable', newRec.id, newRec);
    return newRec;
  }

  markReceivablePaid(id: string, amount?: number): AccountReceivable | undefined {
    const rec = this.receivables.find((r) => r.id === id);
    if (!rec) return undefined;
    const paidVal = amount ?? rec.amount;
    rec.paidAmount = paidVal;
    rec.status = paidVal >= rec.amount ? 'pago' : 'parcial';
    rec.paidAt = new Date().toISOString();
    this.syncFirestore('accountsReceivable', id, rec);

    // Update related Work Order if linked
    if (rec.workOrderId) {
      const order = this.workOrders.find((o) => o.id === rec.workOrderId);
      if (order) {
        order.paidAmount = (order.paidAmount || 0) + paidVal;
        order.paymentStatus = order.paidAmount >= order.amount ? 'pago' : 'parcial';
        this.syncFirestore('workOrders', order.id, order);
      }
    }

    this.logAudit('Rodrigo Rocha', 'Liquidação de Recebimento', 'AccountReceivable', id, `Confirmou pagamento de R$ ${paidVal.toFixed(2)} referente a ${rec.description}`);
    return rec;
  }

  getPayables(): AccountPayable[] {
    return this.payables;
  }

  createPayable(data: Omit<AccountPayable, 'id' | 'createdAt'>): AccountPayable {
    const newPay: AccountPayable = {
      ...data,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.payables.unshift(newPay);
    this.syncFirestore('accountsPayable', newPay.id, newPay);
    return newPay;
  }

  markPayablePaid(id: string): AccountPayable | undefined {
    const pay = this.payables.find((p) => p.id === id);
    if (!pay) return undefined;
    pay.status = 'pago';
    pay.paidAt = new Date().toISOString();
    this.syncFirestore('accountsPayable', id, pay);
    this.logAudit('Rodrigo Rocha', 'Liquidação de Conta a Pagar', 'AccountPayable', id, `Baixou conta a pagar de R$ ${pay.amount.toFixed(2)} (${pay.description})`);
    return pay;
  }

  getExpenses(): Expense[] {
    return this.expenses;
  }

  createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const newExp: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.expenses.unshift(newExp);
    this.syncFirestore('expenses', newExp.id, newExp);
    return newExp;
  }

  // --- NOTIFICATIONS ---
  getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  createNotification(data: Omit<NotificationItem, 'id' | 'createdAt' | 'tenantId' | 'read'>): NotificationItem {
    const notif: NotificationItem = {
      ...data,
      id: `notif-${Date.now()}`,
      tenantId: this.tenant.id,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    this.syncFirestore('notifications', notif.id, notif);
    return notif;
  }

  markNotificationRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) n.read = true;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  logAudit(userName: string, action: string, entity: string, entityId: string, details: string, oldValue?: string, newValue?: string) {
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      tenantId: this.tenant.id,
      userId: 'system-user',
      userName,
      action,
      entity,
      entityId,
      details,
      oldValue,
      newValue,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.syncFirestore('auditLogs', log.id, log);
  }
}

// Global Singleton
const globalForDb = globalThis as unknown as { databaseStore: DatabaseStore };
export const databaseStore = globalForDb.databaseStore || new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.databaseStore = databaseStore;
