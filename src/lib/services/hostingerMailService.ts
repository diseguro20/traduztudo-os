import { emailService } from '@/lib/services/email';

export interface HostingerSendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string[];
  fromName?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
    cid?: string;
  }>;
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

/**
 * Synchronizes an outbound email to Hostinger Webmail's "Enviados" folder (INBOX.Sent) via IMAP.
 */
async function appendToHostingerSent(
  mailOptions: any,
  smtpUser: string,
  smtpPass: string
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MailComposer = require('nodemailer/lib/mail-composer');
    const tls = await import('tls');

    return new Promise((resolve) => {
      const composer = new MailComposer(mailOptions);
      composer.compile().build((err: any, rawBuf: Buffer) => {
        if (err || !rawBuf) {
          console.warn('[HostingerMailService] Erro ao compilar RFC822 para IMAP Sent:', err);
          return resolve(false);
        }

        const client = tls.connect({ port: 993, host: 'imap.hostinger.com' });
        let step = 0;

        client.on('data', (data) => {
          const str = data.toString();
          if (step === 0 && str.includes('* OK')) {
            step = 1;
            client.write(`A1 LOGIN "${smtpUser}" "${smtpPass}"\r\n`);
          } else if (step === 1 && str.includes('A1 OK')) {
            step = 2;
            const size = Buffer.byteLength(rawBuf);
            client.write(`A2 APPEND "INBOX.Sent" (\\Seen) {${size}}\r\n`);
          } else if (step === 2 && str.includes('+')) {
            step = 3;
            client.write(rawBuf);
            client.write('\r\n');
          } else if (step === 3 && (str.includes('A2 OK') || str.includes('A2 NO') || str.includes('A2 BAD'))) {
            client.write('A3 LOGOUT\r\n');
            client.destroy();
            resolve(str.includes('A2 OK'));
          }
        });

        client.on('error', (e) => {
          console.warn('[HostingerMailService] IMAP Sent sync warning:', e.message);
          resolve(false);
        });

        setTimeout(() => {
          client.destroy();
          resolve(false);
        }, 12000);
      });
    });
  } catch (err: any) {
    console.warn('[HostingerMailService] Erro geral ao sincronizar Sent IMAP:', err?.message);
    return false;
  }
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
   * Connects to Hostinger IMAP (imap.hostinger.com:993), scans INBOX for Mail Delivery System
   * bounce / non-delivery notifications, extracts any bounced recipient emails, flags them
   * as \Deleted, and EXPUNGEs them permanently so they do not clutter the inbox.
   */
  public async purgeBounces(): Promise<{
    success: boolean;
    bouncesDeleted: number;
    extractedFailedEmails: string[];
    error?: string;
  }> {
    const smtpPass = process.env.HOSTINGER_SMTP_PASS;
    const smtpUser = process.env.HOSTINGER_SMTP_USER || this.defaultSender;
    const imapHost = 'imap.hostinger.com';
    const imapPort = 993;

    if (!smtpPass) {
      return {
        success: false,
        bouncesDeleted: 0,
        extractedFailedEmails: [],
        error: 'HOSTINGER_SMTP_PASS não configurada.',
      };
    }

    try {
      const tls = await import('tls');

      return new Promise((resolve) => {
        const client = tls.connect({ host: imapHost, port: imapPort });
        client.setEncoding('utf8');

        let rawBuffer = '';
        let step = 0;
        const bounceSeqList: number[] = [];
        const extractedEmails: string[] = [];
        let isResolved = false;

        const safeResolve = (result: any) => {
          if (!isResolved) {
            isResolved = true;
            try {
              client.destroy();
            } catch {}
            resolve(result);
          }
        };

        const timeoutId = setTimeout(() => {
          safeResolve({
            success: bounceSeqList.length > 0,
            bouncesDeleted: bounceSeqList.length,
            extractedFailedEmails: extractedEmails,
            error: 'Timeout ao limpar mensagens de bounce via IMAP.',
          });
        }, 25000);

        client.on('error', (err) => {
          clearTimeout(timeoutId);
          safeResolve({
            success: false,
            bouncesDeleted: 0,
            extractedFailedEmails: [],
            error: err.message,
          });
        });

        client.on('data', (chunk) => {
          rawBuffer += chunk;

          // Step 0: Greeting
          if (step === 0 && rawBuffer.includes('* OK')) {
            step = 1;
            rawBuffer = '';
            client.write(`T1 LOGIN "${smtpUser}" "${smtpPass}"\r\n`);
            return;
          }

          // Step 1: Login Response
          if (step === 1 && rawBuffer.includes('T1 OK')) {
            step = 2;
            rawBuffer = '';
            client.write(`T2 SELECT "INBOX"\r\n`);
            return;
          } else if (step === 1 && (rawBuffer.includes('T1 NO') || rawBuffer.includes('T1 BAD'))) {
            clearTimeout(timeoutId);
            safeResolve({
              success: false,
              bouncesDeleted: 0,
              extractedFailedEmails: [],
              error: 'Falha de autenticação IMAP no Hostinger.',
            });
            return;
          }

          // Step 2: Select INBOX Response
          if (step === 2 && rawBuffer.includes('T2 OK')) {
            step = 3;
            rawBuffer = '';
            client.write(`T3 SEARCH ALL\r\n`);
            return;
          }

          // Step 3: Search Response
          if (step === 3 && rawBuffer.includes('T3 OK')) {
            const searchMatch = rawBuffer.match(/\*\s+SEARCH\s+(.*)/i);
            const rawNumbers = searchMatch && searchMatch[1]
              ? searchMatch[1].trim().split(/\s+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n))
              : [];

            rawBuffer = '';

            if (rawNumbers.length === 0) {
              clearTimeout(timeoutId);
              client.write(`T7 LOGOUT\r\n`);
              safeResolve({
                success: true,
                bouncesDeleted: 0,
                extractedFailedEmails: [],
              });
              return;
            }

            step = 4;
            const minSeq = Math.max(1, rawNumbers[rawNumbers.length - 1] - 200);
            const maxSeq = rawNumbers[rawNumbers.length - 1];
            client.write(`T4 FETCH ${minSeq}:${maxSeq} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT TO DATE)] BODY.PEEK[TEXT]<0.1200>)\r\n`);
            return;
          }

          // Step 4: Fetch Response
          if (step === 4 && rawBuffer.includes('T4 OK')) {
            const items = rawBuffer.split(/\*\s+(\d+)\s+FETCH/gi);
            for (let i = 1; i < items.length; i += 2) {
              const seq = parseInt(items[i], 10);
              const content = items[i + 1] || '';

              const isBounce =
                /from:.*(?:mail delivery system|mailer-daemon|postmaster)/i.test(content) ||
                /subject:.*(?:undelivered mail|delivery status notification|failure notice|returned to sender)/i.test(content) ||
                /Action:\s*failed/i.test(content) ||
                /Status:\s*5\.\d+\.\d+/i.test(content);

              if (isBounce && !isNaN(seq)) {
                if (!bounceSeqList.includes(seq)) {
                  bounceSeqList.push(seq);
                }

                const emailMatches = content.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g);
                if (emailMatches) {
                  for (const em of emailMatches) {
                    const clean = em.replace(/[<>]/g, '').toLowerCase().trim();
                    if (
                      !clean.includes('traduztudo.com') &&
                      !clean.includes('hostinger') &&
                      !clean.includes('postmaster') &&
                      !clean.includes('mailer-daemon') &&
                      !extractedEmails.includes(clean)
                    ) {
                      extractedEmails.push(clean);
                    }
                  }
                }
              }
            }

            rawBuffer = '';

            if (bounceSeqList.length === 0) {
              clearTimeout(timeoutId);
              client.write(`T7 LOGOUT\r\n`);
              safeResolve({
                success: true,
                bouncesDeleted: 0,
                extractedFailedEmails: [],
              });
              return;
            }

            step = 5;
            client.write(`T5 STORE ${bounceSeqList.join(',')} +FLAGS (\\Deleted)\r\n`);
            return;
          }

          // Step 5: Store Flags Response
          if (step === 5 && rawBuffer.includes('T5 OK')) {
            step = 6;
            rawBuffer = '';
            client.write(`T6 EXPUNGE\r\n`);
            return;
          }

          // Step 6: Expunge Response
          if (step === 6 && rawBuffer.includes('T6 OK')) {
            step = 7;
            rawBuffer = '';
            client.write(`T7 LOGOUT\r\n`);
            clearTimeout(timeoutId);
            safeResolve({
              success: true,
              bouncesDeleted: bounceSeqList.length,
              extractedFailedEmails: extractedEmails,
            });
            return;
          }
        });
      });
    } catch (err: any) {
      console.warn('[HostingerMailService] Erro ao limpar bounces:', err?.message);
      return {
        success: false,
        bouncesDeleted: 0,
        extractedFailedEmails: [],
        error: err?.message,
      };
    }
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

        const senderDisplayName = params.fromName || 'Iago Peixoto | Traduz Tudo';

        const mailOptions: any = {
          from: `"${senderDisplayName}" <${smtpUser}>`,
          to: params.to,
          subject: params.subject,
          text: params.bodyText,
          html: params.bodyHtml || `<p style="white-space: pre-wrap;">${params.bodyText}</p>`,
          inReplyTo: params.inReplyTo,
          references: params.references,
        };

        if (params.attachments && params.attachments.length > 0) {
          mailOptions.attachments = params.attachments;
        }

        const info = await transporter.sendMail(mailOptions);

        console.log(`[HostingerMailService] E-mail entregue com sucesso via Hostinger SMTP para [${params.to}]. Message-ID: ${info.messageId}`);

        // Automatically sync to Hostinger Webmail's "Enviados" folder (INBOX.Sent)
        appendToHostingerSent(mailOptions, smtpUser, smtpPass)
          .then((synced) => {
            if (synced) {
              console.log(`[HostingerMailService] Mensagem arquivada com sucesso na pasta "Enviados" (INBOX.Sent) da Hostinger.`);
            }
          })
          .catch((e) => console.warn('[HostingerMailService] IMAP sync notice:', e));

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
