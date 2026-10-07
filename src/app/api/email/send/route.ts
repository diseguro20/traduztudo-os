import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      from,
      subject,
      message,
      htmlMessage,
      documentName,
      documentUrl,
    }: {
      to: string;
      from?: string;
      subject: string;
      message: string;
      htmlMessage?: string;
      documentName?: string;
      documentUrl?: string;
    } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: destinatário (to), assunto (subject) e mensagem.' },
        { status: 400 }
      );
    }

    const htmlContent =
      htmlMessage ||
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">TraduzTudo — Traduções Oficiais</h1>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="white-space: pre-wrap; margin-bottom: 24px;">${message}</div>
          ${
            documentUrl
              ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${documentUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Acessar e Baixar Documento
              </a>
            </div>
            `
              : ''
          }
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            Este e-mail foi enviado por TraduzTudo Traduções Juramentadas e Certificadas.<br />
            Remetente: ${from || 'contato@traduztudo.com.br'}
          </p>
        </div>
      </div>
    `;

    const result = await emailService.sendEmail(to, subject, htmlContent, {
      from,
      textContent: message,
      documentName,
      documentUrl,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient: result.recipient,
      sender: result.sender,
      timestamp: result.timestamp,
      simulated: result.simulated,
    });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar disparo de e-mail.' },
      { status: 500 }
    );
  }
}
