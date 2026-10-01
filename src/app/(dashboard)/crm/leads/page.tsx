'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  LayoutGrid,
  List,
  Search,
  Plus,
  ArrowRight,
  UserCheck,
  Building,
  User,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { Lead, LeadStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const PIPELINE_COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'novo', label: 'Novo Lead', color: 'border-blue-500 bg-blue-50/40 text-blue-800' },
  { status: 'contato_realizado', label: 'Contato Realizado', color: 'border-purple-500 bg-purple-50/40 text-purple-800' },
  { status: 'orcamento_solicitado', label: 'Orçamento Solicitado', color: 'border-amber-500 bg-amber-50/40 text-amber-800' },
  { status: 'orcamento_enviado', label: 'Orçamento Enviado', color: 'border-indigo-500 bg-indigo-50/40 text-indigo-800' },
  { status: 'negociacao', label: 'Negociação', color: 'border-cyan-500 bg-cyan-50/40 text-cyan-800' },
  { status: 'convertido', label: 'Convertido', color: 'border-emerald-500 bg-emerald-50/40 text-emerald-800' },
  { status: 'perdido', label: 'Perdido', color: 'border-rose-500 bg-rose-50/40 text-rose-800' },
];

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefreshKey] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefreshKey((r) => r + 1));
  }, []);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'PF' | 'PJ'>('PF');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [origin, setOrigin] = useState('Site TraduzTudo');
  const [service, setService] = useState('Tradução Juramentada');
  const [sourceLang, setSourceLang] = useState('Português');
  const [targetLang, setTargetLang] = useState('Inglês');
  const [notes, setNotes] = useState('');

  const leads = databaseStore.getLeads().filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.name.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      l.phone.includes(term) ||
      (l.interestedServiceName && l.interestedServiceName.toLowerCase().includes(term))
    );
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = databaseStore.getTenant();

    databaseStore.createLead({
      tenantId: tenant.id,
      name,
      type,
      email,
      phone,
      whatsapp: whatsapp || phone,
      origin,
      interestedServiceName: service,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      notes,
      assignedUserName: 'Juliana Mendes',
      status: 'novo',
    });

    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
  };

  const handleConvertLead = (leadId: string) => {
    const res = databaseStore.convertLeadToCustomer(leadId);
    if (res) {
      alert(`Lead ${res.name} convertido com sucesso em cliente cadastrado!`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus) => {
    databaseStore.updateLead(leadId, { status: newStatus });
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" /> Pipeline de Leads
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie novos contatos comerciais desde a entrada até a conversão em cliente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar leads por nome, e-mail, telefone, serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          Total: <strong className="text-slate-900">{leads.length}</strong> leads
        </span>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[550px]">
          {PIPELINE_COLUMNS.map((col) => {
            const columnLeads = leads.filter((l) => l.status === col.status);

            return (
              <div
                key={col.status}
                className="w-72 shrink-0 bg-slate-100/80 rounded-xl border border-slate-200/80 p-3 space-y-3 flex flex-col max-h-[75vh]"
              >
                {/* Column header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column cards */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnLeads.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Nenhum lead nesta etapa.
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                              {lead.origin}
                            </span>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {lead.name}
                            </p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {lead.type}
                          </span>
                        </div>

                        {lead.interestedServiceName && (
                          <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-700 space-y-0.5">
                            <p className="font-medium text-slate-900 truncate">
                              {lead.interestedServiceName}
                            </p>
                            {lead.sourceLanguage && (
                              <p className="text-[11px] text-slate-500">
                                {lead.sourceLanguage} → {lead.targetLanguage}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-1 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            {lead.email}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {lead.phone}
                          </p>
                        </div>

                        {/* Card actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          {lead.status !== 'convertido' ? (
                            <button
                              onClick={() => handleConvertLead(lead.id)}
                              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Converter em Cliente
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cliente Criado
                            </span>
                          )}

                          {/* Quick stage selector */}
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-600 cursor-pointer"
                          >
                            {PIPELINE_COLUMNS.map((p) => (
                              <option key={p.status} value={p.status}>
                                → {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Serviço de Interesse</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {lead.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 space-y-0.5">
                      <p>{lead.email}</p>
                      <p>{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <p className="font-medium">{lead.interestedServiceName || '-'}</p>
                      {lead.sourceLanguage && (
                        <p className="text-slate-400">
                          {lead.sourceLanguage} → {lead.targetLanguage}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{lead.origin}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {lead.status !== 'convertido' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertLead(lead.id)}
                          className="text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Converter
                        </Button>
                      ) : (
                        <Link
                          href={`/crm/clientes/${lead.customerId || ''}`}
                          className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          Ver Cliente <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Novo Lead */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Lead Comercial"
        description="Insira as informações do lead para inclusão no funil de vendas."
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={type === 'PF'}
                onChange={() => setType('PF')}
                className="text-blue-600"
              />
              Pessoa Física
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={type === 'PJ'}
                onChange={() => setType('PJ')}
                className="text-blue-600"
              />
              Pessoa Jurídica
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome Completo / Empresa *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mariana Vasconcelos"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Serviço
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Tradução Juramentada">Tradução Juramentada</option>
                <option value="Tradução Certificada">Tradução Certificada</option>
                <option value="Tradução Técnica">Tradução Técnica</option>
                <option value="Apostilamento de Haia">Apostilamento de Haia</option>
                <option value="Revisão">Revisão</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Origem
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Português">Português</option>
                <option value="Inglês">Inglês</option>
                <option value="Espanhol">Espanhol</option>
                <option value="Italiano">Italiano</option>
                <option value="Alemão">Alemão</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Destino
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Inglês">Inglês</option>
                <option value="Português">Português</option>
                <option value="Espanhol">Espanhol</option>
                <option value="Italiano">Italiano</option>
                <option value="Alemão">Alemão</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Origem do Lead
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ex: Site TraduzTudo, Google Ads, Indicação..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações & Detalhes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes sobre os documentos, prazo ou exigências especiais..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Lead no Pipeline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
