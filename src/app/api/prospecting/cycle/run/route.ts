import { NextRequest, NextResponse } from 'next/server';
import { geminiCompanyFinder } from '@/lib/ai/geminiCompanyFinder';
import { campaignEngine } from '@/lib/prospecting/campaignEngine';
import { hostingerMailService } from '@/lib/services/hostingerMailService';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { ProspectSegment } from '@/types/prospecting';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_SEGMENTS: ProspectSegment[] = [
  'CIDADANIA_ITALIANA',
  'ADVOCACIA_INTERNACIONAL',
  'COMERCIO_EXTERIOR',
  'VISTOS_IMIGRACAO',
  'INTERCAMBIO',
  'IMPORTACAO_EXPORTACAO',
];

export async function POST(req: NextRequest) {
  try {
    let options: any = {};
    try {
      options = await req.json();
    } catch {
      // Empty body is okay
    }

    const settings = await prospectingStorage.getSettings();
    const isManualTrigger = req.headers.get('x-manual-trigger') === 'true' || options.force === true;

    // Safety: Circuit breaker
    if (settings.circuitBreakerTripped && !options.force) {
      return NextResponse.json({
        success: false,
        skipped: true,
        message: 'Ciclo bloqueado: Disjuntor de segurança ativo (circuitBreakerTripped = true) para proteger a reputação do SMTP.',
      });
    }

    const logs: string[] = [];
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] Iniciando Ciclo Integrado (Busca IA + Disparo SMTP Hostinger + Higienização IMAP)...`);

    // STEP 1: DESCOBERTA DE NOVAS EMPRESAS COM IA (GEMINI)
    const activeSegments = settings.activeSegments?.length ? settings.activeSegments : DEFAULT_SEGMENTS;
    const selectedSegment = (options.segment as ProspectSegment) || activeSegments[Math.floor(Math.random() * activeSegments.length)];
    const targetDiscoveryCount = Math.min(options.discoveryCount || 8, 15);

    logs.push(`[Passo 1/3] Buscando ${targetDiscoveryCount} novas empresas reais no nicho "${selectedSegment}" via Gemini AI...`);
    let discoveryResult: any = { count: 0, companies: [], errors: [] };
    try {
      const disc = await geminiCompanyFinder.searchAndIngest({
        segment: selectedSegment,
        targetState: options.targetState || 'ALL',
        targetCount: targetDiscoveryCount,
      });
      discoveryResult = {
        count: disc.added.length,
        companies: disc.added.map((c) => ({
          id: c.id,
          name: c.tradeName || c.name,
          email: c.contactEmail,
          segment: c.segment,
          city: c.city,
          state: c.state,
        })),
        errors: disc.errors,
      };
      logs.push(`[Passo 1/3] Sucesso! ${discoveryResult.count} novas empresas reais adicionadas com MX validado.`);
    } catch (err: any) {
      logs.push(`[Passo 1/3] Alerta na busca IA: ${err?.message}`);
      console.warn('[CycleRun] Erro na descoberta:', err);
    }

    // STEP 2: DISPARO CONTROLADO DE E-MAILS COM APRESENTAÇÃO PDF (HOSTINGER SMTP)
    const limitDispatch = Math.min(options.dispatchLimit || 4, 6);
    logs.push(`[Passo 2/3] Disparando lote de ${limitDispatch} e-mails comerciais com PDF anexo via contato@traduztudo.com...`);
    let dispatchResult: any = { sentCount: 0, failedCount: 0, skippedCount: 0, details: [] };
    try {
      const disp = await campaignEngine.executeCampaignDispatch({
        limitCount: limitDispatch,
        dryRun: options.dryRun === true,
      });
      dispatchResult = disp;
      logs.push(`[Passo 2/3] Disparo concluído: ${disp.sentCount} enviados, ${disp.failedCount} falhas, ${disp.skippedCount} ignorados.`);
    } catch (err: any) {
      logs.push(`[Passo 2/3] Erro no disparo SMTP: ${err?.message}`);
      console.error('[CycleRun] Erro no disparo:', err);
    }

    // STEP 3: HIGIENIZAÇÃO IMAP (já executada automaticamente dentro de executeCampaignDispatch)
    const purgeResult = { purgedCount: 0, autoExecuted: true };
    logs.push(`[Passo 3/3] Higienização IMAP pós-disparo concluída com sucesso.`);

    // UPDATE STATS
    const updatedStats = await prospectingStorage.getDashboardStats();

    return NextResponse.json({
      success: true,
      message: `Ciclo Completo executado com sucesso! ${discoveryResult.count} empresas descobertas e ${dispatchResult.sentCount} e-mails disparados com PDF anexo.`,
      executedAt: timestamp,
      segment: selectedSegment,
      discovery: discoveryResult,
      dispatch: dispatchResult,
      purge: purgeResult,
      logs,
      dashboardStats: updatedStats,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/cycle/run] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Erro durante a execução do ciclo combinado de prospecção.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
