'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Printer,
  FileText,
  Eye,
  RefreshCw,
  Search,
  Copy,
  Check,
  Upload,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentItem, DocumentVersion } from '@/types';
import {
  createDocumentBlobUrl,
  revokeDocumentBlobUrl,
  saveDocumentBlob,
  getDocumentBlob,
} from '@/lib/storage/documentStorage';
import { databaseStore } from '@/lib/db';

interface UniversalDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  initialVersionType?: 'ORIGINAL' | 'OCR_PDF' | 'FINAL_PDF' | 'SIGNED_PDF';
}

export function UniversalDocumentViewerModal({
  isOpen,
  onClose,
  document: doc,
  initialVersionType,
}: UniversalDocumentViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'viewer' | 'text' | 'versions'>('viewer');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [textSearch, setTextSearch] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and load Blob URL whenever doc or selectedVersion changes
  useEffect(() => {
    let currentUrl: string | null = null;
    let isMounted = true;

    async function loadViewerContent() {
      if (!doc || !isOpen) {
        setBlobUrl(null);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        // Pick target version or root document
        let targetId = doc.id;
        let fallbackDataUrl = doc.dataUrl || doc.fileUrl;
        let mimeType = doc.fileType || 'application/pdf';
        let targetName = doc.name;

        if (initialVersionType && doc.versions) {
          const match = doc.versions.find((v) => v.type === initialVersionType);
          if (match) {
            targetId = match.id;
            fallbackDataUrl = match.dataUrl || match.fileUrl;
            mimeType = match.fileType || mimeType;
            targetName = match.fileName;
          }
        }

        // Try to obtain a reliable blob URL
        let url = await createDocumentBlobUrl(targetId, fallbackDataUrl, mimeType);

        // If not found by version ID, fallback to document ID
        if (!url && targetId !== doc.id) {
          url = await createDocumentBlobUrl(doc.id, doc.dataUrl || doc.fileUrl, doc.fileType);
        }

        // If dataUrl starts with data: and is complete
        if (!url && fallbackDataUrl && fallbackDataUrl.startsWith('data:') && fallbackDataUrl.length > 500) {
          const blob = await saveDocumentBlob(targetId, fallbackDataUrl, targetName, mimeType);
          url = URL.createObjectURL(blob);
        }

        if (!isMounted) {
          if (url) revokeDocumentBlobUrl(url);
          return;
        }

        if (url) {
          currentUrl = url;
          setBlobUrl(url);
          setIsLoading(false);
        } else {
          // Binary is not available in local storage (e.g. truncated legacy cache)
          setLoadError('binary_not_found');
          setIsLoading(false);
          // Switch to OCR text automatically so user sees extracted content immediately
          if (doc.extractedText) {
            setActiveTab('text');
          }
        }
      } catch (err: any) {
        console.error('Error generating document viewer stream:', err);
        if (isMounted) {
          setLoadError(err.message || 'Erro ao carregar visualizador');
          setIsLoading(false);
          if (doc?.extractedText) setActiveTab('text');
        }
      }
    }

    loadViewerContent();

    return () => {
      isMounted = false;
      if (currentUrl) {
        revokeDocumentBlobUrl(currentUrl);
      }
    };
  }, [doc, isOpen, initialVersionType]);

  if (!isOpen || !doc) return null;

  const fileExt = doc.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(fileExt);
  const isDocx = ['docx', 'doc'].includes(fileExt);
  const isPdf = fileExt === 'pdf' || !isImage;

  const fileSizeKb = doc.fileSize ? Math.round(doc.fileSize / 1024) : null;
  const currentHash = doc.currentSha256 || doc.sha256Original;

  const copyHash = () => {
    if (currentHash) {
      navigator.clipboard.writeText(currentHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const copyAllText = () => {
    if (doc.extractedText) {
      navigator.clipboard.writeText(doc.extractedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Allow re-uploading the original file if binary was missing
  const handleReuploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const blob = await saveDocumentBlob(doc.id, file, file.name, file.type || 'application/pdf');
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setActiveTab('viewer');
      setIsLoading(false);

      // Also update in db
      databaseStore.updateDocument(doc.id, {
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
      });
    } catch (err: any) {
      alert(`Erro ao carregar arquivo: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (blobUrl) {
      const win = window.open(blobUrl, '_blank');
      if (win) {
        win.focus();
        setTimeout(() => win.print(), 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 shrink-0">
              {isImage ? <Eye className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-[280px] sm:max-w-md">
                  {doc.name}
                </h3>
                {fileSizeKb && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {fileSizeKb.toLocaleString()} KB
                  </span>
                )}
                {doc.originalWordCount?.pages && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    {doc.originalWordCount.pages} {doc.originalWordCount.pages === 1 ? 'página' : 'páginas'}
                  </span>
                )}
              </div>
              {currentHash && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                  <span className="text-slate-500">SHA-256:</span>
                  <span className="truncate max-w-[180px] sm:max-w-xs">{currentHash}</span>
                  <button
                    onClick={copyHash}
                    className="hover:text-blue-400 transition-colors p-0.5"
                    title="Copiar Hash SHA-256"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {blobUrl && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(blobUrl, '_blank')}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs gap-1.5 h-8"
                  title="Abrir em Nova Aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nova Aba</span>
                </Button>

                <a
                  href={blobUrl}
                  download={doc.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 transition-colors shadow-xs"
                  title="Baixar Arquivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Baixar</span>
                </a>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs p-2 h-8"
                  title="Imprimir"
                >
                  <Printer className="w-3.5 h-3.5" />
                </Button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 bg-slate-100 border-b border-slate-200 text-xs shrink-0">
          <div className="flex items-center gap-1 py-1.5">
            <button
              onClick={() => setActiveTab('viewer')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'viewer'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Visualização Direta {isPdf ? '(PDF)' : isImage ? '(Imagem)' : ''}
            </button>

            {doc.extractedText && (
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'text'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Texto Extraído & OCR
                {doc.originalWordCount?.billableWords ? (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px]">
                    {doc.originalWordCount.billableWords} pal.
                  </span>
                ) : null}
              </button>
            )}

            {doc.versions && doc.versions.length > 0 && (
              <button
                onClick={() => setActiveTab('versions')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'versions'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Versões & Auditoria ({doc.versions.length})
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[11px]">
            {isPdf && blobUrl && <span>Visualizador nativo embutido</span>}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-y-auto">
          {activeTab === 'viewer' && (
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[450px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  <p className="text-sm font-medium">Carregando visualizador seguro de alta fidelidade...</p>
                  <p className="text-xs text-slate-500">Decodificando fluxo binário do documento ({doc.name})</p>
                </div>
              ) : blobUrl ? (
                isImage ? (
                  <div className="w-full h-full flex items-center justify-center p-2 bg-slate-900/60 rounded-xl overflow-auto">
                    <img
                      src={blobUrl}
                      alt={doc.name}
                      className="max-h-[75vh] max-w-full object-contain rounded-lg border border-slate-800 shadow-md"
                    />
                  </div>
                ) : isPdf ? (
                  <div className="w-full h-full flex flex-col space-y-2">
                    <div className="w-full h-[75vh] bg-white rounded-xl overflow-hidden shadow-lg border border-slate-800">
                      <object
                        data={blobUrl}
                        type="application/pdf"
                        className="w-full h-full rounded-xl"
                      >
                        {/* Fallback iframe inside object tag */}
                        <iframe
                          src={blobUrl}
                          className="w-full h-full rounded-xl"
                          title={doc.name}
                        >
                          <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-50 space-y-3">
                            <FileText className="w-12 h-12 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-800">
                              O leitor interno não pôde renderizar automaticamente neste dispositivo.
                            </p>
                            <Button
                              onClick={() => window.open(blobUrl, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                              <ExternalLink className="w-4 h-4" /> Abrir PDF em Nova Janela
                            </Button>
                          </div>
                        </iframe>
                      </object>
                    </div>
                  </div>
                ) : (
                  // Other file formats (DOCX, etc.)
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-4 max-w-md mx-auto">
                    <div className="p-4 bg-blue-900/30 text-blue-400 rounded-2xl border border-blue-700/40">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{doc.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Arquivos Word ({fileExt.toUpperCase()}) podem ser editados no Microsoft Word, Google Docs ou LibreOffice.
                      </p>
                    </div>
                    <a
                      href={blobUrl}
                      download={doc.name}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-colors"
                    >
                      <Download className="w-4 h-4" /> Baixar Documento Editável
                    </a>
                  </div>
                )
              ) : (
                // Binary not found fallback
                <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-900/90 rounded-2xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-xl">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Visualização Direta do Arquivo</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      O binário completo deste arquivo não está armazenado em cache nesta sessão do navegador. O texto extraído pelo OCR e todas as métricas estão preservadas.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                        onChange={handleReuploadFile}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs">
                        <Upload className="w-4 h-4" /> Re-anexar Arquivo Original
                      </span>
                    </label>

                    {doc.extractedText && (
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('text')}
                        className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" /> Ver Texto Extraído OCR
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="w-full h-full flex flex-col space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
              {/* Text Search & Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Pesquisar termos no texto extraído..."
                    value={textSearch}
                    onChange={(e) => setTextSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyAllText}
                    className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs gap-1.5 h-8"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Todo o Texto
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Text Container */}
              <div className="flex-1 overflow-y-auto max-h-[64vh] pr-2 space-y-3">
                {doc.extractedText ? (
                  doc.extractedText.split('--- QUEBRA DE PÁGINA ---').map((pageText, pIdx) => {
                    const lines = pageText.split('\n');
                    const matchesSearch =
                      !textSearch || pageText.toLowerCase().includes(textSearch.toLowerCase());

                    if (!matchesSearch) return null;

                    return (
                      <div
                        key={pIdx}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-sans">
                          <span className="font-bold text-blue-400">Página {pIdx + 1}</span>
                          <span>{lines.filter((l) => l.trim().length > 0).length} linhas de conteúdo</span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed select-all">
                          {textSearch ? (
                            lines.map((line, lIdx) => {
                              if (line.toLowerCase().includes(textSearch.toLowerCase())) {
                                return (
                                  <div key={lIdx} className="bg-yellow-500/20 text-yellow-200 px-1 rounded">
                                    {line}
                                  </div>
                                );
                              }
                              return <div key={lIdx}>{line}</div>;
                            })
                          ) : (
                            pageText.trim()
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-500 text-xs py-8">Nenhum texto extraído disponível.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="w-full h-full bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Histórico de Versões & Trilhas Criptográficas (SHA-256)
              </h4>
              <div className="space-y-2">
                {doc.versions?.map((ver, idx) => (
                  <div
                    key={ver.id || idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                          v{ver.versionNumber}
                        </span>
                        <span className="font-semibold text-white">{ver.fileName}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          ({ver.type})
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span>SHA-256: {ver.sha256}</span>
                      </div>
                      {ver.notes && <p className="text-[11px] text-slate-500 mt-0.5">{ver.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(ver.dataUrl || ver.fileUrl) && (
                        <a
                          href={ver.dataUrl || ver.fileUrl}
                          download={ver.fileName}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar Versão
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 sm:px-6 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Documento sob conformidade de integridade SHA-256 e LGPD</span>
          </div>

          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs">
            Fechar Visualizador
          </Button>
        </div>
      </div>
    </div>
  );
}
