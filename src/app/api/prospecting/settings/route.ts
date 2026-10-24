import { NextRequest, NextResponse } from 'next/server';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const settings = await prospectingStorage.getSettings();
    const suppressionList = await prospectingStorage.listSuppressed();

    return NextResponse.json({
      success: true,
      settings,
      suppressionCount: suppressionList.length,
      suppressionList,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/settings GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao carregar configurações.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dailyDiscoveryTarget,
      dailySendLimit,
      autoSendEligible,
      circuitBreakerTripped,
      activeSegments,
      targetStates,
      allowedSources,
      customSearchKeywords,
      senderName,
      senderEmail,
      replyToEmail,
    } = body;

    const updated = await prospectingStorage.updateSettings({
      dailyDiscoveryTarget,
      dailySendLimit,
      autoSendEligible,
      circuitBreakerTripped,
      activeSegments,
      targetStates,
      allowedSources,
      customSearchKeywords,
      senderName,
      senderEmail,
      replyToEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações do agente de prospecção salvas com sucesso.',
      settings: updated,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/settings POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar configurações.' }, { status: 500 });
  }
}
