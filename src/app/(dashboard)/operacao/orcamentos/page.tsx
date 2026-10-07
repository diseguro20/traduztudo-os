'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Search,
  Plus,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  FileCheck2,
  Printer,
  Share2,
  Clock,
  Send,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { Quote, QuoteStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrcamentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QuoteStatus>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const quotes = databaseStore.getQuotes().filter((q) => {
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.code.toLowerCase().includes(term) ||
      q.customerName.toLowerCase().includes(term) ||
      q.customerEmail.toLowerCase().includes(term)
    );
  });

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/orcamento/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleConvertToOrder = (quoteId: string) => {
    if (confirm('Deseja aprovar este orçamento e gerar a Ordem de Serviço agora?')) {
      const res = databaseStore.approveQuote(quoteId, '127.0.0.1');
      if (res) {
        alert(`Orçamento aprovado! Ordem de Serviço ${res.workOrder.code} gerada com sucesso!`);
        setRefresh((r) => r + 1);
      }
    }
  };

  const handleSendQuote = (quote: Quote) => {
    databaseStore.updateQuote(quote.id, { status: 'enviado' });
    alert(`Orçamento ${quote.code} enviado para o e-mail ${quote.customerEmail} com link de aprovação!`);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" /> Orçamentos Comerciais
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Elabore propostas, envie links digitais de aprovação e converta em ordens de serviço.
          </p>
        </div>

        <Link href="/operacao/orcamentos/novo" className="w-full sm:w-auto">
          <Button className="gap-2 shadow-xs bg-amber-600 hover:bg-amber-700 w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por código (ORC-000001), cliente, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'ALL' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({databaseStore.getQuotes().length})
          </button>
          <button
            onClick={() => setStatusFilter('rascunho')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'rascunho' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rascunho
          </button>
          <button
            onClick={() => setStatusFilter('enviado')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'enviado' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Enviados
          </button>
          <button
            onClick={() => setStatusFilter('aprovado')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'aprovado' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Aprovados
          </button>
        </div>
      </div>

      {/* Table of Quotes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-sm text-slate-600 min-w-[850px]">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Itens / Serviços</th>
                <th className="px-4 py-3">Emissão / Validade</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    Nenhum orçamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-700">
                      {q.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900 leading-tight">
                        {q.customerName}
                      </p>
                      <p className="text-xs text-slate-500">{q.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <p className="font-medium">
                        {q.items[0]?.serviceName || 'Serviço'}
                      </p>
                      {q.items.length > 1 && (
                        <p className="text-slate-400">+{q.items.length - 1} outro(s) item(ns)</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 space-y-0.5">
                      <p>Emitido: {formatDate(q.issueDate)}</p>
                      <p className="text-amber-700 font-medium">
                        Até: {formatDate(q.expirationDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                      {q.estimatedDeliveryDays} dias úteis
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy approval link */}
                        <button
                          onClick={() => handleCopyLink(q.approvalToken)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Copiar Link de Aprovação do Cliente"
                        >
                          {copiedToken === q.approvalToken ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Open public approval page */}
                        <Link
                          href={`/orcamento/${q.approvalToken}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Abrir Tela de Aprovação do Cliente"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Send Quote */}
                        {q.status === 'rascunho' && (
                          <button
                            onClick={() => handleSendQuote(q)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Enviar para o Cliente"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* 1-Click Convert to Work Order */}
                        {q.status !== 'aprovado' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvertToOrder(q.id)}
                            className="text-xs gap-1 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" /> Gerar OS
                          </Button>
                        ) : (
                          <Link
                            href={`/operacao/ordens-servico/${q.workOrderId || ''}`}
                            className="text-xs text-purple-700 font-semibold hover:underline flex items-center gap-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" /> Ver OS
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o orçamento "${q.code}" de "${q.customerName}"?`)) {
                              databaseStore.deleteQuote(q.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir Orçamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
