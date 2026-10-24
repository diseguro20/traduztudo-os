import { NextRequest, NextResponse } from 'next/server';
import { hostingerMailService } from '@/lib/services/hostingerMailService';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { emailStorage } from '@/lib/storage/emailStorage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handlePurge(req: NextRequest) {
  try {
    console.log('[API /api/email/purge-bounces] Iniciando limpeza de e-mails com erro/bounce no Webmail Hostinger...');

    // 1. Purge from Hostinger IMAP inbox
    const purgeResult = await hostingerMailService.purgeBounces();

    // 2. Mark bounced emails in CRM and add to suppression list
    let updatedCompaniesCount = 0;
    if (purgeResult.extractedFailedEmails && purgeResult.extractedFailedEmails.length > 0) {
      for (const email of purgeResult.extractedFailedEmails) {
        try {
          await prospectingStorage.addToSuppression(
            email,
            undefined,
            'BOUNCE',
            'E-mail retornou bounce / Undelivered Mail Returned to Sender'
          );

          const comp = await prospectingStorage.getCompanyByEmail(email);
          if (comp) {
            await prospectingStorage.updateCompany(comp.id, {
              status: 'CONTATO_INVALIDO',
              optOut: true,
            });
            updatedCompaniesCount++;
          }
        } catch (e: any) {
          console.warn(`[PurgeBounces] Erro ao suprimir ${email}:`, e?.message);
        }
      }
    }

    // 3. Clean any bounce records stored in Central de Emails
    try {
      const allEmails = await emailStorage.listEmails();
      const bounceMessages = allEmails.filter((e) => {
        const fromStr = typeof e.from === 'string' ? e.from : `${e.from?.name || ''} ${e.from?.email || ''}`;
        const subStr = e.subject || '';
        return (
          fromStr.toLowerCase().includes('mail delivery system') ||
          fromStr.toLowerCase().includes('mailer-daemon') ||
          subStr.toLowerCase().includes('undelivered mail') ||
          subStr.toLowerCase().includes('delivery status notification')
        );
      });

      for (const b of bounceMessages) {
        await emailStorage.deleteEmail(b.id);
      }
    } catch (e: any) {
      console.warn('[PurgeBounces] Aviso ao limpar mensagens locais:', e?.message);
    }

    return NextResponse.json({
      success: true,
      bouncesDeleted: purgeResult.bouncesDeleted,
      cleanedRecipients: purgeResult.extractedFailedEmails,
      updatedCompaniesCount,
      message: `${purgeResult.bouncesDeleted} e-mails de erro/bounce foram excluídos permanentemente da caixa de entrada do Hostinger Webmail e ${purgeResult.extractedFailedEmails.length} contatos inválidos foram removidos do CRM.`,
    });
  } catch (error: any) {
    console.error('[API /api/email/purge-bounces Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erro ao executar a limpeza de e-mails com erro.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handlePurge(req);
}

export async function POST(req: NextRequest) {
  return handlePurge(req);
}
