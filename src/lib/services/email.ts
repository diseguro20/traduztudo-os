export interface EmailSendResult {
  success: boolean;
  messageId: string;
  recipient: string;
  sender?: string;
  timestamp: string;
  simulated?: boolean;
}

export interface EmailSendOptions {
  to: string;
  from?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  documentName?: string;
  documentUrl?: string;
}

export type EmailTemplateType =
  | 'novo_orcamento'
  | 'orcamento_aprovado'
  | 'documentos_recebidos'
  | 'documento_faltante'
  | 'pagamento_confirmado'
  | 'servico_concluido'
  | 'documento_disponivel';

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-1',
    type: 'novo_orcamento',
    name: 'Envio de Proposta Comercial',
    subject: 'TraduzTudo — Orçamento de Tradução {{quote_code}}',
    body: `Olá {{customer_name}},\n\nRecebemos sua solicitação de tradução e preparamos uma proposta personalizada para você.\n\nValor total: {{quote_total}}\nPrazo estimado: {{delivery_days}} dias úteis\n\nVocê pode analisar todos os detalhes e aprovar seu orçamento diretamente com 1 clique no link seguro abaixo:\n{{approval_link}}\n\nQualquer dúvida, nossa equipe está à disposição.\n\nAtenciosamente,\nTraduzTudo Traduções Juramentadas e Certificadas`,
    variables: ['customer_name', 'quote_code', 'quote_total', 'delivery_days', 'approval_link'],
  },
  {
    id: 'tpl-2',
    type: 'orcamento_aprovado',
    name: 'Confirmação de Aprovação',
    subject: 'Orçamento {{quote_code}} Aprovado — Ordem de Serviço {{order_code}} Iniciada',
    body: `Olá {{customer_name}},\n\nConfirmamos a aprovação do seu orçamento {{quote_code}}! Nossa equipe operacional já iniciou os trabalhos sob a Ordem de Serviço {{order_code}}.\n\nVocê pode acompanhar todo o andamento do seu pedido e enviar novos documentos pelo seu Portal do Cliente:\n{{portal_link}}\n\nAtenciosamente,\nEquipe TraduzTudo`,
    variables: ['customer_name', 'quote_code', 'order_code', 'portal_link'],
  },
  {
    id: 'tpl-3',
    type: 'pagamento_confirmado',
    name: 'Confirmação de Pagamento',
    subject: 'Pagamento Confirmado — Ordem de Serviço {{order_code}}',
    body: `Olá {{customer_name}},\n\nConfirmamos o recebimento do pagamento de {{amount}} referente ao seu pedido {{order_code}}.\n\nSeu recibo digital já se encontra disponível no seu portal.\n\nAtenciosamente,\nFinanceiro TraduzTudo`,
    variables: ['customer_name', 'order_code', 'amount'],
  },
  {
    id: 'tpl-4',
    type: 'servico_concluido',
    name: 'Tradução Concluída e Disponível para Download',
    subject: 'Sua tradução está pronta! — OS {{order_code}}',
    body: `Olá {{customer_name}},\n\nTemos o prazer de informar que seus documentos foram traduzidos, revisados e certificados com sucesso!\n\nBaixe seus arquivos oficiais em alta resolução através do link:\n{{download_link}}\n\nObrigado por escolher a TraduzTudo!\n\nAtenciosamente,\nTraduzTudo OS`,
    variables: ['customer_name', 'order_code', 'download_link'],
  },
  {
    id: 'tpl-5',
    type: 'documento_disponivel',
    name: 'Documento Traduzido e Certificado Pronto',
    subject: 'TraduzTudo — Seu documento traduzido e certificado está pronto',
    body: `Olá {{customer_name}},\n\nSeu documento {{document_name}} já foi traduzido e certificado pela nossa equipe oficial.\n\nVocê pode visualizar e fazer o download do documento oficial através do link:\n{{download_link}}\n\nQualquer dúvida estamos à disposição.\n\nAtenciosamente,\nTraduzTudo Traduções Juramentadas e Certificadas`,
    variables: ['customer_name', 'document_name', 'download_link'],
  },
];

export class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean = false;

  private constructor() {
    this.isConfigured = !!process.env.RESEND_API_KEY || !!process.env.SMTP_HOST;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      provider: 'Resend / Amazon SES / SMTP Corporativo',
      status: this.isConfigured ? 'Ativo' : 'Aguardando Configuração',
    };
  }

  public async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    options?: { from?: string; textContent?: string; documentName?: string; documentUrl?: string }
  ): Promise<EmailSendResult> {
    const sender = options?.from || 'contato@traduztudo.com.br';
    console.log(`[EmailService] Disparando e-mail de [${sender}] para [${to}]: "${subject}"`);

    // If Resend API key is available in production
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: sender,
            to,
            subject,
            html: htmlContent,
            text: options?.textContent,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          return {
            success: true,
            messageId: resData.id || `msg_${Date.now()}`,
            recipient: to,
            sender,
            timestamp: new Date().toISOString(),
            simulated: false,
          };
        }
      } catch (err) {
        console.warn('[EmailService] Falha ao despachar via Resend, usando fallback:', err);
      }
    }

    // Default compliant fallback
    return {
      success: true,
      messageId: `msg_disp_${Date.now()}`,
      recipient: to,
      sender,
      timestamp: new Date().toISOString(),
      simulated: true,
    };
  }

  public getTemplates(): EmailTemplate[] {
    return EMAIL_TEMPLATES;
  }
}

export const emailService = EmailService.getInstance();
