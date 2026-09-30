export interface InvoiceData {
  orderId: string;
  customerName: string;
  customerDocument: string;
  serviceDescription: string;
  totalAmount: number;
  municipalServiceCode?: string; // Código de serviço da prefeitura (ex: 17.02)
}

export interface InvoiceResult {
  invoiceNumber: string;
  verificationCode: string;
  xmlUrl?: string;
  pdfUrl?: string;
  status: 'autorizada' | 'processando' | 'erro';
  issuedAt: string;
}

export class InvoiceService {
  private static instance: InvoiceService;
  private isConfigured: boolean = false;

  private constructor() {
    this.isConfigured = !!process.env.NFSE_API_KEY;
  }

  public static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      provider: 'Focus NFe / PlugNotas / e-Notas',
      status: this.isConfigured ? 'Pronto para Emissão' : 'Aguardando Certificado Digital A1 e Chaves',
    };
  }

  public async emitNFe(data: InvoiceData): Promise<InvoiceResult> {
    console.log(`[InvoiceService] Emitindo NFS-e para ${data.customerName}, valor: ${data.totalAmount}`);
    return {
      invoiceNumber: `NFSE-${Date.now().toString().slice(-6)}`,
      verificationCode: `VERIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      pdfUrl: `/invoices/nfse-demo.pdf`,
      status: 'autorizada',
      issuedAt: new Date().toISOString(),
    };
  }
}

export const invoiceService = InvoiceService.getInstance();
