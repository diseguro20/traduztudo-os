import { NextRequest, NextResponse } from 'next/server';
import { emailStorage } from '@/lib/storage/emailStorage';
import { hostingerMailService } from '@/lib/services/hostingerMailService';

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

    const all = await emailStorage.listEmails();
    const stats = {
      total: all.length,
      awaitingApproval: all.filter((e) => e.status === 'AWAITING_APPROVAL').length,
      approved: all.filter((e) => e.status === 'APPROVED' || e.status === 'SENT').length,
      sent: all.filter((e) => e.status === 'SENT').length,
      quotes: all.filter((e) => e.classification.category === 'ORCAMENTO').length,
      citizenship: all.filter((e) => e.classification.category === 'CIDADANIA').length,
      rejectedOrManual: all.filter((e) => e.status === 'REJECTED' || e.status === 'MANUAL_REQUIRED').length,
    };

    const hostingerStatus = hostingerMailService.getConfigStatus();

    return NextResponse.json({
      success: true,
      emails,
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
