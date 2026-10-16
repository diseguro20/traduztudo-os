import { NextRequest, NextResponse } from 'next/server';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const stats = await prospectingStorage.getDashboardStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/dashboard] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar estatísticas do dashboard de prospecção.' },
      { status: 500 }
    );
  }
}
