import { NextRequest, NextResponse } from 'next/server';
import { timingSafeCompare, isAutomatedOrLoopEmail, generateSnippet } from '@/lib/services/emailSecurity';
import { processEmailWithAgent } from '@/lib/ai/traduzTudoEmailAgent';
import { emailStorage } from '@/lib/storage/emailStorage';
import { EmailMessage, HostingerWebhookPayload } from '@/types/emailCentral';

export const dynamic = 'force-dynamic';

/**
 * GET Handler for Webhook Verification / Healthcheck by Hostinger
 */
export async function GET(req: NextRequest) {
  // Allow challenge echo if Hostinger sends a challenge/token parameter
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('challenge') || searchParams.get('hub.challenge');

  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/hostinger-mail',
    account: 'contato@traduztudo.com',
    service: 'TraduzTudo OS Hostinger Mail Inbound Gateway',
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST Handler for Hostinger Inbound Email Webhook (event: message.received)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate Request via Bearer Token with constant-time comparison
    const authHeader = req.headers.get('authorization') || '';
    const tokenHeader = req.headers.get('x-hostinger-token') || req.headers.get('x-webhook-secret') || '';
    const providedToken = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : tokenHeader.trim();

    const expectedSecret =
      process.env.HOSTINGER_WEBHOOK_SECRET ||
      process.env.HOSTINGER_API_TOKEN ||
      process.env.NEXT_PUBLIC_API_SECRET_KEY ||
      'traduztudo-saas-api-secret-key-2026';

    const isAuthenticated = providedToken ? timingSafeCompare(providedToken, expectedSecret) : false;

    if (!isAuthenticated) {
      console.warn('[Hostinger Webhook] Tentativa de acesso não autorizada ao endpoint de e-mails.');
      return NextResponse.json(
        { error: 'Não autorizado. Bearer token inválido ou ausente.' },
        { status: 401 }
      );
    }

    // 2. Safely Parse Payload without assuming rigid structure
    let payload: HostingerWebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Payload inválido. JSON mal formatado.' },
        { status: 400 }
      );
    }

    // Validate if it is a message.received event or similar notification
    const eventType = payload.event || 'message.received';
    const rawData: any = (payload as any).data || payload;

    // 3. Extract Sender info
    let senderName = 'Cliente';
    let senderEmail = '';

    if (typeof rawData.from === 'string') {
      const match = rawData.from.match(/(.*)<(.+)>/);
      if (match) {
        senderName = match[1].replace(/["']/g, '').trim() || 'Cliente';
        senderEmail = match[2].trim().toLowerCase();
      } else {
        senderEmail = rawData.from.trim().toLowerCase();
        senderName = senderEmail.split('@')[0];
      }
    } else if (rawData.from && typeof rawData.from === 'object') {
      senderName = rawData.from.name || 'Cliente';
      senderEmail = (rawData.from.email || '').toLowerCase().trim();
    }

    if (!senderEmail) {
      return NextResponse.json(
        { error: 'Formato de mensagem inválido: remetente (from) não identificado.' },
        { status: 422 }
      );
    }

    // 4. Extract Subject, Body and Message IDs
    const subject = rawData.subject || '(Sem assunto)';
    const bodyText = rawData.body_text || rawData.text || rawData.snippet || '';
    const bodyHtml = rawData.body_html || rawData.html;
    const rawMessageId =
      rawData.message_id ||
      payload.message_id ||
      rawData.id ||
      `<hostinger.${Date.now()}.${Math.random().toString(36).substring(2, 9)}@traduztudo.com>`;
    const eventId = payload.event_id || rawData.id;

    // 5. Anti-Loop & Anti-Spam Check
    const loopCheck = isAutomatedOrLoopEmail({
      from: senderEmail,
      subject,
      bodyText,
      headers: rawData.headers,
    });

    if (loopCheck.isLoop) {
      console.log(`[Hostinger Webhook] E-mail ignorado para evitar loops: ${loopCheck.reason}`);
      return NextResponse.json({
        success: true,
        status: 'ignored_loop',
        reason: loopCheck.reason,
        messageId: rawMessageId,
      });
    }

    // 6. Strict Idempotency Check
    const alreadyProcessed = await emailStorage.hasMessageBeenProcessed(rawMessageId, eventId);
    if (alreadyProcessed) {
      console.log(`[Hostinger Webhook] Mensagem já processada anteriormente (idempotência): ${rawMessageId}`);
      return NextResponse.json({
        success: true,
        status: 'already_processed',
        messageId: rawMessageId,
      });
    }

    // 7. Extract Attachments
    const rawAttachments = rawData.attachments || [];
    const attachments = rawAttachments.map((att: any, idx: number) => ({
      id: `att-${Date.now()}-${idx}`,
      name: att.name || att.filename || `anexo_${idx + 1}`,
      mimeType: att.mime_type || att.content_type || 'application/octet-stream',
      size: Number(att.size) || 0,
      url: att.url,
    }));

    // 8. Process with AI Agent
    const agentOutput = await processEmailWithAgent({
      senderName,
      senderEmail,
      subject,
      bodyText,
      attachments,
    });

    // 9. Construct Normalized Thread and Message
    const emailId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const threadId = rawData.in_reply_to || `thread-${senderEmail}-${subject.replace(/re:\s*/i, '').trim().substring(0, 30)}`;

    const newEmailMessage: EmailMessage = {
      id: emailId,
      tenantId: 'traduztudo-matriz',
      messageId: rawMessageId,
      threadId,
      inReplyTo: rawData.in_reply_to,
      references: Array.isArray(rawData.references)
        ? rawData.references
        : rawData.references
        ? [rawData.references]
        : [],
      eventId,
      from: {
        name: senderName,
        email: senderEmail,
      },
      to: Array.isArray(rawData.to)
        ? rawData.to.map((t: any) => (typeof t === 'string' ? t : t.email))
        : [typeof rawData.to === 'string' ? rawData.to : 'contato@traduztudo.com'],
      subject,
      bodyText,
      bodyHtml,
      snippet: generateSnippet(bodyText),
      attachments,
      receivedAt: rawData.date || new Date().toISOString(),
      status: 'AWAITING_APPROVAL', // Strict human approval workflow by default
      classification: agentOutput.classification,
      aiAnalysis: agentOutput.aiAnalysis,
      approval: {},
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          action: 'E-mail recebido via Hostinger Mail Webhook',
          details: `Evento: ${eventType} | Message-ID: ${rawMessageId}`,
        },
        {
          timestamp: new Date().toISOString(),
          action: 'Análise de IA Concluída',
          details: `Classificado como ${agentOutput.classification.category} (${agentOutput.classification.serviceType}). Ação sugerida: ${agentOutput.aiAnalysis.recommendedAction}`,
        },
      ],
      isAutoSubmitted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 10. Persist Atomically
    await emailStorage.saveEmail(newEmailMessage);

    const duration = Date.now() - startTime;
    console.log(`[Hostinger Webhook] E-mail [${rawMessageId}] de [${senderEmail}] processado e salvo com sucesso em ${duration}ms.`);

    return NextResponse.json({
      success: true,
      messageId: rawMessageId,
      emailId: newEmailMessage.id,
      category: agentOutput.classification.category,
      recommendedAction: agentOutput.aiAnalysis.recommendedAction,
      status: newEmailMessage.status,
      durationMs: duration,
    });
  } catch (error: any) {
    console.error('[Hostinger Webhook Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno no processamento do webhook da Hostinger.' },
      { status: 500 }
    );
  }
}
