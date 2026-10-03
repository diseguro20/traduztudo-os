import { NextRequest, NextResponse } from 'next/server';
import { databaseStore } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key');

    // Expected integration key
    const expectedKey = process.env.NEXT_PUBLIC_API_SECRET_KEY || 'traduztudo-saas-api-secret-key-2026';

    const token = authHeader?.replace('Bearer ', '') || apiKey;

    if (!token || token !== expectedKey) {
      return NextResponse.json(
        { error: 'Não autorizado. Chave de integração inválida ou ausente.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      whatsapp,
      service,
      sourceLanguage,
      targetLanguage,
      estimatedVolume,
      notes,
      origin,
      files,
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: nome, e-mail e telefone são requeridos.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const tenant = databaseStore.getTenant();

    const request = await databaseStore.createRequestAsync({
      tenantId: tenant.id,
      customerName: name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      serviceName: service || 'Tradução Juramentada',
      sourceLanguage: sourceLanguage || 'Português',
      targetLanguage: targetLanguage || 'Inglês',
      estimatedVolume: estimatedVolume || '',
      notes: notes || '',
      origin: origin || 'Site TraduzTudo (https://traduztudo.com)',
      status: 'nova',
      files: files || [],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitação de orçamento recebida com sucesso e enfileirada no sistema!',
        requestId: request.id,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Erro na API pública de solicitações:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a solicitação.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      system: 'TraduzTudo OS API',
      version: '1.0.0',
      endpoint: '/api/public/requests',
      documentation: 'Envie um POST com cabeçalho x-api-key para submeter solicitações do site oficial.',
    },
    { headers: corsHeaders }
  );
}
