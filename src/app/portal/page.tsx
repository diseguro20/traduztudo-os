'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  FileSpreadsheet,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building,
  User,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PortalDoClientePage() {
  // Demo client session: Dr. Roberto Alencar (cli-001)
  const customers = databaseStore.getCustomers();
  const [activeCustomerId, setActiveCustomerId] = useState(customers[0]?.id || 'cli-001');

  const customer = customers.find((c) => c.id === activeCustomerId) || customers[0];

  const clientOrders = databaseStore
    .getWorkOrders()
    .filter((o) => o.customerId === customer?.id);

  const clientQuotes = databaseStore
    .getQuotes()
    .filter((q) => q.customerId === customer?.id);

  const clientDocuments = databaseStore
    .getDocuments()
    .filter((d) => d.customerId === customer?.id);

  const clientReceivables = databaseStore
    .getReceivables()
    .filter((r) => r.customerId === customer?.id);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Client Portal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              TT
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">TraduzTudo Portal</p>
              <p className="text-[11px] text-slate-500">Área Exclusiva do Cliente</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-3 text-xs">
            {/* Demo client switcher for testability */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 hidden sm:inline">Visualizando como:</span>
              <select
                value={activeCustomerId}
                onChange={(e) => setActiveCustomerId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              Voltar ao ERP OS →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Portal Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Olá, {customer?.name} 👋
            </h1>
            <p className="text-xs text-slate-500">
              Acompanhe suas traduções juramentadas, aprove propostas e baixe suas certidões certificadas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Documentos com validade jurídica e assinatura digital ICP-Brasil.</span>
          </div>
        </div>

        {/* 4 Client KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Pedidos Ativos</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {clientOrders.filter((o) => o.status !== 'entregue').length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Orçamentos Pendentes</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {clientQuotes.filter((q) => q.status === 'enviado' || q.status === 'rascunho').length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Arquivos Disponíveis</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{clientDocuments.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Pagamentos Pendentes</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {clientReceivables.filter((r) => r.status === 'pendente').length}
            </p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600" /> Suas Ordens de Serviço
            </h2>
            <span className="text-xs text-slate-500">{clientOrders.length} ordens registradas</span>
          </div>

          <div className="divide-y divide-slate-100">
            {clientOrders.length === 0 ? (
              <p className="text-xs text-slate-400 p-8 text-center">
                Você não possui ordens de serviço ativas no momento.
              </p>
            ) : (
              clientOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {order.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{order.serviceName}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Par de Idiomas: {order.sourceLanguage} → {order.targetLanguage} • Prazo de Entrega:{' '}
                      <strong className="text-slate-800">{formatDate(order.deadline)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(order.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quotes to Approve */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" /> Propostas e Orçamentos
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {clientQuotes.map((q) => (
              <div
                key={q.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {q.code}
                    </span>
                    <span className="text-xs text-slate-500">
                      Validade: {formatDate(q.expirationDate)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1">
                    {q.items[0]?.serviceName} ({q.items.length} itens inclusos)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(q.total)}
                  </span>
                  {q.status !== 'aprovado' ? (
                    <Link href={`/orcamento/${q.approvalToken}`}>
                      <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700">
                        Analisar & Aprovar Proposta →
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Aprovado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Downloadable Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-600" /> Documentos e Arquivos Disponíveis
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {clientDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Categoria: {doc.category} • Enviado em {formatDate(doc.createdAt)}
                  </p>
                </div>
                <a
                  href={doc.fileUrl}
                  download
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Arquivo
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
