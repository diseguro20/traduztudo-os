import { NextRequest, NextResponse } from 'next/server';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const companyId = searchParams.get('companyId') || undefined;

    const messages = await prospectingStorage.listOutboundMessages(companyId, limit);

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/outbound] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar histórico de envios outbound.' },
      { status: 500 }
    );
  }
}
