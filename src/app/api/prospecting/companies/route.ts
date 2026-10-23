import { NextRequest, NextResponse } from 'next/server';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { prospectingAIAgent } from '@/lib/ai/prospectingAIAgent';
import { ProspectCompany, ProspectSegment, ProspectStage } from '@/types/prospecting';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const segment = (searchParams.get('segment') as ProspectSegment | 'ALL') || 'ALL';
    const status = (searchParams.get('status') as ProspectStage | 'ALL') || 'ALL';
    const state = searchParams.get('state') || 'ALL';
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit')) || 500;
    const offset = Number(searchParams.get('offset')) || 0;

    const data = await prospectingStorage.listCompanies({
      segment,
      status,
      state,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      items: data.items,
      total: data.total,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/companies] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao listar empresas.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, tradeName, cnpj, segment, city, state, website, contactEmail, phone, whatsapp } = body;

    if (!name || !segment || !contactEmail) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, segment e contactEmail.' },
        { status: 400 }
      );
    }

    // Deduplication check
    const exists = await prospectingStorage.hasCompany(cnpj, website, contactEmail);
    if (exists) {
      return NextResponse.json(
        { error: 'Empresa já cadastrada no sistema (CNPJ, website ou e-mail já existente).' },
        { status: 409 }
      );
    }

    const qualification = prospectingAIAgent.qualifyCompany({
      name,
      tradeName,
      segment,
      city: city || 'São Paulo',
      state: state || 'SP',
      website,
      hasContactEmail: !!contactEmail,
      hasPhone: !!phone,
    });

    const now = new Date().toISOString();
    const newCompany: ProspectCompany = {
      id: `prospect-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: 'traduztudo-matriz',
      name,
      tradeName,
      cnpj,
      segment,
      city: city || 'São Paulo',
      state: state || 'SP',
      website,
      contactEmail,
      phone,
      whatsapp,
      source: 'MANUAL',
      discoveredAt: now,
      status: 'CONTATO_VERIFICADO',
      fitScore: qualification.fitScore,
      relevantServices: qualification.relevantServices,
      targetLanguages: qualification.targetLanguages,
      aiAnalysis: {
        summary: qualification.summary,
        reasoning: qualification.reasoning,
        suggestedHook: qualification.suggestedHook,
      },
      contactCount: 0,
      optOut: false,
      legalBasis: 'LEGITIMATE_INTEREST',
      activities: [
        {
          id: `act-${Date.now()}`,
          companyId: '',
          type: 'DISCOVERY',
          description: 'Empresa adicionada manualmente pela equipe comercial.',
          timestamp: now,
          actor: 'USER',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    newCompany.activities[0].companyId = newCompany.id;
    await prospectingStorage.saveCompany(newCompany);

    return NextResponse.json({
      success: true,
      company: newCompany,
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/companies POST] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro ao cadastrar empresa.' },
      { status: 500 }
    );
  }
}
