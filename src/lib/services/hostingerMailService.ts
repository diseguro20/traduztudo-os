import { emailService } from '@/lib/services/email';
import fs from 'fs';
import path from 'path';

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

export class HostingerMailService {
  private static instance: HostingerMailService;
  private readonly defaultSender = 'contato@traduztudo.com';
  private cachedMailboxId: string | null = null;

  private constructor() {}

  public static getInstance(): HostingerMailService {
    if (!HostingerMailService.instance) {
      HostingerMailService.instance = new HostingerMailService();
    }
    return HostingerMailService.instance;
  }

  /**
   * Discovers the mailbox resource ID for Hostinger Mail API
   */
  public async getMailboxResourceId(token: string): Promise<string | null> {
    if (this.cachedMailboxId) return this.cachedMailboxId;
    if (process.env.HOSTINGER_MAILBOX_ID) {
      this.cachedMailboxId = process.env.HOSTINGER_MAILBOX_ID;
      return this.cachedMailboxId;
    }

    try {
      const res = await fetch('https://api.mail.hostinger.com/api/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const mb = json.data?.mailboxes?.[0]?.resourceId;
        if (mb) {
          this.cachedMailboxId = mb;
          return mb;
        }
      }
    } catch (err: any) {
      console.warn('[HostingerMailService] Erro ao obter mailboxResourceId:', err?.message);
    }
    return null;
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
      activeProvider: hasToken
        ? 'Hostinger Mail API Oficial (Agentic Mail - Ativo)'
        : hasSmtp
        ? 'Hostinger SMTP Corporativo Oficial (Ativo)'
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

    // 1. Hostinger Official REST API (Agentic Mail - Highest priority to bypass SMTP MailChannels bot heuristic)
    const hostingerToken = process.env.HOSTINGER_API_TOKEN;
    if (hostingerToken) {
      try {
        const mbId = (await this.getMailboxResourceId(hostingerToken)) || process.env.HOSTINGER_MAILBOX_ID || 'AC2dabd81fa6350e5328de6c5de63e';
        const senderDisplayName = params.fromName || 'Iago Peixoto | Traduz Tudo';

        const apiAttachments = (params.attachments || []).map((att) => {
          let contentBase64 = '';
          if (Buffer.isBuffer(att.content)) {
            contentBase64 = att.content.toString('base64');
          } else if (typeof att.content === 'string') {
            contentBase64 = Buffer.from(att.content).toString('base64');
          } else if (att.path && fs.existsSync(att.path)) {
            contentBase64 = fs.readFileSync(att.path).toString('base64');
          }

          return {
            filename: att.filename,
            content: contentBase64,
            contentType: att.contentType || 'image/png',
            cid: att.cid,
            encoding: 'base64',
          };
        });

        const payload: any = {
          to: [params.to],
          displayName: senderDisplayName,
          subject: params.subject,
          text: params.bodyText,
          html: params.bodyHtml || `<p style="white-space: pre-wrap;">${params.bodyText}</p>`,
          ...(apiAttachments.length > 0 ? { attachments: apiAttachments } : {}),
        };

        const res = await fetch(`https://api.mail.hostinger.com/api/v1/mailboxes/${mbId}/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hostingerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.status === 204 || res.ok) {
          const messageId = `hostinger_api_${Date.now()}`;
          console.log(`[HostingerMailService] E-mail entregue com sucesso via Hostinger Mail API para [${params.to}].`);
          return {
            success: true,
            messageId,
            sender,
            recipient: params.to,
            timestamp,
            mode: 'HOSTINGER_API',
          };
        } else {
          const errBody = await res.text().catch(() => '');
          console.warn(`[HostingerMailService] Hostinger Mail API retornou ${res.status}: ${errBody}. Tentando fallback SMTP...`);
        }
      } catch (err: any) {
        console.warn('[HostingerMailService] Erro na Hostinger Mail API:', err?.message, 'Tentando fallback SMTP...');
      }
    }

    // 2. Direct Real Hostinger SMTP (Seamless Fallback)
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

        // Automatically append copy to Hostinger Webmail "INBOX.Sent" folder
        this.appendToSentImap({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          bodyText: mailOptions.text,
          bodyHtml: mailOptions.html,
          messageId: info.messageId,
        }).catch((err) => console.warn('[HostingerMailService] IMAP Sent append notice:', err?.message));

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
        return {
          success: false,
          messageId: '',
          sender: smtpUser,
          recipient: params.to,
          timestamp,
          mode: 'HOSTINGER_SMTP',
          error: err?.message || 'Erro ao enviar via Hostinger SMTP',
        };
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

  /**
   * Appends a copy of a sent email to the Hostinger IMAP "INBOX.Sent" folder
   * so that it appears in Webmail under "Itens Enviados".
   */
  public async appendToSentImap(mailOptions: {
    from: string;
    to: string;
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    messageId?: string;
  }): Promise<boolean> {
    const smtpPass = process.env.HOSTINGER_SMTP_PASS;
    const smtpUser = process.env.HOSTINGER_SMTP_USER || this.defaultSender;
    if (!smtpPass) return false;

    try {
      const tls = await import('tls');
      const rawMessage = [
        `From: ${mailOptions.from}`,
        `To: ${mailOptions.to}`,
        `Subject: ${mailOptions.subject}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: ${mailOptions.messageId || `<${Date.now()}@traduztudo.com>`}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        mailOptions.bodyHtml || mailOptions.bodyText || '',
      ].join('\r\n');

      const byteLength = Buffer.byteLength(rawMessage, 'utf8');

      return new Promise<boolean>((resolve) => {
        const client = tls.connect({
          host: 'imap.hostinger.com',
          port: 993,
          rejectUnauthorized: false,
        });
        client.setEncoding('utf8');

        let buffer = '';
        let step = 0;

        const timeout = setTimeout(() => {
          try { client.destroy(); } catch {}
          resolve(false);
        }, 10000);

        client.on('data', (chunk) => {
          buffer += chunk;
          if (step === 0 && buffer.includes('* OK')) {
            step = 1;
            buffer = '';
            client.write(`A1 LOGIN "${smtpUser}" "${smtpPass}"\r\n`);
          } else if (step === 1 && buffer.includes('A1 OK')) {
            step = 2;
            buffer = '';
            client.write(`A2 APPEND "INBOX.Sent" (\\Seen) {${byteLength}}\r\n`);
          } else if (step === 2 && buffer.includes('+')) {
            step = 3;
            buffer = '';
            client.write(rawMessage + '\r\n');
          } else if (step === 3 && buffer.includes('A2 OK')) {
            clearTimeout(timeout);
            client.write('A3 LOGOUT\r\n');
            try { client.end(); } catch {}
            resolve(true);
          } else if (buffer.includes('NO') || buffer.includes('BAD')) {
            clearTimeout(timeout);
            try { client.destroy(); } catch {}
            resolve(false);
          }
        });

        client.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      });
    } catch (e: any) {
      console.warn('[HostingerMailService] Erro ao sincronizar com Itens Enviados (IMAP):', e?.message);
      return false;
    }
  }
}

export const hostingerMailService = HostingerMailService.getInstance();
