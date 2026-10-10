'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  Filter,
  Eye,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  Plus,
  PenTool,
  Layers,
  FileCheck,
  Copy,
  ExternalLink,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import {
  DocumentItem,
  DocumentProcessingStatus,
  SignerConfig,
  WordCountMetrics,
} from '@/types';
import { formatDate } from '@/lib/utils';
import { DocumentProcessingSection } from '@/components/documents/DocumentProcessingSection';

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DocumentProcessingStatus>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocForPipeline, setSelectedDocForPipeline] = useState<DocumentItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const documents = databaseStore.getDocuments().filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const quote = d.quoteId ? databaseStore.getQuote(d.quoteId) : null;
    const cust = d.customerId ? databaseStore.getCustomer(d.customerId) : null;
    const lead = d.leadId ? databaseStore.getLeads().find((l) => l.id === d.leadId) : null;

    return (
      d.name.toLowerCase().includes(term) ||
      (quote && quote.code.toLowerCase().includes(term)) ||
      (cust && cust.name.toLowerCase().includes(term)) ||
      (lead && lead.name.toLowerCase().includes(term)) ||
      (d.uploaderName && d.uploaderName.toLowerCase().includes(term))
    );
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Excluir permanentemente o documento "${name}" e todas as suas versões?`)) {
      databaseStore.deleteDocument(id);
      setRefresh((r) => r + 1);
    }
  };

  const getStatusBadge = (status?: DocumentProcessingStatus) => {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border shrink-0 tracking-wide';
    switch (status) {
      case 'UPLOADED':
        return <span className={`${base} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`}>ENVIADO</span>;
      case 'ANALYZING':
        return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 animate-pulse`}>ANALISANDO</span>;
      case 'OCR_PROCESSING':
        return <span className={`${base} bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800 animate-pulse`}>PROCESSANDO OCR</span>;
      case 'OCR_COMPLETED':
        return <span className={`${base} bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800`}>OCR CONCLUÍDO</span>;
      case 'DOCX_READY':
        return <span className={`${base} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800`}>WORD PRONTO</span>;
      case 'TRANSLATION_PENDING':
        return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800`}>EM TRADUÇÃO</span>;
      case 'TRANSLATED_DOCX_UPLOADED':
        return <span className={`${base} bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-800`}>TRADUZIDO</span>;
      case 'FINAL_PDF_READY':
        return <span className={`${base} bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800`}>PDF FINAL</span>;
      case 'SIGNATURE_PENDING':
        return <span className={`${base} bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800`}>AGUARDANDO ASSINATURA</span>;
      case 'SIGNED':
        return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800`}><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> ASSINADO</span>;
      case 'ERROR':
        return <span className={`${base} bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800`}>ERRO</span>;
      default:
        return <span className={`${base} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`}>CONCLUÍDO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderOpen className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Repositório de Documentos & OCR
            </h1>
            {databaseStore.getClicksignConfig().environment === 'production' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
                Clicksign Produção
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                Clicksign Sandbox
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Módulo centralizado de OCR, extração de texto, geração de Word editável, contagem comercial e assinaturas digitais autorizadas.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="gap-2 shadow-xs text-xs sm:text-sm self-start sm:self-auto bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
        >
          <Upload className="w-4 h-4" /> Enviar Novo Documento
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por documento, orçamento, cliente ou hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">
            Exibindo <span className="font-bold text-slate-900">{documents.length}</span> documento(s)
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll text-xs pt-2 border-t border-slate-100 pb-0.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Todos ({databaseStore.getDocuments().length})
          </button>
          <button
            onClick={() => setStatusFilter('UPLOADED')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              statusFilter === 'UPLOADED'
                ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Abertos / Enviados
          </button>
          <button
            onClick={() => setStatusFilter('OCR_COMPLETED')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              statusFilter === 'OCR_COMPLETED'
                ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
          >
            OCR Concluído
          </button>
          <button
            onClick={() => setStatusFilter('DOCX_READY')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              statusFilter === 'DOCX_READY'
                ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Word Pronto
          </button>
          <button
            onClick={() => setStatusFilter('SIGNATURE_PENDING')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              statusFilter === 'SIGNATURE_PENDING'
                ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Aguardando Assinatura
          </button>
          <button
            onClick={() => setStatusFilter('SIGNED')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              statusFilter === 'SIGNED'
                ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Assinados
          </button>
        </div>
      </div>

      {/* Main Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[1100px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[280px]">Documento & Hash</th>
                <th className="px-4 py-3 w-[110px] whitespace-nowrap">Orçamento</th>
                <th className="px-4 py-3 min-w-[140px]">Cliente</th>
                <th className="px-4 py-3 w-[80px] text-center whitespace-nowrap">Idioma</th>
                <th className="px-4 py-3 w-[120px] whitespace-nowrap">Palavras</th>
                <th className="px-4 py-3 w-[75px] text-center whitespace-nowrap">Páginas</th>
                <th className="px-4 py-3 w-[140px] whitespace-nowrap">Status</th>
                <th className="px-4 py-3 w-[170px] whitespace-nowrap">Assinatura</th>
                <th className="px-4 py-3 w-[100px] whitespace-nowrap">Data</th>
                <th className="px-4 py-3 w-[130px] text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-xs text-slate-400">
                    Nenhum documento encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const quote = doc.quoteId ? databaseStore.getQuote(doc.quoteId) : null;
                  const cust = doc.customerId ? databaseStore.getCustomer(doc.customerId) : null;
                  const lead = doc.leadId ? databaseStore.getLeads().find((l) => l.id === doc.leadId) : null;
                  const metrics = doc.originalWordCount;
                  const docxVer = doc.versions?.find((v) => v.type === 'GENERATED_DOCX');
                  const ext = (doc.name.split('.').pop() || 'DOC').toUpperCase().slice(0, 4);
                  const isPdf = ext === 'PDF';
                  const isDocx = ext === 'DOCX' || ext === 'DOC';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Documento & Hash */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                              isPdf
                                ? 'bg-red-50 text-red-600 border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
                                : isDocx
                                ? 'bg-blue-50 text-blue-600 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60'
                                : 'bg-indigo-50 text-indigo-600 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-extrabold uppercase tracking-tight leading-none mt-0.5">
                              {ext}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-semibold text-slate-900 text-xs sm:text-sm truncate max-w-[260px] lg:max-w-[340px]"
                              title={doc.name}
                            >
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                              <span>{(doc.currentSha256 || doc.sha256Original || '---').substring(0, 10)}...</span>
                              <button
                                onClick={() => copyToClipboard(doc.currentSha256 || doc.sha256Original || '')}
                                title="Copiar SHA-256 completo"
                                className="hover:text-blue-600 p-0.5 transition-colors"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Orçamento */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {quote ? (
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {quote.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">Avulso</span>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3.5 text-xs text-slate-700">
                        <span className="truncate max-w-[160px] block" title={cust ? cust.name : quote ? quote.customerName : lead ? lead.name : '---'}>
                          {cust ? cust.name : quote ? quote.customerName : lead ? `${lead.name} (Lead)` : '---'}
                        </span>
                      </td>

                      {/* Idioma */}
                      <td className="px-4 py-3.5 text-xs text-center whitespace-nowrap">
                        <span className="font-semibold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {doc.sourceLanguage || 'POR'}
                        </span>
                      </td>

                      {/* Palavras */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {metrics ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-emerald-700 block">
                              {metrics.billableWords.toLocaleString('pt-BR')} fat.
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({metrics.words.toLocaleString('pt-BR')} tot.)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>

                      {/* Páginas */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 text-center whitespace-nowrap">
                        {metrics?.pages || 1}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(doc.status)}</td>

                      {/* Assinatura */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {doc.signatureRequest ? (
                          doc.signatureRequest.status === 'SIGNED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Clicksign Assinado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                              <RotateCw className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Aguardando Clicksign
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px] px-1">Não iniciada</span>
                        )}
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(doc.createdAt)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDocForPipeline(doc)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 transition-colors"
                            title="Ver detalhes do pipeline"
                          >
                            <Layers className="w-3.5 h-3.5" /> Detalhes
                          </button>

                          {docxVer?.dataUrl && (
                            <a
                              href={docxVer.dataUrl}
                              download={docxVer.fileName}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-colors"
                              title="Baixar Word DOCX"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(doc.id, doc.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                            title="Excluir documento"
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

      {/* MODAL: Enviar Novo Documento */}
      {isUploadModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload e Processamento de Documentos"
          maxWidth="4xl"
        >
          <div className="p-1">
            <DocumentProcessingSection />
          </div>
        </Modal>
      )}

      {/* MODAL: Detalhes do Pipeline do Documento */}
      {selectedDocForPipeline && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDocForPipeline(null)}
          title={`Pipeline Completo - ${selectedDocForPipeline.name}`}
          maxWidth="5xl"
        >
          <div className="p-1">
            <DocumentProcessingSection
              quoteId={selectedDocForPipeline.quoteId}
              workOrderId={selectedDocForPipeline.workOrderId}
              customerId={selectedDocForPipeline.customerId}
              sourceLang={selectedDocForPipeline.sourceLanguage}
              targetLang={selectedDocForPipeline.targetLanguage}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
