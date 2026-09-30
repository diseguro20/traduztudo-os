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
  CLEAN_PRODUCTION_USER,
  CLEAN_PRODUCTION_NOTIFICATION,
  CLEAN_PRODUCTION_AUDIT,
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

const STORAGE_KEY = 'traduztudo_db_state_v3';

// In-memory persistent reactive store to ensure zero-latency UI, offline resilience and clean production state
class DatabaseStore {
  private tenant: Tenant = { ...INITIAL_TENANT };
  private users: User[] = [{ ...CLEAN_PRODUCTION_USER }];
  private customers: Customer[] = [];
  private leads: Lead[] = [];
  private services: TranslationService[] = [...INITIAL_SERVICES];
  private languages: Language[] = [...INITIAL_LANGUAGES];
  private requests: InboundRequest[] = [];
  private quotes: Quote[] = [];
  private workOrders: WorkOrder[] = [];
  private documents: DocumentItem[] = [];
  private tasks: OrderTask[] = [];
  private translators: Translator[] = [];
  private reviewers: Reviewer[] = [];
  private receivables: AccountReceivable[] = [];
  private payables: AccountPayable[] = [];
  private expenses: Expense[] = [];
  private notifications: NotificationItem[] = [{ ...CLEAN_PRODUCTION_NOTIFICATION }];
  private auditLogs: AuditLog[] = [{ ...CLEAN_PRODUCTION_AUDIT }];
  private isDemoMode: boolean = false;
  private currentUserId: string = 'user-admin';
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.hydrateFromLocalStorage();
    }
  }

  private hydrateFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tenant) this.tenant = parsed.tenant;
        if (Array.isArray(parsed.users) && parsed.users.length > 0) this.users = parsed.users;
        if (Array.isArray(parsed.customers)) this.customers = parsed.customers;
        if (Array.isArray(parsed.leads)) this.leads = parsed.leads;
        if (Array.isArray(parsed.services) && parsed.services.length > 0) this.services = parsed.services;
        if (Array.isArray(parsed.languages) && parsed.languages.length > 0) this.languages = parsed.languages;
        if (Array.isArray(parsed.requests)) this.requests = parsed.requests;
        if (Array.isArray(parsed.quotes)) this.quotes = parsed.quotes;
        if (Array.isArray(parsed.workOrders)) this.workOrders = parsed.workOrders;
        if (Array.isArray(parsed.documents)) this.documents = parsed.documents;
        if (Array.isArray(parsed.tasks)) this.tasks = parsed.tasks;
        if (Array.isArray(parsed.translators)) this.translators = parsed.translators;
        if (Array.isArray(parsed.reviewers)) this.reviewers = parsed.reviewers;
        if (Array.isArray(parsed.receivables)) this.receivables = parsed.receivables;
        if (Array.isArray(parsed.payables)) this.payables = parsed.payables;
        if (Array.isArray(parsed.expenses)) this.expenses = parsed.expenses;
        if (Array.isArray(parsed.notifications)) this.notifications = parsed.notifications;
        if (Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs;
        if (typeof parsed.isDemoMode === 'boolean') this.isDemoMode = parsed.isDemoMode;
        if (parsed.currentUserId) this.currentUserId = parsed.currentUserId;
      } else {
        // First run: save clean production state
        this.saveToLocalStorage();
      }
    } catch (e) {
      console.warn('Storage hydration notice:', e);
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        tenant: this.tenant,
        users: this.users,
        customers: this.customers,
        leads: this.leads,
        services: this.services,
        languages: this.languages,
        requests: this.requests,
        quotes: this.quotes,
        workOrders: this.workOrders,
        documents: this.documents,
        tasks: this.tasks,
        translators: this.translators,
        reviewers: this.reviewers,
        receivables: this.receivables,
        payables: this.payables,
        expenses: this.expenses,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
        isDemoMode: this.isDemoMode,
        currentUserId: this.currentUserId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private persistAndNotify() {
    this.saveToLocalStorage();
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('Listener error in db store:', e);
      }
    });
  }

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

  // --- PRODUCTION & DEMO DATA MANAGEMENT ---
  isCleanProductionMode(): boolean {
    return !this.isDemoMode;
  }

  hasMockData(): boolean {
    return (
      this.isDemoMode ||
      this.customers.some((c) => c.id.startsWith('cust-') || c.name.includes('TechCorp')) ||
      this.quotes.some((q) => q.code.includes('ORC-2026') || q.code === 'ORC-000001') ||
      this.workOrders.some((o) => o.code.includes('OS-2026') || o.code === 'OS-000001') ||
      this.users.some((u) => u.id === 'user-carlos' || u.name === 'Carlos Silva')
    );
  }

  getStatsSummary() {
    return {
      customersCount: this.customers.length,
      leadsCount: this.leads.length,
      quotesCount: this.quotes.length,
      workOrdersCount: this.workOrders.length,
      usersCount: this.users.length,
      pendingUsersCount: this.users.filter((u) => u.status === 'PENDING').length,
      receivablesCount: this.receivables.length,
      payablesCount: this.payables.length,
      isDemoMode: this.isDemoMode,
      hasMockData: this.hasMockData(),
    };
  }

  clearAllMockData(customAdmin?: { name?: string; email?: string; phone?: string }) {
    this.customers = [];
    this.leads = [];
    this.quotes = [];
    this.workOrders = [];
    this.documents = [];
    this.tasks = [];
    this.translators = [];
    this.reviewers = [];
    this.receivables = [];
    this.payables = [];
    this.expenses = [];
    this.requests = [];

    // Ensure active admin user exists
    const current = this.getCurrentUser();
    const adminUser: User = {
      id: current && current.id !== 'user-carlos' ? current.id : 'user-admin',
      tenantId: this.tenant.id,
      name: customAdmin?.name || (current && current.id !== 'user-carlos' ? current.name : 'Administrador Master'),
      email: customAdmin?.email || (current && current.id !== 'user-carlos' ? current.email : 'admin@traduztudo.com.br'),
      role: 'OWNER',
      phone: customAdmin?.phone || (current && current.id !== 'user-carlos' ? current.phone : '(11) 98765-4321'),
      active: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.users = [adminUser];
    this.currentUserId = adminUser.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('traduztudo_current_user_id', adminUser.id);
    }

    this.notifications = [
      {
        id: `notif-${Date.now()}`,
        tenantId: this.tenant.id,
        title: '🚀 Modo Produção Limpo Ativado',
        message: 'Todos os registros fictícios foram removidos. O sistema está 100% pronto para a operação real da sua empresa.',
        type: 'success',
        link: '/configuracoes/empresa',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    this.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        tenantId: this.tenant.id,
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'Zerar Base para Produção',
        entity: 'System',
        entityId: this.tenant.id,
        details: 'Banco de dados zerado com sucesso. Modo de Produção Limpo ativado sem dados fictícios.',
        createdAt: new Date().toISOString(),
      },
    ];

    this.isDemoMode = false;
    this.persistAndNotify();
  }

  loadDemoData() {
    this.tenant = { ...INITIAL_TENANT };
    this.users = [...INITIAL_USERS];
    this.customers = [...INITIAL_CUSTOMERS];
    this.leads = [...INITIAL_LEADS];
    this.services = [...INITIAL_SERVICES];
    this.languages = [...INITIAL_LANGUAGES];
    this.quotes = [...INITIAL_QUOTES];
    this.workOrders = [...INITIAL_WORK_ORDERS];
    this.documents = [...INITIAL_DOCUMENTS];
    this.tasks = [...INITIAL_TASKS];
    this.translators = [...INITIAL_TRANSLATORS];
    this.reviewers = [...INITIAL_REVIEWERS];
    this.receivables = [...INITIAL_RECEIVABLES];
    this.payables = [...INITIAL_PAYABLES];
    this.expenses = [...INITIAL_EXPENSES];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.isDemoMode = true;
    this.currentUserId = 'user-carlos';
    if (typeof window !== 'undefined') {
      localStorage.setItem('traduztudo_current_user_id', 'user-carlos');
    }
    this.persistAndNotify();
  }

  exportDatabaseJson(): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tenant: this.tenant,
        users: this.users,
        customers: this.customers,
        leads: this.leads,
        services: this.services,
        languages: this.languages,
        quotes: this.quotes,
        workOrders: this.workOrders,
        documents: this.documents,
        tasks: this.tasks,
        translators: this.translators,
        reviewers: this.reviewers,
        receivables: this.receivables,
        payables: this.payables,
        expenses: this.expenses,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
      },
      null,
      2
    );
  }

  importDatabaseJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.tenant) this.tenant = data.tenant;
      if (Array.isArray(data.users)) this.users = data.users;
      if (Array.isArray(data.customers)) this.customers = data.customers;
      if (Array.isArray(data.leads)) this.leads = data.leads;
      if (Array.isArray(data.services)) this.services = data.services;
      if (Array.isArray(data.languages)) this.languages = data.languages;
      if (Array.isArray(data.quotes)) this.quotes = data.quotes;
      if (Array.isArray(data.workOrders)) this.workOrders = data.workOrders;
      if (Array.isArray(data.documents)) this.documents = data.documents;
      if (Array.isArray(data.tasks)) this.tasks = data.tasks;
      if (Array.isArray(data.translators)) this.translators = data.translators;
      if (Array.isArray(data.reviewers)) this.reviewers = data.reviewers;
      if (Array.isArray(data.receivables)) this.receivables = data.receivables;
      if (Array.isArray(data.payables)) this.payables = data.payables;
      if (Array.isArray(data.expenses)) this.expenses = data.expenses;
      if (Array.isArray(data.notifications)) this.notifications = data.notifications;
      if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
      this.isDemoMode = false;
      this.persistAndNotify();
      return true;
    } catch (e) {
      console.error('Failed to import JSON database:', e);
      return false;
    }
  }

  // --- TENANT & USERS ---
  getTenant(): Tenant {
    return this.tenant;
  }

  updateTenant(data: Partial<Tenant>): Tenant {
    this.tenant = { ...this.tenant, ...data, updatedAt: new Date().toISOString() };
    this.syncFirestore('settings', 'profile', this.tenant);
    this.persistAndNotify();
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
    this.persistAndNotify();
    return newUser;
  }

  updateUser(id: string, data: Partial<User>): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...data };
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit(this.getCurrentUser().name, 'Atualização de Usuário', 'User', id, `Atualizou dados/cargo do usuário ${this.users[idx].name}`);
    this.persistAndNotify();
    return this.users[idx];
  }

  approveUser(id: string, role: UserRole, permissions?: string[]): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    const adminName = this.getCurrentUser().name;
    this.users[idx] = {
      ...this.users[idx],
      role,
      permissions: permissions || this.users[idx].permissions,
      status: 'ACTIVE',
      active: true,
      approvedAt: new Date().toISOString(),
      approvedBy: adminName,
    };
    this.syncFirestore('users', id, this.users[idx]);
    this.createNotification({
      title: 'Usuário Aprovado no Painel Admin',
      message: `O cadastro de ${this.users[idx].name} foi aprovado com o cargo ${role}.`,
      type: 'success',
      link: '/admin',
    });
    this.logAudit(adminName, 'Aprovação de Cadastro', 'User', id, `Aprovou o usuário ${this.users[idx].name} com o cargo ${role}`);
    this.persistAndNotify();
    return this.users[idx];
  }

  rejectUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const adminName = this.getCurrentUser().name;
    this.users[idx].status = 'REJECTED';
    this.users[idx].active = false;
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit(adminName, 'Rejeição de Cadastro', 'User', id, `Rejeitou a solicitação do usuário ${this.users[idx].name}`);
    this.persistAndNotify();
    return true;
  }

  blockUser(id: string): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    const adminName = this.getCurrentUser().name;
    this.users[idx].status = 'BLOCKED';
    this.users[idx].active = false;
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit(adminName, 'Bloqueio de Usuário', 'User', id, `Bloqueou o acesso do usuário ${this.users[idx].name}`);
    this.persistAndNotify();
    return this.users[idx];
  }

  unblockUser(id: string): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    const adminName = this.getCurrentUser().name;
    this.users[idx].status = 'ACTIVE';
    this.users[idx].active = true;
    this.syncFirestore('users', id, this.users[idx]);
    this.logAudit(adminName, 'Desbloqueio de Usuário', 'User', id, `Reativou o usuário ${this.users[idx].name}`);
    this.persistAndNotify();
    return this.users[idx];
  }

  deleteUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const name = this.users[idx].name;
    const adminName = this.getCurrentUser().name;
    this.users.splice(idx, 1);
    this.logAudit(adminName, 'Exclusão de Usuário', 'User', id, `Removeu o usuário ${name} da empresa`);
    this.persistAndNotify();
    return true;
  }

  getCurrentUser(): User {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('traduztudo_current_user_id');
      if (savedId) {
        const found = this.users.find((u) => u.id === savedId);
        if (found) return found;
      }
    }
    const fallback =
      this.users.find((u) => u.id === this.currentUserId) ||
      this.users[0] || {
        ...CLEAN_PRODUCTION_USER,
        tenantId: this.tenant.id,
      };
    return fallback;
  }

  setCurrentUser(user: User): void {
    this.currentUserId = user.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('traduztudo_current_user_id', user.id);
    }
    this.persistAndNotify();
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
    this.logAudit(this.getCurrentUser().name, 'Criação de Cliente', 'Customer', newCustomer.id, `Cadastrou o cliente ${newCustomer.name}`);
    this.persistAndNotify();
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
    this.logAudit(this.getCurrentUser().name, 'Atualização de Cliente', 'Customer', id, `Atualizou os dados do cliente ${this.customers[idx].name}`);
    this.persistAndNotify();
    return this.customers[idx];
  }

  deleteCustomer(id: string): boolean {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.customers[idx].deletedAt = new Date().toISOString();
    this.syncFirestore('customers', id, this.customers[idx]);
    this.logAudit(this.getCurrentUser().name, 'Exclusão de Cliente', 'Customer', id, `Removeu o cliente ${this.customers[idx].name}`);
    this.persistAndNotify();
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
    this.logAudit(this.getCurrentUser().name, 'Novo Lead', 'Lead', newLead.id, `Novo lead registrado: ${newLead.name} via ${newLead.origin}`);
    this.createNotification({
      title: 'Novo Lead',
      message: `${newLead.name} entrou em contato via ${newLead.origin}.`,
      type: 'info',
      link: '/crm/leads',
    });
    this.persistAndNotify();
    return newLead;
  }

  updateLead(id: string, data: Partial<Lead>): Lead | undefined {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    this.leads[idx] = { ...this.leads[idx], ...data, updatedAt: new Date().toISOString() };
    this.syncFirestore('leads', id, this.leads[idx]);
    this.persistAndNotify();
    return this.leads[idx];
  }

  convertLeadToCustomer(leadId: string): Customer | undefined {
    const lead = this.getLeadById(leadId);
    if (!lead) return undefined;

    const newCustomer = this.createCustomer({
      tenantId: this.tenant.id,
      type: lead.type,
      name: lead.name,
      companyName: lead.type === 'PJ' ? lead.name : undefined,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      notes: `Convertido de Lead (${lead.origin}). Obs originais: ${lead.notes || ''}`,
    });

    this.updateLead(leadId, { status: 'convertido' });
    this.logAudit(this.getCurrentUser().name, 'Conversão de Lead', 'Lead', leadId, `Lead ${lead.name} convertido em Cliente ${newCustomer.name}`);
    return newCustomer;
  }

  // --- SERVICES & LANGUAGES ---
  getServices(): TranslationService[] {
    return this.services.filter((s) => s.active);
  }

  createService(data: Omit<TranslationService, 'id' | 'createdAt'>): TranslationService {
    const newService: TranslationService = {
      ...data,
      id: `srv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.services.push(newService);
    this.syncFirestore('services', newService.id, newService);
    this.persistAndNotify();
    return newService;
  }

  updateService(id: string, data: Partial<TranslationService>): TranslationService | undefined {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.services[idx] = { ...this.services[idx], ...data };
    this.syncFirestore('services', id, this.services[idx]);
    this.persistAndNotify();
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
    this.persistAndNotify();
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

    this.persistAndNotify();
    return newReq;
  }

  updateRequestStatus(id: string, status: InboundRequest['status']): InboundRequest | undefined {
    const req = this.requests.find((r) => r.id === id);
    if (!req) return undefined;
    req.status = status;
    this.syncFirestore('requests', id, req);
    this.persistAndNotify();
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
    this.logAudit(this.getCurrentUser().name, 'Criação de Orçamento', 'Quote', newQuote.id, `Criou o orçamento ${code} para ${newQuote.customerName} total R$ ${newQuote.total.toFixed(2)}`);
    this.persistAndNotify();
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
    this.persistAndNotify();
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

    this.persistAndNotify();
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
    this.persistAndNotify();
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

    this.persistAndNotify();
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
    this.logAudit(this.getCurrentUser().name, 'Criação de Ordem de Serviço', 'WorkOrder', newOrder.id, `Criou a ${code} para ${newOrder.customerName}`);
    this.persistAndNotify();
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
    this.persistAndNotify();
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
    this.persistAndNotify();
    return newDoc;
  }

  deleteDocument(id: string): boolean {
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.documents.splice(idx, 1);
    this.persistAndNotify();
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
    this.persistAndNotify();
    return newTask;
  }

  updateTask(id: string, data: Partial<OrderTask>): OrderTask | undefined {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.tasks[idx] = { ...this.tasks[idx], ...data };
    this.syncFirestore('tasks', id, this.tasks[idx]);
    this.persistAndNotify();
    return this.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    this.persistAndNotify();
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
    this.persistAndNotify();
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
    this.persistAndNotify();
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
    this.persistAndNotify();
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

    this.logAudit(this.getCurrentUser().name, 'Liquidação de Recebimento', 'AccountReceivable', id, `Confirmou pagamento de R$ ${paidVal.toFixed(2)} referente a ${rec.description}`);
    this.persistAndNotify();
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
    this.persistAndNotify();
    return newPay;
  }

  markPayablePaid(id: string): AccountPayable | undefined {
    const pay = this.payables.find((p) => p.id === id);
    if (!pay) return undefined;
    pay.status = 'pago';
    pay.paidAt = new Date().toISOString();
    this.syncFirestore('accountsPayable', id, pay);
    this.logAudit(this.getCurrentUser().name, 'Liquidação de Conta a Pagar', 'AccountPayable', id, `Baixou conta a pagar de R$ ${pay.amount.toFixed(2)} (${pay.description})`);
    this.persistAndNotify();
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
    this.persistAndNotify();
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
    this.persistAndNotify();
    return notif;
  }

  markNotificationRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.persistAndNotify();
    }
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  logAudit(userName: string, action: string, entity: string, entityId: string, details: string, oldValue?: string, newValue?: string) {
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      tenantId: this.tenant.id,
      userId: this.currentUserId,
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
    this.persistAndNotify();
  }
}

// Global Singleton
const globalForDb = globalThis as unknown as { databaseStore: DatabaseStore };
export const databaseStore = globalForDb.databaseStore || new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.databaseStore = databaseStore;
