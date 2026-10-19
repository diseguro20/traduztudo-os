import { NextRequest, NextResponse } from 'next/server';
import { campaignEngine } from '@/lib/prospecting/campaignEngine';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handleDispatch(req: NextRequest) {
  try {
    let options: any = {};
    if (req.method === 'POST') {
      try {
        options = await req.json();
      } catch {
        // Empty body is fine for cron
      }
    }

    const settings = await prospectingStorage.getSettings();
    const isManualTrigger = req.headers.get('x-manual-trigger') === 'true' || options.force === true;

    // Check if auto-send is enabled or manual trigger requested
    if (!settings.autoSendEligible && !isManualTrigger) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Envio automático pausado nas configurações (autoSendEligible = false). Disparo ignorado.',
      });
    }

    // Enforce safe batch size: 30 emails max per batch (2 batches/day = 60 emails/day)
    // Guarantees execution completes within Vercel's 60s maxDuration and stays well under Hostinger's 100/hr limit
    const batchLimit = Math.min(30, Math.ceil((settings.dailySendLimit || 60) / 2));
    const limitCount = options.limitCount || batchLimit;

    const result = await campaignEngine.executeCampaignDispatch({
      ...options,
      limitCount,
    });

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

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

