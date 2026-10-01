'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  Plus,
  ArrowRight,
  LayoutGrid,
  List,
  Calendar,
  Clock,
  User,
  Languages,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { WorkOrder, WorkOrderStatus, Priority } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const OS_COLUMNS: { status: WorkOrderStatus; label: string }[] = [
  { status: 'documentos_recebidos', label: 'Doc. Recebidos' },
  { status: 'em_traducao', label: 'Em Tradução' },
  { status: 'em_revisao', label: 'Em Revisão' },
  { status: 'correcao', label: 'Correção' },
  { status: 'finalizacao', label: 'Finalização' },
  { status: 'pronto', label: 'Pronto p/ Entrega' },
  { status: 'entregue', label: 'Entregue' },
];

export default function OrdensServicoPage() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  // New OS Form state
  const customers = databaseStore.getCustomers();
  const translators = databaseStore.getTranslators();
  const reviewers = databaseStore.getReviewers();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [serviceName, setServiceName] = useState('Tradução Juramentada');
  const [sourceLang, setSourceLang] = useState('Português');
  const [targetLang, setTargetLang] = useState('Inglês');
  const [priority, setPriority] = useState<Priority>('normal');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [amount, setAmount] = useState('850.00');
  const [translatorId, setTranslatorId] = useState(translators[0]?.id || '');
  const [reviewerId, setReviewerId] = useState(reviewers[0]?.id || '');
  const [notes, setNotes] = useState('');

  const workOrders = databaseStore.getWorkOrders().filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.code.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.serviceName.toLowerCase().includes(term) ||
      (o.translatorName && o.translatorName.toLowerCase().includes(term))
    );
  });

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const trans = translators.find((t) => t.id === translatorId);
    const rev = reviewers.find((r) => r.id === reviewerId);
    const tenant = databaseStore.getTenant();

    databaseStore.createWorkOrder({
      tenantId: tenant.id,
      customerId: cust?.id || 'cli-001',
      customerName: cust?.name || 'Cliente Geral',
      customerEmail: cust?.email || 'cliente@email.com',
      customerPhone: cust?.phone || '11999999999',
      serviceName,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      priority,
      deadline: new Date(deadline).toISOString(),
      assignedUserId: 'user-mariana',
      assignedUserName: 'Mariana Costa',
      translatorId: trans?.id,
      translatorName: trans?.name,
      reviewerId: rev?.id,
      reviewerName: rev?.name,
      amount: parseFloat(amount) || 0,
      notes,
      status: 'documentos_recebidos',
    });

    setIsModalOpen(false);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-purple-600" /> Ordens de Serviço (OS)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe o workflow de tradução, atribuição de linguistas e prazos de entrega.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 shadow-xs bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" /> Nova Ordem de Serviço
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por código (OS-000001), cliente, tradutor, serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-purple-100 text-purple-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas ({databaseStore.getWorkOrders().length})
          </button>
          <button
            onClick={() => setStatusFilter('em_traducao')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              statusFilter === 'em_traducao'
                ? 'bg-purple-100 text-purple-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Em Tradução
          </button>
          <button
            onClick={() => setStatusFilter('em_revisao')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              statusFilter === 'em_revisao'
                ? 'bg-purple-100 text-purple-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Em Revisão
          </button>
          <button
            onClick={() => setStatusFilter('pronto')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              statusFilter === 'pronto'
                ? 'bg-purple-100 text-purple-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Prontas
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Serviço / Idiomas</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Tradutor / Revisor</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Dossiê</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3.5 font-mono font-bold text-purple-700">
                      <Link
                        href={`/operacao/ordens-servico/${order.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">{order.serviceName}</p>
                      <p className="text-slate-500 mt-0.5">
                        {order.sourceLanguage} → {order.targetLanguage}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={order.priority} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 space-y-0.5">
                      <p>Trad: {order.translatorName || 'Não atribuído'}</p>
                      <p className="text-slate-400">Rev: {order.reviewerName || '-'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                      {formatDate(order.deadline)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/operacao/ordens-servico/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Abrir Dossiê <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[550px]">
          {OS_COLUMNS.map((col) => {
            const colOrders = workOrders.filter((o) => o.status === col.status);

            return (
              <div
                key={col.status}
                className="w-72 shrink-0 bg-slate-100/80 rounded-xl border border-slate-200/80 p-3 space-y-3 flex flex-col max-h-[75vh]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {col.label}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs">
                    {colOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Nenhuma ordem
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/operacao/ordens-servico/${order.id}`}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-2.5 block group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-700 font-mono">
                            {order.code}
                          </span>
                          <PriorityBadge priority={order.priority} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                            {order.customerName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{order.serviceName}</p>
                        </div>

                        <div className="text-xs bg-slate-50 p-2 rounded-lg text-slate-600 space-y-0.5">
                          <p>Linguista: {order.translatorName || 'Aguardando'}</p>
                          <p className="text-[11px] text-slate-400">
                            Prazo: {formatDate(order.deadline)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(order.amount)}
                          </span>
                          <span className="text-purple-600 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                            Ver Dossiê →
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova OS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Nova Ordem de Serviço"
        description="Abra uma nova ordem de produção com atribuição de equipe e prazo."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateWorkOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cliente *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Serviço
              </label>
              <select
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Tradução Juramentada">Tradução Juramentada</option>
                <option value="Tradução Certificada">Tradução Certificada</option>
                <option value="Tradução Técnica">Tradução Técnica</option>
                <option value="Apostilamento de Haia">Apostilamento de Haia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Idioma Origem
              </label>
              <input
                type="text"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Idioma Destino
              </label>
              <input
                type="text"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">⚡ Urgente</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Prazo Final de Entrega
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tradutor Designado
              </label>
              <select
                value={translatorId}
                onChange={(e) => setTranslatorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Não atribuído inicialmente --</option>
                {translators.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.languages.join(', ')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Revisor Designado
              </label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Não atribuído inicialmente --</option>
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Observações Operacionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções para o tradutor ou revisor..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-700">
              Criar Ordem de Serviço
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
