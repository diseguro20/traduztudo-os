import { NextRequest, NextResponse } from 'next/server';
import { emailStorage } from '@/lib/storage/emailStorage';
import { hostingerMailService } from '@/lib/services/hostingerMailService';
import { EmailMessage } from '@/types/emailCentral';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      emailId,
      action,
      editedDraft,
      userId,
      userName,
      rejectionReason,
    }: {
      emailId: string;
      action: 'APPROVE_AND_SEND' | 'SAVE_DRAFT' | 'REJECT' | 'DELETE_LGPD';
      editedDraft?: string;
      userId?: string;
      userName?: string;
      rejectionReason?: string;
    } = body;

    if (!emailId || !action) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: emailId e action.' },
        { status: 400 }
      );
    }

    const email = await emailStorage.getEmailById(emailId);
    if (!email) {
      return NextResponse.json(
        { error: 'E-mail não encontrado no sistema.' },
        { status: 404 }
      );
    }

    const operatorName = userName || 'Equipe TraduzTudo';
    const operatorId = userId || 'user-admin';
    const now = new Date().toISOString();

    // 1. Action: SAVE_DRAFT
    if (action === 'SAVE_DRAFT') {
      const updated = await emailStorage.updateEmail(emailId, {
        approval: {
          ...email.approval,
          editedDraft: editedDraft || email.aiAnalysis.suggestedDraft,
        },
        auditTrail: [
          ...email.auditTrail,
          {
            timestamp: now,
            action: 'Rascunho de resposta editado pelo operador',
            userId: operatorId,
            userName: operatorName,
            details: 'Texto da resposta ajustado manualmente antes de envio.',
          },
        ],
      });

      return NextResponse.json({
        success: true,
        message: 'Rascunho salvo com sucesso.',
        email: updated,
      });
    }

    // 2. Action: REJECT
    if (action === 'REJECT') {
      const updated = await emailStorage.updateEmail(emailId, {
        status: 'MANUAL_REQUIRED',
        approval: {
          ...email.approval,
          errorMessage: rejectionReason || 'Sugestão da IA rejeitada para atendimento manual.',
        },
        auditTrail: [
          ...email.auditTrail,
          {
            timestamp: now,
            action: 'Sugestão da IA rejeitada',
            userId: operatorId,
            userName: operatorName,
            details: rejectionReason || 'Atendente optou por atendimento manual personalizado.',
          },
        ],
      });

      return NextResponse.json({
        success: true,
        message: 'Sugestão da IA rejeitada. E-mail movido para atendimento manual.',
        email: updated,
      });
    }

    // 3. Action: DELETE_LGPD
    if (action === 'DELETE_LGPD') {
      await emailStorage.deleteOrAnonymize(emailId);
      return NextResponse.json({
        success: true,
        message: 'Dados do e-mail excluídos/anonimizados com sucesso em conformidade com a LGPD.',
      });
    }

    // 4. Action: APPROVE_AND_SEND
    if (action === 'APPROVE_AND_SEND') {
      // Concurrency check: prevent double-sending
      if (email.status === 'SENDING' || email.status === 'SENT') {
        return NextResponse.json(
          { error: 'Este e-mail já foi despachado ou está em processo de envio.' },
          { status: 409 }
        );
      }

      const finalBody = (editedDraft || email.approval.editedDraft || email.aiAnalysis.suggestedDraft || '').trim();

      if (!finalBody) {
        return NextResponse.json(
          { error: 'O corpo da mensagem a ser enviada não pode estar vazio.' },
          { status: 400 }
        );
      }

      // Mark as SENDING first
      await emailStorage.updateEmail(emailId, {
        status: 'SENDING',
        approval: {
          ...email.approval,
          approvedByUserId: operatorId,
          approvedByUserName: operatorName,
          approvedAt: now,
          finalBodySent: finalBody,
        },
      });

      // Dispatch via Hostinger Mail Service
      const replySubject = email.subject.toLowerCase().startsWith('re:')
        ? email.subject
        : `Re: ${email.subject}`;

      const sendResult = await hostingerMailService.sendEmail({
        to: email.from.email,
        subject: replySubject,
        bodyText: finalBody,
        inReplyTo: email.messageId,
        references: email.references ? [...email.references, email.messageId] : [email.messageId],
      });

      if (!sendResult.success) {
        await emailStorage.updateEmail(emailId, {
          status: 'FAILED',
          approval: {
            ...email.approval,
            errorMessage: sendResult.error || 'Falha no despacho do e-mail pela Hostinger.',
          },
          auditTrail: [
            ...email.auditTrail,
            {
              timestamp: new Date().toISOString(),
              action: 'Erro no envio do e-mail',
              userId: operatorId,
              userName: operatorName,
              details: sendResult.error || 'Falha ao despachar via Hostinger Mail API.',
            },
          ],
        });

        return NextResponse.json(
          { error: sendResult.error || 'Falha ao enviar e-mail via Hostinger.' },
          { status: 500 }
        );
      }

      // Update to SENT
      const updated = await emailStorage.updateEmail(emailId, {
        status: 'SENT',
        approval: {
          approvedByUserId: operatorId,
          approvedByUserName: operatorName,
          approvedAt: now,
          finalBodySent: finalBody,
          sendMethod: sendResult.mode,
          sentMessageId: sendResult.messageId,
          sentAt: sendResult.timestamp,
        },
        auditTrail: [
          ...email.auditTrail,
          {
            timestamp: sendResult.timestamp,
            action: `Resposta aprovada e enviada via ${sendResult.mode}`,
            userId: operatorId,
            userName: operatorName,
            details: `Despachado para ${email.from.email} com Message-ID: ${sendResult.messageId}`,
          },
        ],
      });

      return NextResponse.json({
        success: true,
        message: `E-mail enviado com sucesso para ${email.from.email} via ${sendResult.mode}!`,
        email: updated,
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (error: any) {
    console.error('[EmailCentral Action Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao executar ação no e-mail.' },
      { status: 500 }
    );
  }
}
