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
  Eye,
  Paperclip,
  FileText,
  Download,
  MessageSquare,
  File,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { Quote, QuoteStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DocumentProcessingSection } from '@/components/documents/DocumentProcessingSection';
import { downloadDocumentFile } from '@/lib/storage/documentStorage';

export default function OrcamentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QuoteStatus>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedQuoteForDocs, setSelectedQuoteForDocs] = useState<Quote | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url?: string;
    dataUrl?: string;
    size?: number;
    type?: string;
  } | null>(null);
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

  const getQuoteDocuments = (q: Quote) => {
    const docs: Array<{
      id?: string;
      name: string;
      url?: string;
      fileUrl?: string;
      dataUrl?: string;
      size?: number;
      type?: string;
    }> = [];

    // 1. Directly from q.files
    if (Array.isArray(q.files)) {
      q.files.forEach((f: any, idx) => {
        if (typeof f === 'string') {
          docs.push({ id: `${q.id}-file-${idx}`, name: f });
        } else if (f && f.name) {
          docs.push({
            id: f.id || `${q.id}-file-${idx}`,
            name: f.name,
            url: f.url,
            fileUrl: f.fileUrl,
            dataUrl: f.dataUrl,
            size: f.size,
            type: f.type,
          });
        }
      });
    }

    // 2. From DocumentItem collection in databaseStore
    const linkedDocs = databaseStore.getDocuments().filter(
      (d) =>
        d.quoteId === q.id ||
        (d.quoteId && d.quoteId.toLowerCase() === q.code.toLowerCase()) ||
        (q.customerId && d.customerId === q.customerId)
    );
    linkedDocs.forEach((d) => {
      const existing = docs.find((x) => x.name.toLowerCase() === d.name.toLowerCase());
      if (!existing) {
        docs.push({
          id: d.id,
          name: d.name,
          url: d.fileUrl || d.url,
          fileUrl: d.fileUrl,
          dataUrl: d.dataUrl,
          size: d.fileSize,
          type: d.fileType,
        });
      } else {
        if (!existing.dataUrl && d.dataUrl) existing.dataUrl = d.dataUrl;
        if (!existing.id && d.id) existing.id = d.id;
        if (!existing.size && d.fileSize) existing.size = d.fileSize;
        if (!existing.type && d.fileType) existing.type = d.fileType;
      }
    });

    // 3. From InboundRequest if requestId matches
    if (q.requestId) {
      const req = databaseStore.getRequests().find((r) => r.id === q.requestId);
      if (req && Array.isArray(req.files)) {
        req.files.forEach((f: any, idx) => {
          const name = typeof f === 'string' ? f : f.name;
          if (!name) return;
          const existing = docs.find((x) => x.name.toLowerCase() === name.toLowerCase());
          if (!existing) {
            docs.push(typeof f === 'string' ? { id: `${req.id}-file-${idx}`, name: f } : { ...f, id: f.id || `${req.id}-file-${idx}` });
          } else if (typeof f !== 'string') {
            if (!existing.dataUrl && f.dataUrl) existing.dataUrl = f.dataUrl;
            if (!existing.url && f.url) existing.url = f.url;
            if (!existing.size && f.size) existing.size = f.size;
          }
        });
      }
    }

    // 4. Fallback: Parse from q.notes if text mentions files
    if (docs.length === 0 && q.notes) {
      const match = q.notes.match(/(?:Documentos(?: anexados)?(?:\s*\(\d+\))?:\s*)([^\n]+)/i);
      if (match && match[1]) {
        const names = match[1].split(',').map((s) => s.trim()).filter(Boolean);
        names.forEach((name, idx) => {
          if (!docs.some((existing) => existing.name.toLowerCase() === name.toLowerCase())) {
            docs.push({ id: `${q.id}-note-${idx}`, name });
          }
        });
      }
    }

    return docs;
  };

  const handleDownloadDoc = async (doc: {
    id?: string;
    name: string;
    url?: string;
    fileUrl?: string;
    dataUrl?: string;
    size?: number;
    type?: string;
  }) => {
    try {
      await downloadDocumentFile(doc);
    } catch (e) {
      console.error('Erro ao baixar documento do orçamento:', e);
      alert('Não foi possível realizar o download do documento.');
    }
  };

  const handleDownloadAllDocs = async (docs: Array<{
    id?: string;
    name: string;
    url?: string;
    fileUrl?: string;
    dataUrl?: string;
    size?: number;
    type?: string;
  }>) => {
    for (let i = 0; i < docs.length; i++) {
      await handleDownloadDoc(docs[i]);
      if (i < docs.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  };

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
          <table className="w-full text-left text-sm text-slate-600 min-w-[960px]">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-[110px] whitespace-nowrap">Código</th>
                <th className="px-4 py-3 min-w-[160px]">Cliente</th>
                <th className="px-4 py-3 min-w-[180px]">Itens / Serviços</th>
                <th className="px-4 py-3 w-[140px] whitespace-nowrap">Emissão / Validade</th>
                <th className="px-4 py-3 w-[95px] whitespace-nowrap">Prazo</th>
                <th className="px-4 py-3 w-[115px] whitespace-nowrap">Valor Total</th>
                <th className="px-4 py-3 w-[120px] whitespace-nowrap">Status</th>
                <th className="px-4 py-3 w-[160px] text-right whitespace-nowrap">Ações</th>
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
                quotes.map((q) => {
                  const qDocs = getQuoteDocuments(q);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-700">
                        {q.code}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {q.customerName}
                        </p>
                        <p className="text-xs text-slate-500">{q.customerEmail}</p>
                        {qDocs.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuoteForDocs(q);
                                setPreviewDoc(null);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 rounded-md transition-colors"
                              title="Clique para visualizar os documentos enviados"
                            >
                              <Paperclip className="w-3 h-3 text-blue-600" />
                              {qDocs.length} doc{qDocs.length > 1 ? 's' : ''}
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (qDocs.length === 1) {
                                  await handleDownloadDoc(qDocs[0]);
                                } else {
                                  await handleDownloadAllDocs(qDocs);
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md transition-colors shadow-2xs"
                              title={qDocs.length === 1 ? `Baixar arquivo: ${qDocs[0].name}` : `Baixar todos os ${qDocs.length} documentos`}
                            >
                              <Download className="w-3 h-3 text-emerald-600" />
                              Baixar
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">
                          {q.items[0]?.serviceName || 'Serviço'}
                        </p>
                        {(q.sourceLanguage || q.items[0]?.sourceLanguage || q.targetLanguage || q.items[0]?.targetLanguage) && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                              🌐 {q.sourceLanguage || q.items[0]?.sourceLanguage || 'Português'} → {q.targetLanguage || q.items[0]?.targetLanguage || 'Inglês'}
                            </span>
                          </div>
                        )}
                        {q.items.length > 1 && (
                          <p className="text-slate-400 mt-0.5">+{q.items.length - 1} outro(s) item(ns)</p>
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

                          {/* View Documents Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedQuoteForDocs(q);
                              setPreviewDoc(null);
                            }}
                            className="text-xs gap-1 text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300 font-semibold"
                            title="Visualizar documento(s) enviado(s) antes de gerar OS"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" /> Ver Documentos
                          </Button>

                          {/* Direct Download Button */}
                          {qDocs.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (qDocs.length === 1) {
                                  await handleDownloadDoc(qDocs[0]);
                                } else {
                                  setSelectedQuoteForDocs(q);
                                }
                              }}
                              className="text-xs gap-1 text-emerald-700 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 font-bold"
                              title={qDocs.length === 1 ? `Baixar ${qDocs[0].name}` : `Ver e baixar documentos (${qDocs.length})`}
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" /> Baixar Doc
                            </Button>
                          )}

                          {/* 1-Click Convert to Work Order */}
                          {q.status !== 'aprovado' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertToOrder(q.id)}
                              className="text-xs gap-1 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-semibold"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização de Documentos antes de Gerar OS */}
      {selectedQuoteForDocs && (
        <Modal
          isOpen={!!selectedQuoteForDocs}
          onClose={() => {
            setSelectedQuoteForDocs(null);
            setPreviewDoc(null);
          }}
          title={`Documentos do Orçamento ${selectedQuoteForDocs.code}`}
          description="Revise os arquivos enviados pelo cliente antes de aprovar e gerar a Ordem de Serviço."
          maxWidth="5xl"
        >
          <div className="space-y-5">
            {/* Customer Details Strip */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedQuoteForDocs.customerName}</p>
                <p className="text-slate-500">{selectedQuoteForDocs.customerEmail}</p>
                <p className="text-slate-600 font-medium mt-0.5">
                  <span className="text-slate-400">WhatsApp: </span>
                  {selectedQuoteForDocs.customerPhone || 'Não informado'}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5">
                <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {selectedQuoteForDocs.items[0]?.serviceName || 'Tradução'}
                </span>
                {(selectedQuoteForDocs.sourceLanguage || selectedQuoteForDocs.items[0]?.sourceLanguage || selectedQuoteForDocs.targetLanguage || selectedQuoteForDocs.items[0]?.targetLanguage) && (
                  <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    🌐 {selectedQuoteForDocs.sourceLanguage || selectedQuoteForDocs.items[0]?.sourceLanguage || 'Português'} → {selectedQuoteForDocs.targetLanguage || selectedQuoteForDocs.items[0]?.targetLanguage || 'Inglês'}
                  </span>
                )}
                {selectedQuoteForDocs.customerPhone && (
                  <a
                    href={`https://wa.me/55${selectedQuoteForDocs.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${selectedQuoteForDocs.customerName}, tudo bem? Sou da TraduzTudo e estou analisando os documentos do seu orçamento ${selectedQuoteForDocs.code}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Conversar no WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Customer Notes */}
            {selectedQuoteForDocs.notes && (
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs">
                <p className="font-semibold text-amber-900 mb-0.5">Observações da Solicitação:</p>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedQuoteForDocs.notes}</p>
              </div>
            )}

            {/* Documentos Enviados pelo Cliente */}
            {(() => {
              const modalDocs = getQuoteDocuments(selectedQuoteForDocs);
              if (modalDocs.length === 0) return null;

              return (
                <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/70 p-4 rounded-2xl border-2 border-blue-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-blue-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          Documentos Enviados pelo Cliente
                          <span className="bg-blue-600 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                            {modalDocs.length} {modalDocs.length === 1 ? 'arquivo anexado' : 'arquivos anexados'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600">
                          Arquivos enviados pelo cliente na solicitação deste orçamento prontos para download imediato.
                        </p>
                      </div>
                    </div>

                    {modalDocs.length > 1 && (
                      <Button
                        size="sm"
                        onClick={() => handleDownloadAllDocs(modalDocs)}
                        className="gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs self-start sm:self-auto"
                      >
                        <Download className="w-4 h-4" /> Baixar Todos ({modalDocs.length})
                      </Button>
                    )}
                  </div>

                  {/* Grid of customer files */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    {modalDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0 border border-blue-100">
                            {doc.name.toLowerCase().endsWith('.pdf') ? (
                              <FileText className="w-5 h-5 text-rose-600" />
                            ) : doc.name.toLowerCase().match(/\.(docx?|odt)$/) ? (
                              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Paperclip className="w-5 h-5 text-indigo-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span>{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Tamanho não especificado'}</span>
                              <span>•</span>
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Disponível
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewDoc(doc)}
                            className="text-xs gap-1 text-slate-700 hover:bg-slate-50 border-slate-200 h-8 px-2.5"
                            title="Visualizar documento"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" /> Ver
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownloadDoc(doc)}
                            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 shadow-2xs"
                            title="Baixar este documento para o seu computador"
                          >
                            <Download className="w-3.5 h-3.5" /> Baixar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Módulo Integrado de Documentos + OCR + Word + Contagem + Assinaturas */}
            <div className="pt-1">
              <DocumentProcessingSection
                quoteId={selectedQuoteForDocs.id}
                customerId={selectedQuoteForDocs.customerId}
                sourceLang={selectedQuoteForDocs.sourceLanguage || selectedQuoteForDocs.items[0]?.sourceLanguage || 'pt'}
                targetLang={selectedQuoteForDocs.targetLanguage || selectedQuoteForDocs.items[0]?.targetLanguage || 'it'}
                onApplyWordCountToQuote={() => {
                  setRefresh((r) => r + 1);
                }}
              />
            </div>

            {/* Embedded Live Preview */}
            {previewDoc && (
              <div className="p-3.5 bg-slate-900 rounded-xl text-white space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-1.5 border-b border-slate-800">
                  <span className="font-bold truncate text-white">{previewDoc.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(previewDoc)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                      title="Baixar este documento agora"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar Documento
                    </button>
                    {(previewDoc.dataUrl || previewDoc.url) && (
                      <a
                        href={previewDoc.dataUrl || previewDoc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir em tela cheia
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]">
                  {previewDoc.dataUrl || previewDoc.url ? (
                    ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(previewDoc.name.split('.').pop()?.toLowerCase() || '') ? (
                      <img
                        src={previewDoc.dataUrl || previewDoc.url}
                        alt={previewDoc.name}
                        className="max-h-[440px] w-auto object-contain mx-auto"
                      />
                    ) : (
                      <iframe
                        src={previewDoc.dataUrl || previewDoc.url}
                        title={previewDoc.name}
                        className="w-full h-[440px] bg-white rounded"
                      />
                    )
                  ) : (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="font-semibold text-white">{previewDoc.name}</p>
                      <p className="text-xs text-slate-400">Clique em &quot;Baixar Documento&quot; para abrir este arquivo no seu computador.</p>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadDoc(previewDoc)}
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                      >
                        <Download className="w-4 h-4" /> Baixar Documento Agora
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  setPreviewDoc(null);
                }}
                className="w-full sm:w-auto text-xs"
              >
                Voltar
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedQuoteForDocs.status !== 'aprovado' && (
                  <Button
                    onClick={() => {
                      const qId = selectedQuoteForDocs.id;
                      setSelectedQuoteForDocs(null);
                      setPreviewDoc(null);
                      handleConvertToOrder(qId);
                    }}
                    className="w-full sm:w-auto text-xs gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs"
                  >
                    <FileCheck2 className="w-4 h-4" /> Aprovar e Gerar OS Agora
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
