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
  Languages,
  Calculator,
  Sparkles,
  CheckCircle2,
  Trash2,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentItem, DocumentVersion, WordCountMetrics } from '@/types';
import {
  createDocumentBlobUrl,
  revokeDocumentBlobUrl,
  saveDocumentBlob,
  getDocumentBlob,
  isValidPdfBlob,
} from '@/lib/storage/documentStorage';
import { generateCertifiedSignedPdf } from '@/lib/documents/documentProcessor';
import { databaseStore } from '@/lib/db';

interface UniversalDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  initialVersionType?: 'ORIGINAL' | 'OCR_PDF' | 'FINAL_PDF' | 'SIGNED_PDF' | 'TRANSLATED_DOCX';
}

export function UniversalDocumentViewerModal({
  isOpen,
  onClose,
  document: doc,
  initialVersionType,
}: UniversalDocumentViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'viewer' | 'text' | 'translated' | 'laudas' | 'versions'>('viewer');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedTranslatedText, setCopiedTranslatedText] = useState(false);
  const [textSearch, setTextSearch] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Translation States
  const [targetLanguage, setTargetLanguage] = useState<string>(doc?.targetLanguage || 'it');
  const [translatedText, setTranslatedText] = useState<string>(doc?.translatedText || '');
  const [translatedWordCount, setTranslatedWordCount] = useState<WordCountMetrics | undefined>(
    doc?.translatedWordCount
  );
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translateSuccessMsg, setTranslateSuccessMsg] = useState<string | null>(null);

  // Keep state synced with document prop
  useEffect(() => {
    if (doc) {
      setTargetLanguage(doc.targetLanguage || 'it');
      setTranslatedText(doc.translatedText || '');
      setTranslatedWordCount(doc.translatedWordCount);
    }
  }, [doc]);

  // Guarantee opened document is preserved in databaseStore and synced to Firestore in real time
  useEffect(() => {
    if (isOpen && doc && doc.id) {
      const existing = databaseStore.getDocument(doc.id);
      if (!existing) {
        databaseStore.createDocument({
          ...doc,
          tenantId: doc.tenantId || databaseStore.getTenant().id,
          uploaderUserId: doc.uploaderUserId || databaseStore.getCurrentUser().id,
          uploaderName: doc.uploaderName || databaseStore.getCurrentUser().name,
          category: doc.category || 'original',
          fileSize: doc.fileSize || 0,
          fileType: doc.fileType || 'application/pdf',
        });
      }
      databaseStore.pushLocalToFirestore().catch(() => {});
    }
  }, [isOpen, doc]);

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

        // 1. Try to get or validate the Blob
        let blob = await getDocumentBlob(targetId, fallbackDataUrl, mimeType);
        if (!blob && targetId !== doc.id) {
          blob = await getDocumentBlob(doc.id, doc.dataUrl || doc.fileUrl, doc.fileType);
        }

        const isTargetPdf =
          mimeType === 'application/pdf' ||
          targetName.toLowerCase().endsWith('.pdf') ||
          doc.status === 'SIGNED' ||
          initialVersionType === 'SIGNED_PDF';

        // Check if blob is a valid PDF
        let isPdfOk = await isValidPdfBlob(blob);

        // If it's supposed to be a signed PDF but blob is missing or corrupt, generate on the fly
        if (
          (!blob || !isPdfOk) &&
          (doc.status === 'SIGNED' || initialVersionType === 'SIGNED_PDF')
        ) {
          try {
            let existingBlob = await getDocumentBlob(doc.id);
            let existingBytes: Uint8Array | undefined;
            if (existingBlob && (await isValidPdfBlob(existingBlob))) {
              existingBytes = new Uint8Array(await existingBlob.arrayBuffer());
            }

            const { pdfBytes, pdfDataUrl } = await generateCertifiedSignedPdf(
              doc,
              doc.signatureRequest?.signer || { name: 'Carla Strambio' },
              existingBytes
            );

            blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            await saveDocumentBlob(targetId, blob, `${doc.name}_ASSINADO.pdf`, 'application/pdf');
            await saveDocumentBlob(doc.id, blob, doc.name, 'application/pdf');
            isPdfOk = true;

            databaseStore.updateDocument(doc.id, {
              dataUrl: pdfDataUrl,
            });
          } catch (genErr) {
            console.error('Failed to reconstruct signed PDF:', genErr);
          }
        }

        // Final check
        if (blob) {
          currentUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setBlobUrl(currentUrl);
            setIsLoading(false);
          }
        } else if (fallbackDataUrl && fallbackDataUrl.startsWith('data:')) {
          setBlobUrl(fallbackDataUrl);
          setIsLoading(false);
        } else {
          setIsLoading(false);
          setLoadError('O arquivo binário original deste documento não está no cache local.');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Viewer error:', err);
          setIsLoading(false);
          setLoadError(err.message || 'Erro ao carregar visualização');
        }
      }
    }

    loadViewerContent();

    return () => {
      isMounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [isOpen, doc, initialVersionType]);

  if (!isOpen || !doc) return null;

  const isPdf =
    doc.fileType === 'application/pdf' ||
    doc.name.toLowerCase().endsWith('.pdf') ||
    doc.status === 'SIGNED' ||
    initialVersionType === 'SIGNED_PDF';

  const isImage =
    doc.fileType?.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].some((ext) => doc.name.toLowerCase().endsWith(ext));

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

  const copyTranslatedText = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopiedTranslatedText(true);
      setTimeout(() => setCopiedTranslatedText(false), 2000);
    }
  };

  // Perform Dynamic Translation via API
  const handleTranslateDoc = async (newLang?: string) => {
    const lang = newLang || targetLanguage;
    if (!doc.extractedText) return;

    setIsTranslating(true);
    setTranslateSuccessMsg(null);

    try {
      const res = await fetch('/api/documents/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          fileName: doc.name,
          sourceLanguage: doc.sourceLanguage,
          targetLanguage: lang,
          textContent: doc.extractedText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.translatedText);
        setTranslatedWordCount(data.translatedWordCount);
        setTargetLanguage(lang);

        databaseStore.updateDocument(doc.id, {
          translatedText: data.translatedText,
          translatedWordCount: data.translatedWordCount,
          targetLanguage: lang,
        });

        if (data.docxDataUrl) {
          databaseStore.addDocumentVersion(doc.id, {
            documentId: doc.id,
            versionNumber: (doc.versions?.length || 1) + 1,
            type: 'TRANSLATED_DOCX',
            fileName: `${doc.name.replace(/\.[^/.]+$/, '')}_TRADUZIDO_${lang.toUpperCase()}.docx`,
            fileUrl: data.docxDataUrl,
            dataUrl: data.docxDataUrl,
            fileSize: 16000,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            sha256: data.sha256,
            notes: `Tradução dinâmica para ${lang.toUpperCase()}`,
          });
        }

        setTranslateSuccessMsg(`Documento traduzido com sucesso para ${lang.toUpperCase()}!`);
        setTimeout(() => setTranslateSuccessMsg(null), 3500);
      } else {
        alert('Erro ao traduzir documento. Tente novamente.');
      }
    } catch (err: any) {
      alert(`Erro na tradução: ${err.message}`);
    } finally {
      setIsTranslating(false);
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

  const handleDownloadVersion = async (ver: DocumentVersion) => {
    try {
      let blob = await getDocumentBlob(ver.id, ver.dataUrl || ver.fileUrl, ver.fileType);
      if (!blob && ver.type === 'SIGNED_PDF') {
        const { pdfBytes } = await generateCertifiedSignedPdf(
          doc,
          doc.signatureRequest?.signer || { name: 'Carla Strambio' }
        );
        blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      }
      if (!blob) {
        blob = await getDocumentBlob(doc.id, doc.dataUrl || doc.fileUrl, doc.fileType);
      }
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ver.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else if (ver.dataUrl && ver.dataUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = ver.dataUrl;
        a.download = ver.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Não foi possível obter o arquivo desta versão.');
      }
    } catch (e: any) {
      console.error('Erro ao baixar versão:', e);
      alert('Erro ao baixar versão do documento.');
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

  // Find translated DOCX version if available
  const translatedDocxVersion = doc.versions?.slice().reverse().find((v) => v.type === 'TRANSLATED_DOCX');

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
                {doc.originalWordCount?.laudasJuramentadas && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {doc.originalWordCount.laudasJuramentadas} {doc.originalWordCount.laudasJuramentadas === 1 ? 'lauda juramentada' : 'laudas juramentadas'}
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

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir permanentemente o documento "${doc.name}"?\nEsta ação removerá o arquivo, suas versões e cálculos.`)) {
                  databaseStore.deleteDocument(doc.id);
                  onClose();
                }
              }}
              className="bg-red-950/40 border-red-800 text-red-300 hover:bg-red-900/60 hover:text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs"
              title="Excluir documento permanentemente"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>

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
        <div className="flex items-center justify-between px-4 sm:px-6 bg-slate-100 border-b border-slate-200 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 py-1.5 flex-nowrap">
            <button
              onClick={() => setActiveTab('viewer')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
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
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === 'text'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Texto Original & OCR
              </button>
            )}

            {/* TAB: Documento Já Traduzido */}
            <button
              onClick={() => setActiveTab('translated')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'translated'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              Documento Traduzido
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                {(targetLanguage || 'IT').toUpperCase()}
              </span>
            </button>

            {/* TAB: Cálculo de Laudas */}
            <button
              onClick={() => setActiveTab('laudas')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'laudas'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              Cálculo de Laudas
              {doc.originalWordCount?.laudasJuramentadas ? (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                  {doc.originalWordCount.laudasJuramentadas} {doc.originalWordCount.laudasJuramentadas === 1 ? 'lauda' : 'laudas'}
                </span>
              ) : null}
            </button>

            {doc.versions && doc.versions.length > 0 && (
              <button
                onClick={() => setActiveTab('versions')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
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

          <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[11px] shrink-0">
            {isPdf && blobUrl && <span>Visualizador nativo de alta precisão</span>}
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
                    <iframe
                      src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full h-[76vh] rounded-xl border border-slate-800 bg-white shadow-lg"
                      title={doc.name}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-3">
                    <FileText className="w-12 h-12 text-blue-400" />
                    <p className="text-sm font-medium">Visualização direta pronta para download</p>
                    <a
                      href={blobUrl}
                      download={doc.name}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-colors"
                    >
                      Baixar {doc.name}
                    </a>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3 max-w-md">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                  <h4 className="text-sm font-bold text-white">Visualização Direta Não Disponível</h4>
                  <p className="text-xs text-slate-400">
                    {loadError || 'O arquivo binário original deste documento não está no cache local.'}
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        ref={fileInputRef}
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

          {/* TAB: Texto Original & OCR */}
          {activeTab === 'text' && (
            <div className="w-full h-full flex flex-col space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
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
                        <Copy className="w-3.5 h-3.5" /> Copiar Texto Original
                      </>
                    )}
                  </Button>
                </div>
              </div>

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

          {/* TAB: Documento Já Traduzido */}
          {activeTab === 'translated' && (
            <div className="w-full h-full flex flex-col space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
              {/* Translation Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-300">Idioma de Destino:</span>
                  <select
                    value={targetLanguage}
                    onChange={(e) => {
                      const newL = e.target.value;
                      setTargetLanguage(newL);
                      handleTranslateDoc(newL);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 text-white border border-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="it">🇮🇹 Italiano (Padrão TraduzTudo)</option>
                    <option value="en">🇺🇸 Inglês (Americano/Britânico)</option>
                    <option value="es">🇪🇸 Espanhol (América Latina / Espanha)</option>
                    <option value="pt">🇧🇷 Português do Brasil</option>
                    <option value="fr">🇫🇷 Francês</option>
                    <option value="de">🇩🇪 Alemão</option>
                  </select>

                  <Button
                    size="sm"
                    onClick={() => handleTranslateDoc()}
                    disabled={isTranslating}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-xs"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                    {isTranslating ? 'Traduzindo...' : 'Re-traduzir'}
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyTranslatedText}
                    className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs gap-1.5 h-8"
                  >
                    {copiedTranslatedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Tradução
                      </>
                    )}
                  </Button>

                  {translatedDocxVersion?.dataUrl && (
                    <a
                      href={translatedDocxVersion.dataUrl}
                      download={translatedDocxVersion.fileName}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors h-8"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar DOCX Traduzido
                    </a>
                  )}
                </div>
              </div>

              {/* Translation Success Alert */}
              {translateSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{translateSuccessMsg}</span>
                </div>
              )}

              {/* Translation Stats Header */}
              {translatedWordCount && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Laudas Juramentadas</span>
                    <p className="text-sm font-bold text-emerald-400">
                      {translatedWordCount.laudasJuramentadas || Math.ceil((translatedWordCount.charactersWithoutSpaces || 1) / 1000)} laudas
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Chars (s/ espaços)</span>
                    <p className="text-sm font-bold text-slate-200">
                      {translatedWordCount.charactersWithoutSpaces?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Palavras Traduzidas</span>
                    <p className="text-sm font-bold text-slate-200">
                      {translatedWordCount.words?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Valor Estimado</span>
                    <p className="text-sm font-bold text-emerald-400">
                      R$ {((translatedWordCount.laudasJuramentadas || 1) * 95).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-side or Pre-wrap Translated Content */}
              <div className="flex-1 overflow-y-auto max-h-[58vh] pr-2">
                {translatedText ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                    {translatedText}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                    <Languages className="w-10 h-10 text-slate-500" />
                    <p className="text-sm font-medium">Tradução automática pendente para este documento.</p>
                    <Button
                      size="sm"
                      onClick={() => handleTranslateDoc()}
                      disabled={isTranslating}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isTranslating ? 'Traduzindo agora...' : 'Gerar Tradução Oficial'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Cálculo de Laudas */}
          {activeTab === 'laudas' && (
            <div className="w-full h-full flex flex-col space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-y-auto max-h-[76vh]">
              {/* Highlight Hero Card: Laudas Juramentadas */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      Oficial JUCESP / Sintra
                    </span>
                    <span className="text-xs text-blue-300 font-medium">Norma Legal Brasileira</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    {doc.originalWordCount?.laudasJuramentadas || 1} {doc.originalWordCount?.laudasJuramentadas === 1 ? 'Lauda Juramentada' : 'Laudas Juramentadas'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Cálculo oficial baseado em <strong>1.000 caracteres sem espaços</strong> (fração:{' '}
                    {doc.originalWordCount?.laudasFracionadas || '1.00'} laudas exatas).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Valor Estimado do Documento</span>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">
                    R$ {((doc.originalWordCount?.laudasJuramentadas || 1) * 95).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-500">Tarifa base: R$ 95,00 / lauda</span>
                </div>
              </div>

              {/* Three Standard Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Lauda Juramentada */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">1. Lauda Juramentada</span>
                    <span className="text-[10px] text-slate-500 font-mono">1.000 chars s/ esp.</span>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {doc.originalWordCount?.laudasJuramentadas || 1} <span className="text-xs font-normal text-slate-400">laudas</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Total: {doc.originalWordCount?.charactersWithoutSpaces?.toLocaleString() || 0} caracteres sem espaço.
                  </p>
                </div>

                {/* 2. Lauda com Espaços */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">2. Lauda com Espaços</span>
                    <span className="text-[10px] text-slate-500 font-mono">1.250 chars c/ esp.</span>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {doc.originalWordCount?.laudasComEspacos || 1} <span className="text-xs font-normal text-slate-400">laudas</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Total: {doc.originalWordCount?.charactersWithSpaces?.toLocaleString() || 0} caracteres totais com espaços.
                  </p>
                </div>

                {/* 3. Lauda Técnica por Palavras */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">3. Lauda Técnica / Livre</span>
                    <span className="text-[10px] text-slate-500 font-mono">250 palavras</span>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {doc.originalWordCount?.laudasPalavras || 1} <span className="text-xs font-normal text-slate-400">laudas</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Total: {doc.originalWordCount?.billableWords?.toLocaleString() || 0} palavras faturáveis líquidas.
                  </p>
                </div>
              </div>

              {/* Breakdown by Page Table */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Detalhamento Página por Página
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Total de Páginas: {doc.originalWordCount?.pages || 1}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Página</th>
                        <th className="py-2.5 px-3">Palavras</th>
                        <th className="py-2.5 px-3">Chars (s/ espaços)</th>
                        <th className="py-2.5 px-3">Chars (c/ espaços)</th>
                        <th className="py-2.5 px-3">Linhas</th>
                        <th className="py-2.5 px-3">Laudas Juram.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {doc.originalWordCount?.pagesBreakdown && doc.originalWordCount.pagesBreakdown.length > 0 ? (
                        doc.originalWordCount.pagesBreakdown.map((page) => (
                          <tr key={page.page} className="hover:bg-slate-900/60">
                            <td className="py-2 px-3 font-bold text-blue-400">Pág. {page.page}</td>
                            <td className="py-2 px-3">{page.words.toLocaleString()}</td>
                            <td className="py-2 px-3 font-semibold text-emerald-400">
                              {page.charactersWithoutSpaces?.toLocaleString() || 0}
                            </td>
                            <td className="py-2 px-3">{page.charactersWithSpaces?.toLocaleString() || 0}</td>
                            <td className="py-2 px-3">{page.lines || '---'}</td>
                            <td className="py-2 px-3 font-bold text-white">
                              {Math.ceil((page.charactersWithoutSpaces || 1) / 1000)} lauda(s)
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2 px-3 font-bold text-blue-400">Pág. 1</td>
                          <td className="py-2 px-3">{doc.originalWordCount?.words?.toLocaleString() || 0}</td>
                          <td className="py-2 px-3 font-semibold text-emerald-400">
                            {doc.originalWordCount?.charactersWithoutSpaces?.toLocaleString() || 0}
                          </td>
                          <td className="py-2 px-3">{doc.originalWordCount?.charactersWithSpaces?.toLocaleString() || 0}</td>
                          <td className="py-2 px-3">{doc.originalWordCount?.lines || 1}</td>
                          <td className="py-2 px-3 font-bold text-white">
                            {doc.originalWordCount?.laudasJuramentadas || 1} lauda(s)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legal Notes Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Fundamentação Normativa:</p>
                <p>
                  1. A <strong>Lauda Juramentada Oficial</strong> é o padrão estabelecido pelas Juntas Comerciais do Brasil (JUCESP, JUCERJA, JUCEMG) e pela Sintra, calculada por cada bloco de até 1.000 caracteres sem espaços ou fração.
                </p>
                <p>
                  2. Toda fração de lauda é tarifada como uma lauda inteira no faturamento juramentado oficial.
                </p>
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
                      <button
                        type="button"
                        onClick={() => handleDownloadVersion(ver)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar Versão
                      </button>
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
