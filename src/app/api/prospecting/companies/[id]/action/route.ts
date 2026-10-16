import { NextRequest, NextResponse } from 'next/server';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { ProspectStage } from '@/types/prospecting';
import { databaseStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = params.id;
    const body = await req.json();
    const { action, status, note, userId, userName } = body;

    const company = await prospectingStorage.getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
    }

    const operatorName = userName || 'Equipe Comercial';

    if (action === 'update_status') {
      if (!status) {
        return NextResponse.json({ error: 'Status obrigatório.' }, { status: 400 });
      }

      await prospectingStorage.updateCompany(companyId, { status: status as ProspectStage });
      await prospectingStorage.addActivity(companyId, {
        type: 'STATUS_CHANGE',
        description: `Status alterado para "${status}" por ${operatorName}.`,
        actor: operatorName,
      });

      return NextResponse.json({ success: true, message: 'Status atualizado com sucesso.' });
    }

    if (action === 'add_note') {
      if (!note) {
        return NextResponse.json({ error: 'Nota/observação obrigatória.' }, { status: 400 });
      }

      const existingNotes = company.notes ? `${company.notes}\n---\n` : '';
      const updatedNotes = `${existingNotes}[${new Date().toLocaleDateString('pt-BR')} por ${operatorName}]: ${note}`;

      await prospectingStorage.updateCompany(companyId, { notes: updatedNotes });
      await prospectingStorage.addActivity(companyId, {
        type: 'NOTE_ADDED',
        description: `Observação adicionada: "${note.substring(0, 80)}..."`,
        actor: operatorName,
      });

      return NextResponse.json({ success: true, message: 'Observação registrada.' });
    }

    if (action === 'convert_to_lead') {
      const newLead = databaseStore.createLead({
        tenantId: 'tenant-default',
        name: company.contactPerson?.name || company.tradeName || company.name,
        type: 'PJ',
        email: company.contactEmail,
        phone: company.phone || company.whatsapp || '(11) 94748-5091',
        origin: 'Prospecção Inteligente B2B',
        interestedServiceName: company.relevantServices[0] || 'Tradução Juramentada',
        sourceLanguage: company.targetLanguages[1] || 'Português',
        targetLanguage: company.targetLanguages[0] || 'Italiano',
        status: 'contato_realizado',
        notes: `Importado da Prospecção Inteligente Traduz Tudo.\nEmpresa: ${company.name}\nSegmento: ${company.segment}\nCidade/UF: ${company.city}/${company.state}\nFit Score: ${company.fitScore}%\nResumo IA: ${company.aiAnalysis.summary}`,
      });

      await prospectingStorage.updateCompany(companyId, {
        status: 'LEAD_QUALIFICADO',
        convertedLeadId: newLead.id,
      });

      await prospectingStorage.addActivity(companyId, {
        type: 'LEAD_CONVERTED',
        description: `Convertido em Lead Oficial no CRM sob o código "${newLead.name}".`,
        actor: operatorName,
        metadata: { leadId: newLead.id },
      });

      return NextResponse.json({
        success: true,
        message: `Lead criado no CRM com sucesso! ID: ${newLead.id}`,
        lead: newLead,
      });
    }

    if (action === 'toggle_opt_out') {
      const newOptOut = !company.optOut;
      if (newOptOut) {
        await prospectingStorage.addToSuppression(company.contactEmail, company.website, 'MANUAL', 'Descadastrado pelo operador no painel.');
      } else {
        await prospectingStorage.updateCompany(companyId, { optOut: false, status: 'CONTATO_VERIFICADO' });
      }

      return NextResponse.json({
        success: true,
        message: newOptOut ? 'Empresa adicionada à lista de supressão (LGPD).' : 'Opt-out removido.',
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/prospecting/companies/[id]/action] Error:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao executar ação.' }, { status: 500 });
  }
}
