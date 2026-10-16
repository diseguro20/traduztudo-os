import { NextRequest, NextResponse } from 'next/server';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { OutreachCampaign } from '@/types/prospecting';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const campaigns = await prospectingStorage.listCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    console.error('[API /api/prospecting/campaigns GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao listar campanhas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, segment, targetStates, status, subjectTemplate, bodyTemplate, dailyLimit } = body;

    if (id) {
      // Update
      const updated = await prospectingStorage.updateCampaign(id, {
        name,
        segment,
        targetStates,
        status,
        subjectTemplate,
        bodyTemplate,
        dailyLimit,
      });
      return NextResponse.json({ success: true, campaign: updated });
    }

    if (!name || !subjectTemplate || !bodyTemplate) {
      return NextResponse.json({ error: 'Campos obrigatórios: name, subjectTemplate e bodyTemplate.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newCamp: OutreachCampaign = {
      id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: 'traduztudo-matriz',
      name,
      segment: segment || 'ALL',
      targetStates: targetStates || ['ALL'],
      status: status || 'ACTIVE',
      subjectTemplate,
      bodyTemplate,
      dailyLimit: dailyLimit || 25,
      sentCount: 0,
      deliveredCount: 0,
      replyCount: 0,
      interestedCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await prospectingStorage.saveCampaign(newCamp);

    return NextResponse.json({ success: true, campaign: newCamp });
  } catch (err: any) {
    console.error('[API /api/prospecting/campaigns POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao salvar campanha.' }, { status: 500 });
  }
}
