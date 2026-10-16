import { NextRequest, NextResponse } from 'next/server';
import { discoveryEngine } from '@/lib/prospecting/discoveryEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let options = {};
    try {
      options = await req.json();
    } catch {
      // Empty body is fine for cron
    }

    const result = await discoveryEngine.executeDiscovery(options);

    return NextResponse.json({
      success: true,
      message: `Busca executada com sucesso! ${result.newCompaniesAdded} novas empresas qualificadas e adicionadas ao CRM.`,
      result,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/cron/discover] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro durante a rotina de descoberta de empresas.' },
      { status: 500 }
    );
  }
}
