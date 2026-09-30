'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  FileCheck2,
  FileSpreadsheet,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Calendar,
  CheckCircle2,
  Layers,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { databaseStore } from '@/lib/db';
import { QuickActionModal } from '@/components/layout/QuickActionModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'mes' | 'semana' | 'ano'>('mes');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [, setRefresh] = useState(0);

  const workOrders = databaseStore.getWorkOrders();
  const quotes = databaseStore.getQuotes();
  const customers = databaseStore.getCustomers();
  const receivables = databaseStore.getReceivables();
  const tasks = databaseStore.getTasks();

  // Metrics
  const totalBilled = receivables
    .filter((r) => r.status === 'pago')
    .reduce((acc, curr) => acc + curr.paidAmount, 0);

  const pendingReceivables = receivables
    .filter((r) => r.status === 'pendente')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const overdueReceivables = receivables
    .filter((r) => r.status === 'vencido')
    .reduce((acc, curr) => acc + (curr.amount - curr.paidAmount), 0);

  const activeWorkOrders = workOrders.filter(
    (o) => o.status !== 'entregue' && o.status !== 'cancelado'
  );

  const pendingQuotes = quotes.filter(
    (q) => q.status === 'enviado' || q.status === 'visualizado' || q.status === 'rascunho'
  );

  // Chart data: Monthly billing
  const monthlyRevenueData = [
    { month: 'Mai', faturamento: 14200, recebido: 13500 },
    { month: 'Jun', faturamento: 18500, recebido: 17800 },
    { month: 'Jul', faturamento: 21900, recebido: 20400 },
    { month: 'Ago', faturamento: 26400, recebido: 24900 },
    { month: 'Set', faturamento: 31200, recebido: 28800 },
  ];

  // Chart data: Orders by status
  const ordersStatusData = [
    { name: 'Em Tradução', value: workOrders.filter((o) => o.status === 'em_traducao').length || 1, color: '#8b5cf6' },
    { name: 'Em Revisão', value: workOrders.filter((o) => o.status === 'em_revisao').length || 1, color: '#f59e0b' },
    { name: 'Doc. Recebidos', value: workOrders.filter((o) => o.status === 'documentos_recebidos').length || 1, color: '#3b82f6' },
    { name: 'Pronto / Entregue', value: 2, color: '#10b981' },
  ];

  // Chart data: Revenue by service type
  const serviceTypeData = [
    { name: 'Juramentada', valor: 18900 },
    { name: 'Técnica', valor: 12400 },
    { name: 'Certificada', valor: 7600 },
    { name: 'Apostilamento', valor: 4500 },
  ];

  // Attention Section items:
  const urgentOrders = workOrders.filter((o) => o.priority === 'urgente' || o.priority === 'alta');
  const pendingTasks = tasks.filter((t) => t.status !== 'concluida');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Greeting, Period Filter, Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Olá, Carlos Silva 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe o desempenho operacional e financeiro da TraduzTudo Matriz em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center text-xs shadow-2xs">
            <button
              onClick={() => setPeriod('semana')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                period === 'semana' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                period === 'mes' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setPeriod('ano')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                period === 'ano' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ano
            </button>
          </div>

          <Button onClick={() => setIsQuickActionOpen(true)} className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            Nova Ação
          </Button>
        </div>
      </div>

      {/* KPI Cards (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Faturamento */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBilled)}</p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs mês anterior</span>
          </div>
        </div>

        {/* A Receber */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">A Receber</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(pendingReceivables)}</p>
          <p className="mt-2 text-[11px] text-slate-500">Saldo em aberto a faturar</p>
        </div>

        {/* Em Atraso */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Atraso</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(overdueReceivables)}</p>
          <p className="mt-2 text-[11px] text-emerald-600 font-medium">Inadimplência sob controle (0%)</p>
        </div>

        {/* Serviços em Andamento */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Andamento</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">{activeWorkOrders.length} OS</p>
          <p className="mt-2 text-[11px] text-slate-500">Ordens de serviço ativas</p>
        </div>

        {/* Orçamentos Pendentes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Orçamentos</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">{pendingQuotes.length} pendentes</p>
          <p className="mt-2 text-[11px] text-slate-500">Aguardando decisão do cliente</p>
        </div>

        {/* Novos Clientes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">{customers.length} ativos</p>
          <p className="mt-2 text-[11px] text-slate-500">Pessoas Físicas e Jurídicas</p>
        </div>
      </div>

      {/* SEÇÃO ATENÇÃO CRÍTICA */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/5 rounded-2xl border border-amber-200/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Seção Atenção Operacional
            </h2>
          </div>
          <span className="text-xs text-amber-800 font-medium">
            {urgentOrders.length + pendingTasks.length} alertas prioritários
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {urgentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/operacao/ordens-servico/${order.id}`}
              className="bg-white p-3.5 rounded-xl border border-amber-200/80 hover:border-amber-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {order.code}
                </span>
                <PriorityBadge priority={order.priority} />
              </div>
              <p className="text-sm font-medium text-slate-900 mt-2 group-hover:text-blue-600 truncate">
                {order.customerName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{order.serviceName}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Prazo: {formatDate(order.deadline)}</span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}

          {pendingTasks.slice(0, 2).map((task) => (
            <div
              key={task.id}
              className="bg-white p-3.5 rounded-xl border border-amber-200/80 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Tarefa Pendente
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <p className="text-sm font-medium text-slate-900 mt-2">{task.title}</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Resp: {task.assignedToName}</span>
                <span className="text-amber-700 font-medium">Vence: {formatDate(task.dueDate)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos Operacionais e Financeiros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faturamento Mensal (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Faturamento e Recebimentos (R$)
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo de serviços faturados versus liquidados
              </p>
            </div>
            <Link
              href="/financeiro/fluxo-caixa"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver Fluxo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRecebido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="faturamento" name="Faturado" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorFaturamento)" />
                <Area type="monotone" dataKey="recebido" name="Recebido" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRecebido)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Serviços por Status (Donut) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Serviços por Status
              </h3>
              <p className="text-xs text-slate-500">Distribuição do fluxo de trabalho</p>
            </div>
            <Link
              href="/operacao/ordens-servico"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver OS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ordersStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1.5">
            {ordersStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Ordens Recentes & Orçamentos em Aberto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ordens de Serviço Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Ordens de Serviço em Operação
              </h3>
              <p className="text-xs text-slate-500">Últimas ordens em fluxo com linguistas</p>
            </div>
            <Link
              href="/operacao/ordens-servico"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ver todas ({workOrders.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {workOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {order.code}
                    </span>
                    <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.serviceName} • {order.sourceLanguage} → {order.targetLanguage}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={order.status} />
                  <p className="text-xs font-bold text-slate-900 mt-1.5">
                    {formatCurrency(order.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orçamentos Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Orçamentos Recentes
              </h3>
              <p className="text-xs text-slate-500">Propostas emitidas e status de aprovação</p>
            </div>
            <Link
              href="/operacao/orcamentos"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ver todos ({quotes.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {quotes.slice(0, 4).map((quote) => (
              <div
                key={quote.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {quote.code}
                    </span>
                    <p className="text-sm font-medium text-slate-900">{quote.customerName}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Emitido: {formatDate(quote.issueDate)} • Validade: {formatDate(quote.expirationDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={quote.status} />
                  <p className="text-xs font-bold text-slate-900 mt-1.5">
                    {formatCurrency(quote.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSuccess={() => setRefresh((r) => r + 1)}
      />
    </div>
  );
}
