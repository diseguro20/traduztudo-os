'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileCheck2,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { formatCurrency, formatDate, formatDateTime, formatDocument, formatPhone } from '@/lib/utils';

export default function ClienteDossiePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<'resumo' | 'historico' | 'timeline'>('resumo');
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const customer = databaseStore.getCustomerById(id);

  if (!customer) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Cliente não encontrado</h2>
        <p className="text-sm text-slate-500">
          O cliente solicitado não existe ou foi arquivado.
        </p>
        <Link href="/crm/clientes">
          <Button variant="outline">Voltar para Clientes</Button>
        </Link>
      </div>
    );
  }

  // Linked entities
  const customerQuotes = databaseStore.getQuotes().filter((q) => q.customerId === customer.id);
  const customerOrders = databaseStore.getWorkOrders().filter((o) => o.customerId === customer.id);
  const customerReceivables = databaseStore.getReceivables().filter((r) => r.customerId === customer.id);
  const customerDocuments = databaseStore.getDocuments().filter((d) => d.customerId === customer.id);

  return (
    <div className="space-y-6">
      {/* Top back button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/crm/clientes"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Clientes
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/operacao/orcamentos/novo?clienteId=${customer.id}`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Novo Orçamento
            </Button>
          </Link>
          <Link href={`/operacao/ordens-servico?clienteId=${customer.id}`}>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Nova Ordem de Serviço
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Header Dossier Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20 shrink-0">
              {customer.type === 'PF' ? <User className="w-7 h-7" /> : <Building className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    customer.type === 'PJ'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {customer.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </span>
              </div>
              {customer.tradeName && (
                <p className="text-sm font-medium text-slate-600">
                  Nome Fantasia: {customer.tradeName}
                </p>
              )}
              <p className="text-xs font-mono text-slate-500">
                Doc: {formatDocument(customer.cpf || customer.cnpj)}
              </p>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Gasto</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {formatCurrency(customer.totalSpent)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Ordens</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {customer.ordersCount} ({customer.activeOrdersCount} ativas)
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">A Pagar</p>
              <p className="text-sm font-bold text-amber-600 mt-0.5">
                {formatCurrency(customer.pendingBalance)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Desde</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">
                {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
              {customer.email}
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatPhone(customer.phone)}</span>
          </div>
          {customer.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {customer.street ? `${customer.street}, ${customer.number || 'S/N'} - ` : ''}
                {customer.city}/{customer.state || 'BR'}
              </span>
            </div>
          )}
          {customer.lastContactAt && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Último contato: {formatDate(customer.lastContactAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dossier Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('resumo')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'resumo'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Resumo & Dados Gerais
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'historico'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Histórico Operacional
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {customerOrders.length + customerQuotes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Linha do Tempo
        </button>
      </div>

      {/* Tab 1: Resumo */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Observações e Diretrizes Especiais
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {customer.notes || 'Nenhuma observação registrada para este cliente.'}
              </p>
            </div>

            {/* Active Work Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Ordens de Serviço em Andamento ({customerOrders.length})
                </h3>
              </div>
              {customerOrders.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Nenhuma ordem de serviço ativa no momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/operacao/ordens-servico/${order.id}`}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-xs flex items-center justify-between gap-4 transition-all block group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {order.code}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                            {order.serviceName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {order.sourceLanguage} → {order.targetLanguage} • Prazo: {formatDate(order.deadline)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge status={order.status} />
                        <p className="text-xs font-bold text-slate-900 mt-1">
                          {formatCurrency(order.amount)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: Endereço & Finanças */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Endereço Registrado
              </h3>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-medium text-slate-800">
                  {customer.street || 'Rua não cadastrada'}, {customer.number || ''}
                </p>
                {customer.complement && <p>{customer.complement}</p>}
                <p>{customer.neighborhood || ''}</p>
                <p>
                  {customer.city}/{customer.state} — CEP: {customer.zipCode || '-'}
                </p>
                <p>{customer.country || 'Brasil'}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Resumo Financeiro
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Faturado</span>
                  <span className="font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Saldo Pendente</span>
                  <span className="font-bold text-amber-600">{formatCurrency(customer.pendingBalance)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status Financeiro</span>
                  <span className="font-bold text-emerald-600">Cliente Adimplente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Histórico */}
      {activeTab === 'historico' && (
        <div className="space-y-6">
          {/* Quotes history */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Orçamentos Emitidos ({customerQuotes.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {customerQuotes.map((q) => (
                <div key={q.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {q.code}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {q.items[0]?.serviceName || 'Tradução'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Data: {formatDate(q.issueDate)} • Validade: {formatDate(q.expirationDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={q.status} />
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {formatCurrency(q.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Lançamentos Financeiros & Pagamentos ({customerReceivables.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {customerReceivables.map((rec) => (
                <div key={rec.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{rec.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vencimento: {formatDate(rec.dueDate)} • Método: {rec.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={rec.status} />
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {formatCurrency(rec.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">
            Atividades em Ordem Cronológica
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
              <div>
                <p className="text-xs text-slate-400">28/09/2026 14:30</p>
                <p className="text-sm font-semibold text-slate-900">
                  Contato de acompanhamento operacional via WhatsApp
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atendente Mariana Costa confirmou recebimento das certidões adicionais.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
              <div>
                <p className="text-xs text-slate-400">21/09/2026 15:10</p>
                <p className="text-sm font-semibold text-slate-900">
                  Pagamento de entrada de 50% confirmado (PIX R$ 925,00)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Financeiro confirmou compensação imediata.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-purple-100" />
              <div>
                <p className="text-xs text-slate-400">21/09/2026 14:20</p>
                <p className="text-sm font-semibold text-slate-900">
                  Orçamento ORC-000001 aprovado pelo cliente
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aprovação digital registrada com sucesso. OS-000001 criada automaticamente.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-slate-100" />
              <div>
                <p className="text-xs text-slate-400">{formatDateTime(customer.createdAt)}</p>
                <p className="text-sm font-semibold text-slate-900">
                  Cadastro do cliente criado no sistema
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
