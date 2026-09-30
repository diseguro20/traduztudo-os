export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  error?: string;
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private apiKey: string | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    this.apiKey = process.env.WHATSAPP_API_TOKEN || null;
    this.isConfigured = !!this.apiKey;
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      provider: 'Meta WhatsApp Cloud API / Evolution API',
      status: this.isConfigured ? 'Ativo' : 'Aguardando Configuração',
    };
  }

  public async sendMessage(to: string, message: string): Promise<WhatsAppMessageResult> {
    console.log(`[WhatsAppService] Enviando mensagem para ${to}: "${message.substring(0, 40)}..."`);
    // Em produção: chamada à Meta Cloud API
    return {
      success: true,
      messageId: `wamid_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      recipient: to,
    };
  }

  public async sendTemplate(to: string, templateName: string, parameters: Record<string, string>): Promise<WhatsAppMessageResult> {
    console.log(`[WhatsAppService] Enviando template "${templateName}" para ${to} com parâmetros:`, parameters);
    return {
      success: true,
      messageId: `wamid_tpl_${Date.now()}`,
      recipient: to,
    };
  }

  public async sendDocument(to: string, documentUrl: string, caption: string): Promise<WhatsAppMessageResult> {
    console.log(`[WhatsAppService] Enviando documento ${documentUrl} para ${to} (${caption})`);
    return {
      success: true,
      messageId: `wamid_doc_${Date.now()}`,
      recipient: to,
    };
  }

  public async sendPaymentLink(to: string, customerName: string, amount: number, paymentUrl: string): Promise<WhatsAppMessageResult> {
    const text = `Olá ${customerName}! Segue o link seguro para pagamento da sua tradução no valor de R$ ${amount.toFixed(2)}: ${paymentUrl}`;
    return this.sendMessage(to, text);
  }
}

export const whatsAppService = WhatsAppService.getInstance();
