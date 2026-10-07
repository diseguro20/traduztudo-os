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

    return (
      d.name.toLowerCase().includes(term) ||
      (quote && quote.code.toLowerCase().includes(term)) ||
      (cust && cust.name.toLowerCase().includes(term)) ||
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
    switch (status) {
      case 'UPLOADED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">ENVIADO</span>;
      case 'ANALYZING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">ANALISANDO</span>;
      case 'OCR_PROCESSING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 animate-pulse">PROCESSANDO OCR</span>;
      case 'OCR_COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">OCR CONCLUÍDO</span>;
      case 'DOCX_READY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">WORD PRONTO</span>;
      case 'TRANSLATION_PENDING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">EM TRADUÇÃO</span>;
      case 'TRANSLATED_DOCX_UPLOADED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">TRADUZIDO</span>;
      case 'FINAL_PDF_READY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">PDF FINAL</span>;
      case 'SIGNATURE_PENDING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">AGUARDANDO ASSINATURA</span>;
      case 'SIGNED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> ASSINADO</span>;
      case 'ERROR':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">ERRO</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">CONCLUÍDO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderOpen className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Repositório de Documentos & OCR
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Clicksign Sandbox
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Módulo centralizado de OCR, extração de texto, geração de Word editável, contagem comercial e assinaturas digitais autorizadas.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="gap-2 shadow-xs text-xs sm:text-sm self-start sm:self-auto bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4" /> Enviar Novo Documento
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por documento, orçamento, cliente ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({databaseStore.getDocuments().length})
          </button>
          <button
            onClick={() => setStatusFilter('OCR_COMPLETED')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'OCR_COMPLETED'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            OCR Concluído
          </button>
          <button
            onClick={() => setStatusFilter('DOCX_READY')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'DOCX_READY'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Word Pronto
          </button>
          <button
            onClick={() => setStatusFilter('SIGNATURE_PENDING')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'SIGNATURE_PENDING'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Aguardando Assinatura
          </button>
          <button
            onClick={() => setStatusFilter('SIGNED')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'SIGNED'
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assinados
          </button>
        </div>
      </div>

      {/* Main Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[1050px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Documento & Hash</th>
                <th className="px-4 py-3">Orçamento</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Idioma</th>
                <th className="px-4 py-3">Palavras</th>
                <th className="px-4 py-3">Páginas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assinatura</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-xs text-slate-400">
                    Nenhum documento encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const quote = doc.quoteId ? databaseStore.getQuote(doc.quoteId) : null;
                  const cust = doc.customerId ? databaseStore.getCustomer(doc.customerId) : null;
                  const metrics = doc.originalWordCount;
                  const docxVer = doc.versions?.find((v) => v.type === 'GENERATED_DOCX');

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Documento & Hash */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {doc.name.split('.').pop()?.toUpperCase() || 'DOC'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-xs truncate max-w-[200px]" title={doc.name}>
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                              <span>{(doc.currentSha256 || doc.sha256Original || '---').substring(0, 10)}...</span>
                              <button
                                onClick={() => copyToClipboard(doc.currentSha256 || doc.sha256Original || '')}
                                title="Copiar SHA-256"
                                className="hover:text-blue-600"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Orçamento */}
                      <td className="px-4 py-3.5 text-xs">
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
                        {cust ? cust.name : quote ? quote.customerName : '---'}
                      </td>

                      {/* Idioma */}
                      <td className="px-4 py-3.5 text-xs">
                        <span className="font-semibold text-indigo-700 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                          {doc.sourceLanguage || 'POR'}
                        </span>
                      </td>

                      {/* Palavras */}
                      <td className="px-4 py-3.5 text-xs">
                        {metrics ? (
                          <div>
                            <span className="font-bold text-emerald-700">
                              {metrics.billableWords.toLocaleString()} fat.
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({metrics.words.toLocaleString()} tot.)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>

                      {/* Páginas */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        {metrics?.pages || 1}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">{getStatusBadge(doc.status)}</td>

                      {/* Assinatura */}
                      <td className="px-4 py-3.5 text-xs">
                        {doc.signatureRequest ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            {doc.signatureRequest.status === 'SIGNED' ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Clicksign Assinado
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">Aguardando Clicksign</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Não iniciada</span>
                        )}
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(doc.createdAt)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDocForPipeline(doc)}
                            className="text-xs gap-1 text-blue-700 hover:bg-blue-50"
                          >
                            <Layers className="w-3.5 h-3.5" /> Detalhes
                          </Button>

                          {docxVer?.dataUrl && (
                            <a
                              href={docxVer.dataUrl}
                              download={docxVer.fileName}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Baixar Word DOCX"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(doc.id, doc.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
