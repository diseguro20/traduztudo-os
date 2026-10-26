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

    // Strict Safety: If circuit breaker tripped, block all sending to protect SMTP account
    if (settings.circuitBreakerTripped && !options.force) {
      return NextResponse.json({
        success: false,
        skipped: true,
        message: 'Disparo bloqueado: Disjuntor de segurança ativo (circuitBreakerTripped = true) para proteger a conta Hostinger.',
      });
    }

    // Check if auto-send is enabled or manual trigger requested
    if (!settings.autoSendEligible && !isManualTrigger) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Envio automático pausado nas configurações (autoSendEligible = false). Disparo ignorado.',
      });
    }

    // Strict Anti-Suspension: Daily Limit Protection (Apenas para disparos em segundo plano)
    const stats = await prospectingStorage.getDashboardStats();
    const dailyLimit = settings.dailySendLimit || 70;
    if (stats.emailsSentToday >= dailyLimit && !isManualTrigger) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: `Limite diário de envios atingido (${stats.emailsSentToday}/${dailyLimit} enviados hoje). Envio automático pausado até amanhã para garantir segurança total da conta Hostinger contra bloqueios.`,
        stats: {
          emailsSentToday: stats.emailsSentToday,
          dailySendLimit: dailyLimit,
        },
      });
    }

    // Enforce safe serverless batch size: 3 to 4 emails per invocation
    // Guarantees execution stays well below Vercel's timeout and protects Hostinger SMTP reputation
    const remainingToday = Math.max(1, dailyLimit - (stats.emailsSentToday || 0));
    const batchLimit = Math.min(4, Math.max(2, Math.ceil(dailyLimit / 25)));
    const limitCount = isManualTrigger
      ? Math.min(4, options.limitCount || batchLimit)
      : Math.min(remainingToday, options.limitCount || batchLimit);

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

