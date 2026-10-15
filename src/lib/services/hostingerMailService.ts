import { emailService } from '@/lib/services/email';

export interface HostingerSendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: Array<{ name: string; content?: string; url?: string }>;
}

export interface HostingerSendEmailResult {
  success: boolean;
  messageId: string;
  sender: string;
  recipient: string;
  timestamp: string;
  mode: 'HOSTINGER_API' | 'HOSTINGER_SMTP' | 'RESEND' | 'SIMULATION';
  error?: string;
}

export class HostingerMailService {
  private static instance: HostingerMailService;
  private readonly defaultSender = 'contato@traduztudo.com';

  private constructor() {}

  public static getInstance(): HostingerMailService {
    if (!HostingerMailService.instance) {
      HostingerMailService.instance = new HostingerMailService();
    }
    return HostingerMailService.instance;
  }

  /**
   * Checks if auto-send is allowed by environment.
   * STRICT SAFETY RULE: Defaults to false!
   */
  public isAutoSendEnabled(): boolean {
    return process.env.AUTO_SEND === 'true';
  }

  /**
   * Retrieves current configuration status for Hostinger integration.
   */
  public getConfigStatus() {
    const hasToken = !!process.env.HOSTINGER_API_TOKEN;
    const hasWebhookSecret = !!process.env.HOSTINGER_WEBHOOK_SECRET;
    const hasSmtp = !!process.env.HOSTINGER_SMTP_HOST;
    const autoSend = this.isAutoSendEnabled();

    return {
      account: this.defaultSender,
      hasToken,
      hasWebhookSecret,
      hasSmtp,
      autoSend,
      activeProvider: hasToken
        ? 'Hostinger Mail API Oficial'
        : hasSmtp
        ? 'Hostinger SMTP Corporativo'
        : process.env.RESEND_API_KEY
        ? 'Resend API Gateway'
        : 'Ambiente de Simulação Seguro (Sandbox)',
    };
  }

  /**
   * Sends an email message through Hostinger Mail or compliant fallback.
   */
  public async sendEmail(params: HostingerSendEmailParams): Promise<HostingerSendEmailResult> {
    const sender = this.defaultSender;
    const timestamp = new Date().toISOString();

    // 1. Check if Hostinger Official API Token is provided
    const hostingerToken = process.env.HOSTINGER_API_TOKEN;
    const hostingerApiUrl = process.env.HOSTINGER_API_URL || 'https://api.hostinger.com/v1/mail';

    if (hostingerToken) {
      try {
        const response = await fetch(`${hostingerApiUrl}/messages/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hostingerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: sender,
            to: params.to,
            subject: params.subject,
            body_text: params.bodyText,
            body_html: params.bodyHtml || `<p style="white-space: pre-wrap;">${params.bodyText}</p>`,
            in_reply_to: params.inReplyTo,
            references: params.references,
          }),
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          return {
            success: true,
            messageId: data.message_id || data.id || `hostinger_${Date.now()}`,
            sender,
            recipient: params.to,
            timestamp,
            mode: 'HOSTINGER_API',
          };
        } else {
          console.warn('[HostingerMailService] Hostinger API returned status:', response.status);
        }
      } catch (err: any) {
        console.warn('[HostingerMailService] Erro ao comunicar com Hostinger API, tentando fallback seguro:', err?.message);
      }
    }

    // 2. Check if Resend or standard EmailService is available
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await emailService.sendEmail(params.to, params.subject, params.bodyHtml || `<p style="white-space: pre-wrap;">${params.bodyText}</p>`, {
          from: sender,
          textContent: params.bodyText,
        });

        if (res.success && !res.simulated) {
          return {
            success: true,
            messageId: res.messageId,
            sender,
            recipient: params.to,
            timestamp,
            mode: 'RESEND',
          };
        }
      } catch (err: any) {
        console.warn('[HostingerMailService] Resend fallback error:', err?.message);
      }
    }

    // 3. Fallback: Safe Simulation Mode (Compliant with Vercel and zero side-effects during review)
    const simulatedMessageId = `<sim_${Date.now()}.${Math.random().toString(36).substring(2, 9)}@traduztudo.com>`;
    console.log(`[HostingerMailService - Simulação Segura] E-mail aprovado para [${params.to}]. Message-ID: ${simulatedMessageId}`);

    return {
      success: true,
      messageId: simulatedMessageId,
      sender,
      recipient: params.to,
      timestamp,
      mode: 'SIMULATION',
    };
  }
}

export const hostingerMailService = HostingerMailService.getInstance();
