import { NextRequest, NextResponse } from 'next/server';
import { emailStorage } from '@/lib/storage/emailStorage';
import { hostingerMailService } from '@/lib/services/hostingerMailService';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { EmailMessage, EmailCategory, EmailMessageStatus } from '@/types/emailCentral';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const emails = await emailStorage.listEmails({
      status,
      category,
      search,
    });

    // Also include outbound prospecting messages so the "Enviados" tab shows all campaign emails
    const outbound = await prospectingStorage.listOutboundMessages(undefined, 200);
    const outboundAsEmailMessages: EmailMessage[] = outbound.map((m) => ({
      id: m.id,
      tenantId: m.tenantId,
      messageId: m.messageId || `<${m.id}@traduztudo.com>`,
      threadId: `th_${m.id}`,
      from: {
        name: 'Iago Peixoto | Traduz Tudo',
        email: 'contato@traduztudo.com',
      },
      to: [m.recipientEmail],
      subject: m.subject,
      bodyText: m.bodyText,
      bodyHtml: m.bodyHtml,
      snippet: m.bodyText ? m.bodyText.substring(0, 140) : m.subject,
      attachments: [],
      receivedAt: m.sentAt,
      status: 'SENT' as EmailMessageStatus,
      classification: {
        category: 'CORPORATIVO' as EmailCategory,
        urgency: 'MEDIA',
        confidence: 1,
        missingInformation: [],
      },
      aiAnalysis: {
        summary: `Proposta B2B enviada para ${m.recipientName || m.recipientEmail}`,
        sentiment: 'POSITIVO',
        recommendedAction: 'RESPONDER',
        suggestedDraft: '',
        draftConfidence: 1,
        rationale: 'Campanha de prospecção ativa TraduzTudo OS.',
        jailbreakAttemptDetected: false,
        modelUsed: 'prospecting-pacer',
        processingTimeMs: 0,
      },
      approval: {
        approvedAt: m.sentAt,
        sentMessageId: m.messageId,
        sentAt: m.sentAt,
        sendMethod: 'HOSTINGER_SMTP',
      },
      auditTrail: [
        {
          timestamp: m.sentAt,
          action: 'CAMPAIGN_DISPATCH',
          userName: 'Motor de Prospecção IA',
          details: `Disparo automático para ${m.recipientEmail}`,
        },
      ],
      isAutoSubmitted: false,
      createdAt: m.sentAt,
      updatedAt: m.sentAt,
    }));

    // Merge and deduplicate
    const combinedEmails = [...emails];
    const seenIds = new Set(emails.map((e) => e.messageId || e.id));
    for (const outMsg of outboundAsEmailMessages) {
      if (!seenIds.has(outMsg.messageId) && !seenIds.has(outMsg.id)) {
        seenIds.add(outMsg.messageId);
        combinedEmails.push(outMsg);
      }
    }

    // Filter combined list by status / category / search if provided
    let filteredList = combinedEmails;
    if (status && status !== 'ALL') {
      filteredList = filteredList.filter((e) => e.status === status);
    }
    if (category && category !== 'ALL') {
      filteredList = filteredList.filter((e) => e.classification?.category === category);
    }
    if (search) {
      const term = search.toLowerCase();
      filteredList = filteredList.filter(
        (e) =>
          e.subject.toLowerCase().includes(term) ||
          e.from.email.toLowerCase().includes(term) ||
          e.to.some((t) => t.toLowerCase().includes(term)) ||
          e.bodyText.toLowerCase().includes(term)
      );
    }

    // Sort descending by date
    filteredList.sort((a, b) => new Date(b.receivedAt || b.createdAt).getTime() - new Date(a.receivedAt || a.createdAt).getTime());

    const allCombined = combinedEmails;
    const stats = {
      total: allCombined.length,
      awaitingApproval: allCombined.filter((e) => e.status === 'AWAITING_APPROVAL').length,
      approved: allCombined.filter((e) => e.status === 'APPROVED' || e.status === 'SENT').length,
      sent: allCombined.filter((e) => e.status === 'SENT').length,
      quotes: allCombined.filter((e) => e.classification.category === 'ORCAMENTO').length,
      citizenship: allCombined.filter((e) => e.classification.category === 'CIDADANIA').length,
      rejectedOrManual: allCombined.filter((e) => e.status === 'REJECTED' || e.status === 'MANUAL_REQUIRED').length,
    };

    const hostingerStatus = hostingerMailService.getConfigStatus();

    return NextResponse.json({
      success: true,
      emails: filteredList,
      stats,
      hostingerStatus,
    });
  } catch (error: any) {
    console.error('[EmailCentral API Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar central de e-mails.' },
      { status: 500 }
    );
  }
}
