import { NextRequest, NextResponse } from 'next/server';
import { campaignEngine } from '@/lib/prospecting/campaignEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let options = {};
    try {
      options = await req.json();
    } catch {
      // Empty body is fine for cron
    }

    const result = await campaignEngine.executeCampaignDispatch(options);

    return NextResponse.json({
      success: true,
      message: `Disparo de campanha executado com sucesso! ${result.sentCount} e-mails entregues, ${result.failedCount} falhas, ${result.skippedCount} ignorados.`,
      result,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/cron/dispatch] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro durante a rotina de disparo de campanhas.' },
      { status: 500 }
    );
  }
}
