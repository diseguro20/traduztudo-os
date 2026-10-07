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
      name: string;
      url?: string;
      dataUrl?: string;
      size?: number;
      type?: string;
    }> = [];

    // 1. Directly from q.files
    if (Array.isArray(q.files)) {
      q.files.forEach((f: any) => {
        if (typeof f === 'string') {
          docs.push({ name: f });
        } else if (f && f.name) {
          docs.push(f);
        }
      });
    }

    // 2. From DocumentItem collection in databaseStore
    const linkedDocs = databaseStore.getDocuments().filter((d) => d.quoteId === q.id);
    linkedDocs.forEach((d) => {
      if (!docs.some((existing) => existing.name === d.name)) {
        docs.push({
          name: d.name,
          url: d.fileUrl || d.url,
          dataUrl: d.dataUrl,
          size: d.fileSize,
          type: d.fileType,
        });
      }
    });

    // 3. From InboundRequest if requestId matches
    if (q.requestId) {
      const req = databaseStore.getRequests().find((r) => r.id === q.requestId);
      if (req && Array.isArray(req.files)) {
        req.files.forEach((f: any) => {
          const name = typeof f === 'string' ? f : f.name;
          if (!docs.some((existing) => existing.name === name)) {
            docs.push(typeof f === 'string' ? { name: f } : f);
          }
        });
      }
    }

    // 4. Fallback: Parse from q.notes if text mentions files
    if (docs.length === 0 && q.notes) {
      const match = q.notes.match(/(?:Documentos(?: anexados)?(?:\s*\(\d+\))?:\s*)([^\n]+)/i);
      if (match && match[1]) {
        const names = match[1].split(',').map((s) => s.trim()).filter(Boolean);
        names.forEach((name) => {
          if (!docs.some((existing) => existing.name === name)) {
            docs.push({ name });
          }
        });
      }
    }

    return docs;
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
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuoteForDocs(q);
                              setPreviewDoc(null);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 rounded-md transition-colors mt-1"
                            title="Clique para visualizar os documentos enviados"
                          >
                            <Paperclip className="w-3 h-3 text-blue-600" />
                            {qDocs.length} documento(s)
                          </button>
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
          maxWidth="2xl"
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

            {/* Documents List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  Arquivos Anexados ({getQuoteDocuments(selectedQuoteForDocs).length})
                </h4>
                <span className="text-[11px] text-slate-400">Visualização e download</span>
              </div>

              {getQuoteDocuments(selectedQuoteForDocs).length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">Nenhum documento anexado digitalmente nesta solicitação.</p>
                  <p className="text-[11px] text-slate-400 mt-1">O cliente pode enviar os arquivos diretamente pelo WhatsApp.</p>
                  {selectedQuoteForDocs.customerPhone && (
                    <a
                      href={`https://wa.me/55${selectedQuoteForDocs.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${selectedQuoteForDocs.customerName}! Recebemos seu pedido de orçamento ${selectedQuoteForDocs.code}. Poderia nos enviar as fotos ou PDFs dos documentos por aqui?`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Solicitar Documentos no WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {getQuoteDocuments(selectedQuoteForDocs).map((doc, idx) => {
                    const ext = doc.name.split('.').pop()?.toLowerCase() || '';
                    const isPdf = ext === 'pdf';
                    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                    const isWord = ['doc', 'docx'].includes(ext);
                    const hasViewer = !!(doc.dataUrl || doc.url);

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          previewDoc?.name === doc.name
                            ? 'border-blue-400 bg-blue-50/40 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isPdf
                                ? 'bg-red-50 text-red-600'
                                : isImg
                                ? 'bg-emerald-50 text-emerald-600'
                                : isWord
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isPdf && <FileText className="w-5 h-5" />}
                            {isImg && <Image className="w-5 h-5" />}
                            {isWord && <FileText className="w-5 h-5" />}
                            {!isPdf && !isImg && !isWord && <File className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              {doc.size ? <span>{(doc.size / 1024).toFixed(1)} KB</span> : <span>Documento do cliente</span>}
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Anexado
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Document Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasViewer && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewDoc(previewDoc?.name === doc.name ? null : doc)}
                              className="text-xs gap-1 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {previewDoc?.name === doc.name ? 'Ocultar' : 'Visualizar'}
                            </Button>
                          )}

                          {hasViewer ? (
                            <a
                              href={doc.dataUrl || doc.url}
                              download={doc.name}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors inline-flex items-center"
                              title="Baixar arquivo"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          ) : (
                            <a
                              href={`https://wa.me/55${(selectedQuoteForDocs.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${selectedQuoteForDocs.customerName}! Referente ao documento "${doc.name}" do orçamento ${selectedQuoteForDocs.code}, você poderia nos enviar o arquivo original aqui pelo WhatsApp?`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Pedir arquivo original no WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" /> Pedir no WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Embedded Live Preview */}
            {previewDoc && (previewDoc.dataUrl || previewDoc.url) && (
              <div className="p-3 bg-slate-900 rounded-xl text-white space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-1 border-b border-slate-800">
                  <span className="font-semibold truncate">{previewDoc.name}</span>
                  <a
                    href={previewDoc.dataUrl || previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Abrir em tela cheia
                  </a>
                </div>

                <div className="bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]">
                  {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(previewDoc.name.split('.').pop()?.toLowerCase() || '') ? (
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
