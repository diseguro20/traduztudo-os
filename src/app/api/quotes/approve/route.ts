import { NextRequest, NextResponse } from 'next/server';
import { databaseStore } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, id, reason, action } = body;

    const identifier = token || id;
    if (!identifier) {
      return NextResponse.json({ error: 'Identificador do orçamento obrigatório.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '189.40.72.115';

    if (action === 'reject') {
      const rejected = await databaseStore.rejectQuoteAsync(identifier, reason);
      if (!rejected) {
        return NextResponse.json({ error: 'Orçamento não encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Orçamento recusado com sucesso.', quote: rejected });
    }

    const result = await databaseStore.approveQuoteAsync(identifier, ip);
    if (!result) {
      return NextResponse.json({ error: 'Orçamento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Orçamento aprovado com sucesso! Ordem de Serviço criada.',
      quote: result.quote,
      workOrder: result.workOrder,
    });
  } catch (error: any) {
    console.error('Erro na rota de aprovação:', error);
    return NextResponse.json({ error: 'Erro ao processar aprovação.' }, { status: 500 });
  }
}
