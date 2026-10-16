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
   * STRICT SAFETY RULE: Defaults to false (Option 1 - Copilot with human approval)!
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
    const hasSmtp = !!process.env.HOSTINGER_SMTP_PASS;
    const autoSend = this.isAutoSendEnabled();

    return {
      account: this.defaultSender,
      hasToken,
      hasWebhookSecret,
      hasSmtp,
      autoSend,
      activeProvider: hasSmtp
        ? 'Hostinger SMTP Corporativo Oficial (Ativo)'
        : hasToken
        ? 'Hostinger Mail API Oficial'
        : process.env.RESEND_API_KEY
        ? 'Resend API Gateway'
        : 'Ambiente de Simulação Seguro (Sandbox)',
    };
  }

  /**
   * Sends an email message through Hostinger Mail SMTP or compliant fallback.
   */
  public async sendEmail(params: HostingerSendEmailParams): Promise<HostingerSendEmailResult> {
    const sender = process.env.HOSTINGER_SMTP_USER || this.defaultSender;
    const timestamp = new Date().toISOString();

    // 1. Direct Real Hostinger SMTP (Primary production delivery)
    const smtpPass = process.env.HOSTINGER_SMTP_PASS;
    const smtpUser = process.env.HOSTINGER_SMTP_USER || this.defaultSender;
    const smtpHost = process.env.HOSTINGER_SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = Number(process.env.HOSTINGER_SMTP_PORT) || 465;

    if (smtpPass) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from: `"Traduz Tudo" <${smtpUser}>`,
          to: params.to,
          subject: params.subject,
          text: params.bodyText,
          html: params.bodyHtml || `<p style="white-space: pre-wrap;">${params.bodyText}</p>`,
          inReplyTo: params.inReplyTo,
          references: params.references,
        });

        console.log(`[HostingerMailService] E-mail entregue com sucesso via Hostinger SMTP para [${params.to}]. Message-ID: ${info.messageId}`);

        return {
          success: true,
          messageId: info.messageId || `hostinger_smtp_${Date.now()}`,
          sender: smtpUser,
          recipient: params.to,
          timestamp,
          mode: 'HOSTINGER_SMTP',
        };
      } catch (err: any) {
        console.error('[HostingerMailService] Erro no envio via Hostinger SMTP:', err?.message);
        // We will continue to fallback if SMTP fails
      }
    }

    // 2. Check if Hostinger Official REST API Token is provided
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
        }
      } catch (err: any) {
        console.warn('[HostingerMailService] Erro ao comunicar com Hostinger API:', err?.message);
      }
    }

    // 3. Fallback: Resend Gateway
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

    // 4. Fallback: Safe Simulation Mode
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
