import { NextRequest, NextResponse } from 'next/server';
import { geminiCompanyFinder } from '@/lib/ai/geminiCompanyFinder';
import { ProspectSegment } from '@/types/prospecting';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, segment, targetState, targetCount, apiKey } = body;

    console.log(`[API /api/prospecting/search/ai] Iniciando busca com Agente IA. Query: "${query}", Segmento: ${segment}, UF: ${targetState}, Alvo: ${targetCount}`);

    const result = await geminiCompanyFinder.searchAndIngest({
      query: typeof query === 'string' ? query.trim() : '',
      segment: segment as ProspectSegment,
      targetState: targetState || 'ALL',
      targetCount: Math.min(Math.max(Number(targetCount) || 10, 1), 50),
      apiKey: typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      count: result.added.length,
      companies: result.added,
      errors: result.errors,
      message: `${result.added.length} novas empresas reais foram descobertas, validadas via DNS MX e adicionadas ao CRM!`,
    });
  } catch (error: any) {
    console.error('[API /api/prospecting/search/ai] Erro fatal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Falha ao executar busca de empresas com Agente IA.',
      },
      { status: 500 }
    );
  }
}
