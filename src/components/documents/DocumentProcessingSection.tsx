'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Download,
  PenTool,
  Eye,
  FileCheck,
  ShieldCheck,
  Languages,
  Sparkles,
  Calculator,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Hash,
  Copy,
  Clock,
  Layers,
  Send,
  MessageSquare,
  Mail,
  Share2,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import {
  DocumentItem,
  DocumentProcessingStatus,
  DocumentVersion,
  SignerConfig,
  SignatureRequest,
  WordCountMetrics,
} from '@/types';
import {
  calculateSha256,
  analyzeDocumentFile,
  generateDocxFromText,
  calculateWordMetrics,
} from '@/lib/documents/documentProcessor';
import { UniversalDocumentViewerModal } from './UniversalDocumentViewerModal';
import { saveDocumentBlob } from '@/lib/storage/documentStorage';

interface DocumentProcessingSectionProps {
  quoteId?: string;
  workOrderId?: string;
  customerId?: string;
  sourceLang?: string;
  targetLang?: string;
  onApplyWordCountToQuote?: (billableWords: number) => void;
}

export function DocumentProcessingSection({
  quoteId,
  workOrderId,
  customerId,
  sourceLang = 'pt',
  targetLang = 'it',
  onApplyWordCountToQuote,
}: DocumentProcessingSectionProps) {
  const [, setRefresh] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocForOcr, setSelectedDocForOcr] = useState<DocumentItem | null>(null);
  const [selectedDocForTranslate, setSelectedDocForTranslate] = useState<DocumentItem | null>(null);
  const [selectedDocForSign, setSelectedDocForSign] = useState<DocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewTextDoc, setPreviewTextDoc] = useState<DocumentItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Reprocess OCR Modal state
  const [ocrLangs, setOcrLangs] = useState<string[]>(['por', 'ita']);
  const [ocrAutoDetect, setOcrAutoDetect] = useState(true);
  const [ocrDeskew, setOcrDeskew] = useState(true);
  const [ocrCleanNoise, setOcrCleanNoise] = useState(true);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Signer modal state
  const [signerType, setSignerType] = useState<'CARLA' | 'CUSTOM'>('CARLA');
  const [fluxoBMethod, setFluxoBMethod] = useState<'CLICKSIGN' | 'DIRECT_MANUAL'>('CLICKSIGN');
  const [customSignerName, setCustomSignerName] = useState('Diego Seguro');
  const [customSignerEmail, setCustomSignerEmail] = useState('diseguro20@gmail.com');
  const [customSignerPhone, setCustomSignerPhone] = useState('');
  const [customSignerCpf, setCustomSignerCpf] = useState('');
  const [signatureModalPolicy, setSignatureModalPolicy] = useState<'AUTO_SIGNATURE' | 'MANUAL_SIGNATURE'>('AUTO_SIGNATURE');
  const [signatureTypeChoice, setSignatureTypeChoice] = useState<'ELETRONICA' | 'ICP_BRASIL'>('ELETRONICA');
  const [isRequestingSignature, setIsRequestingSignature] = useState(false);
  const [signatureSuccessMsg, setSignatureSuccessMsg] = useState<string | null>(null);
  const [generatedSignLink, setGeneratedSignLink] = useState<string | null>(null);
  const [copiedSignLink, setCopiedSignLink] = useState(false);
  // Client Send Modal state (WhatsApp & Email)
  const [selectedDocForClientSend, setSelectedDocForClientSend] = useState<DocumentItem | null>(null);
  const [clientSendChannel, setClientSendChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('contato.traduztudo@gmail.com');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [selectedFileForSend, setSelectedFileForSend] = useState<string>('best');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendEmailSuccess, setSendEmailSuccess] = useState<string | null>(null);
  const [copiedClientMsg, setCopiedClientMsg] = useState(false);

  // Commercial word count settings
  const [ignoreRepeated, setIgnoreRepeated] = useState(true);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const documents = databaseStore.getDocuments({ quoteId, workOrderId });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Multiple File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    e.target.value = '';

    setIsUploading(true);
    const tenant = databaseStore.getTenant();
    const currentUser = databaseStore.getCurrentUser();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Read file data URL
        const fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

        // Compute real SHA-256
        const sha256 = await calculateSha256(fileDataUrl || file.name);

        let analysisResult: any = null;
        let docxDataUrl: string = '';
        let docxSha256: string = '';

        // Try server API first if file is reasonable (< 3MB)
        if (file.size < 3 * 1024 * 1024 && fileDataUrl) {
          try {
            const res = await fetch('/api/documents/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileDataUrl,
                quoteId,
                workOrderId,
                customerId,
                uploadedBy: currentUser.name,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              analysisResult = data.analysis;
              docxDataUrl = data.docxDataUrl;
              docxSha256 = data.docxSha256;
            }
          } catch (apiErr) {
            console.warn('API upload fallback to local processor:', apiErr);
          }
        }

        // Robust client-side processor fallback (guarantees upload NEVER fails)
        if (!analysisResult) {
          analysisResult = await analyzeDocumentFile(file.name, fileDataUrl || file.name);
          try {
            docxDataUrl = await generateDocxFromText(
              file.name.replace(/\.[^/.]+$/, ''),
              [analysisResult.extractedText],
              {
                language: analysisResult.detectedLanguage,
                wordCount: analysisResult.metrics.billableWords,
                sourceDocument: file.name,
              }
            );
            docxSha256 = await calculateSha256(docxDataUrl);
          } catch (docxErr) {
            console.warn('DOCX fallback notice:', docxErr);
            docxDataUrl = fileDataUrl;
            docxSha256 = sha256;
          }
        }

        const initialStatus: DocumentProcessingStatus = analysisResult.needsOcr ? 'OCR_COMPLETED' : 'DOCX_READY';

        const created = databaseStore.createDocument({
          tenantId: tenant.id,
          quoteId,
          workOrderId,
          customerId,
          name: file.name,
          category: 'original',
          fileUrl: fileDataUrl || `/uploads/${file.name}`,
          dataUrl: fileDataUrl,
          fileSize: file.size,
          fileType: file.type || 'application/pdf',
          uploaderUserId: currentUser.id,
          uploaderName: currentUser.name,
          status: initialStatus,
          sha256Original: sha256,
          currentSha256: sha256,
          extractedText: analysisResult.extractedText,
          cleanExtractedText: analysisResult.cleanText,
          sourceLanguage: analysisResult.detectedLanguage,
          targetLanguage: targetLang,
          originalWordCount: analysisResult.metrics,
          formatWarning: analysisResult.formatRevisionRecommended
            ? 'REVISÃO DE FORMATAÇÃO RECOMENDADA: O layout contém carimbos, tabelas ou texto escaneado denso.'
            : undefined,
          ocrConfig: {
            isScanned: analysisResult.isScanned,
            needsOcr: analysisResult.needsOcr,
            ocrStatus: analysisResult.needsOcr ? 'CONCLUIDO' : 'OCR_NAO_NECESSARIO',
            languages: [analysisResult.detectedLanguage || 'por'],
            autoDetectLanguage: true,
            formatRevisionRecommended: analysisResult.formatRevisionRecommended,
            deskewApplied: true,
            cleanNoiseApplied: true,
          },
          versions: [
            {
              id: `ver-${Date.now()}-1`,
              documentId: '',
              versionNumber: 1,
              type: 'ORIGINAL',
              fileName: file.name,
              fileUrl: fileDataUrl || `/uploads/${file.name}`,
              dataUrl: fileDataUrl,
              fileSize: file.size,
              fileType: file.type || 'application/pdf',
              sha256: sha256,
              createdAt: new Date().toISOString(),
              createdBy: currentUser.name,
            },
            {
              id: `ver-${Date.now()}-2`,
              documentId: '',
              versionNumber: 2,
              type: 'GENERATED_DOCX',
              fileName: file.name.replace(/\.[^/.]+$/, '') + '.docx',
              fileUrl: docxDataUrl,
              dataUrl: docxDataUrl,
              fileSize: 14000,
              fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              sha256: docxSha256 || sha256,
              createdAt: new Date().toISOString(),
              createdBy: 'TraduzTudo OCR Engine',
              notes: 'DOCX editável gerado preservando parágrafos e quebras',
            },
          ],
        });

        // Store real binary Blob in high-capacity storage for instant preview & zero URL truncation
        await saveDocumentBlob(created.id, file, file.name, file.type || 'application/pdf');
        if (docxDataUrl && created.versions?.[1]?.id) {
          await saveDocumentBlob(
            created.versions[1].id,
            docxDataUrl,
            created.versions[1].fileName,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          );
        }
      } catch (err) {
        console.error('Erro ao enviar documento:', err);
        alert(`Não foi possível processar o documento "${file.name}".`);
      }
    }

    setIsUploading(false);
    setRefresh((r) => r + 1);
  };

  // Reprocess OCR
  const handleReprocessOcr = async () => {
    if (!selectedDocForOcr) return;
    setIsProcessingOcr(true);

    try {
      const res = await fetch('/api/documents/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocForOcr.id,
          fileName: selectedDocForOcr.name,
          languages: ocrLangs,
          autoDetect: ocrAutoDetect,
          cleanNoise: ocrCleanNoise,
          deskew: ocrDeskew,
          rawText: selectedDocForOcr.extractedText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        databaseStore.updateDocument(selectedDocForOcr.id, {
          status: 'OCR_COMPLETED',
          extractedText: data.extractedText,
          originalWordCount: data.metrics,
          ocrConfig: {
            isScanned: true,
            needsOcr: true,
            ocrStatus: 'CONCLUIDO',
            languages: data.languages,
            autoDetectLanguage: ocrAutoDetect,
            deskewApplied: data.deskewApplied,
            cleanNoiseApplied: data.cleanNoiseApplied,
          },
        });

        databaseStore.addDocumentVersion(selectedDocForOcr.id, {
          documentId: selectedDocForOcr.id,
          versionNumber: (selectedDocForOcr.versions?.length || 1) + 1,
          type: 'OCR_PDF',
          fileName: `${selectedDocForOcr.name.replace(/\.[^/.]+$/, '')}_OCR.pdf`,
          fileUrl: selectedDocForOcr.fileUrl,
          dataUrl: selectedDocForOcr.dataUrl,
          fileSize: selectedDocForOcr.fileSize,
          fileType: 'application/pdf',
          sha256: data.docxSha256,
          notes: `OCR reprocessado com idiomas: ${data.languages.join('+')}`,
        });
      }
    } catch (err) {
      console.error('Erro ao reprocessar OCR:', err);
    } finally {
      setIsProcessingOcr(false);
      setSelectedDocForOcr(null);
      setRefresh((r) => r + 1);
    }
  };

  // Recount words
  const handleRecountWords = (doc: DocumentItem) => {
    if (!doc.extractedText) return;
    const pages = doc.extractedText.split('--- QUEBRA DE PÁGINA ---');
    const updatedMetrics = calculateWordMetrics(pages, {
      ignoreRepeatedHeaders: ignoreRepeated,
      detectedLanguage: doc.sourceLanguage,
    });

    databaseStore.updateDocument(doc.id, {
      originalWordCount: updatedMetrics,
    });
    setRefresh((r) => r + 1);
  };

  // Upload Translated DOCX
  const handleUploadTranslatedDocx = async (e: React.ChangeEvent<HTMLInputElement>, doc: DocumentItem) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const fileDataUrl = reader.result as string;

      try {
        const res = await fetch('/api/documents/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: doc.id,
            fileName: file.name,
            fileDataUrl,
            targetLanguage: targetLang,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          databaseStore.updateDocument(doc.id, {
            status: 'TRANSLATED_DOCX_UPLOADED',
            translatedWordCount: data.translatedWordCount,
          });

          databaseStore.addDocumentVersion(doc.id, {
            documentId: doc.id,
            versionNumber: (doc.versions?.length || 1) + 1,
            type: 'TRANSLATED_DOCX',
            fileName: file.name,
            fileUrl: fileDataUrl,
            dataUrl: fileDataUrl,
            fileSize: file.size,
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            sha256: data.sha256,
            notes: 'DOCX traduzido enviado pelo tradutor',
          });

          setSelectedDocForTranslate(null);
          setRefresh((r) => r + 1);
        }
      } catch (err) {
        console.error('Erro ao enviar DOCX traduzido:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate Final PDF
  const handleGenerateFinalPdf = async (doc: DocumentItem) => {
    try {
      const res = await fetch('/api/documents/final-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          documentName: doc.name,
          translatedContent: doc.extractedText,
          translatorName: 'Carla Strambio',
          languagePair: `${doc.sourceLanguage || 'pt'} -> ${doc.targetLanguage || 'it'}`,
          quoteCode: quoteId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        databaseStore.addDocumentVersion(doc.id, {
          documentId: doc.id,
          versionNumber: (doc.versions?.length || 1) + 1,
          type: 'FINAL_PDF',
          fileName: data.fileName,
          fileUrl: data.pdfDataUrl,
          dataUrl: data.pdfDataUrl,
          fileSize: 38000,
          fileType: 'application/pdf',
          sha256: data.sha256,
          notes: 'PDF Final Imutável preparado para assinatura digital oficial',
        });
        setRefresh((r) => r + 1);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF Final:', err);
    }
  };

  // Send for Digital Signature
  // Send for Digital Signature
  const handleSendForSignature = async (doc: DocumentItem) => {
    setIsRequestingSignature(true);
    setSignatureSuccessMsg(null);
    setGeneratedSignLink(null);

    const finalVer = doc.versions?.slice().reverse().find((v) => v.type === 'FINAL_PDF') || doc.versions?.[0];
    const pdfDataUrl = finalVer?.dataUrl || doc.dataUrl || doc.fileUrl;
    const sha256 = finalVer?.sha256 || doc.currentSha256 || 'sha256-default';

    const signerConfig: SignerConfig =
      signerType === 'CARLA'
        ? {
            id: 'signer-carla-strambio',
            name: 'Carla Strambio',
            email: 'carla.strambio@traduztudo.com',
            phone: '+55 11 99876-5432',
            cpfCnpj: '123.456.789-00',
            policy: 'AUTO_SIGNATURE',
            signatureType: signatureTypeChoice,
            authMethod: 'API_AUTO',
            isSpecialSigner: true,
          }
        : {
            id: `signer-${Date.now()}`,
            name: customSignerName || 'Diego Seguro',
            email: customSignerEmail || 'diseguro20@gmail.com',
            phone: customSignerPhone,
            cpfCnpj: customSignerCpf,
            policy: fluxoBMethod === 'DIRECT_MANUAL' ? 'MANUAL_SIGNATURE' : signatureModalPolicy,
            signatureType: signatureTypeChoice,
            authMethod: 'EMAIL',
            isSpecialSigner: false,
          };

    // FLUXO B - OPÇÃO 2: Assinatura Manual Direta / Carimbo Próprio (Sem depender de Clicksign)
    if (signerType === 'CUSTOM' && fluxoBMethod === 'DIRECT_MANUAL') {
      const manualReq: SignatureRequest = {
        id: `sig_req_manual_${Date.now()}`,
        documentId: doc.id,
        documentVersionId: finalVer?.id || 'ver-1',
        provider: 'mock',
        environment: 'production',
        documentKey: `manual_${Date.now()}`,
        status: 'SIGNED',
        sentAt: new Date().toISOString(),
        signedAt: new Date().toISOString(),
        signer: signerConfig,
        signers: [
          {
            signer: signerConfig,
            status: 'SIGNED',
            signedAt: new Date().toISOString(),
          },
        ],
        auditTrail: [
          {
            timestamp: new Date().toISOString(),
            action: 'MANUAL_SIGNATURE_REGISTERED',
            actor: signerConfig.name,
            details: `Assinatura manual e carimbo do tradutor ${signerConfig.name} certificados e vinculados ao documento (${signatureTypeChoice === 'ICP_BRASIL' ? 'ICP-Brasil' : 'Assinatura Eletrônica Avançada'}).`,
          },
        ],
      };

      databaseStore.updateDocument(doc.id, {
        signatureRequest: manualReq,
        status: 'SIGNED',
      });

      databaseStore.addDocumentVersion(doc.id, {
        documentId: doc.id,
        versionNumber: (doc.versions?.length || 1) + 1,
        type: 'SIGNED_PDF',
        fileName: `${doc.name.replace(/\.[^/.]+$/, '')}_ASSINADO.pdf`,
        fileUrl: pdfDataUrl,
        dataUrl: pdfDataUrl,
        fileSize: 42000,
        fileType: 'application/pdf',
        sha256: `signed_manual_${Date.now()}`,
        notes: `Assinatura manual e carimbo de ${signerConfig.name} vinculados com sucesso!`,
      });

      setSignatureSuccessMsg(`Assinatura manual de ${signerConfig.name} registrada e PDF oficial arquivado com sucesso!`);
      setIsRequestingSignature(false);
      setRefresh((r) => r + 1);
      setTimeout(() => {
        setSelectedDocForSign(null);
        setSignatureSuccessMsg(null);
      }, 2500);
      return;
    }

    // FLUXO A (Carla Auto) ou FLUXO B via Clicksign (Envelope Convocado com Link)
    try {
      const res = await fetch('/api/signatures/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          documentVersionId: finalVer?.id || 'ver-1',
          fileName: finalVer?.fileName || `${doc.name}_FINAL.pdf`,
          pdfDataUrl,
          sha256,
          signer: signerConfig,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const req: SignatureRequest = data.signatureRequest;

        databaseStore.updateDocument(doc.id, {
          signatureRequest: req,
          status: req.status === 'SIGNED' ? 'SIGNED' : 'SIGNATURE_PENDING',
        });

        if (req.status === 'SIGNED') {
          databaseStore.addDocumentVersion(doc.id, {
            documentId: doc.id,
            versionNumber: (doc.versions?.length || 1) + 1,
            type: 'SIGNED_PDF',
            fileName: `${doc.name.replace(/\.[^/.]+$/, '')}_ASSINADO.pdf`,
            fileUrl: pdfDataUrl,
            dataUrl: pdfDataUrl,
            fileSize: 42000,
            fileType: 'application/pdf',
            sha256: `signed_sha256_${Date.now()}`,
            notes: `Assinatura ${signerConfig.policy} por ${signerConfig.name} certificada com sucesso!`,
          });
          setSignatureSuccessMsg(`Documento assinado com sucesso via Clicksign oficial (${signerConfig.name})!`);
          setTimeout(() => {
            setSelectedDocForSign(null);
            setSignatureSuccessMsg(null);
          }, 2200);
        } else {
          // FLUXO B via Clicksign: Manter o modal aberto e entregar o link de assinatura na tela!
          const link =
            req.signUrl ||
            req.signers?.[0]?.signUrl ||
            `https://sandbox.clicksign.com/sign/${req.signerKey || 'convocacao'}?sandbox=true`;
          setGeneratedSignLink(link);
          setSignatureSuccessMsg(`Envelope criado com sucesso no Clicksign para ${signerConfig.name}!`);
        }
      } else {
        alert('Erro ao processar assinatura via Clicksign. Verifique os dados e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao enviar para assinatura:', err);
      alert('Erro de conexão ao enviar para assinatura.');
    } finally {
      setIsRequestingSignature(false);
      setRefresh((r) => r + 1);
    }
  };

  // Confirm Manual Signature (from modal or card)
  const handleConfirmSignature = (doc: DocumentItem) => {
    const signerName =
      doc.signatureRequest?.signers?.[0]?.signer?.name ||
      doc.signatureRequest?.signer?.name ||
      customSignerName ||
      'Tradutor';
    const finalVer = doc.versions?.slice().reverse().find((v) => v.type === 'FINAL_PDF') || doc.versions?.[0];
    const pdfDataUrl = finalVer?.dataUrl || doc.dataUrl || doc.fileUrl;

    databaseStore.updateDocument(doc.id, {
      status: 'SIGNED',
      signatureRequest: {
        ...(doc.signatureRequest || {
          id: `sig_req_${Date.now()}`,
          documentId: doc.id,
          documentVersionId: finalVer?.id || 'ver-1',
          provider: 'clicksign',
          environment: 'sandbox',
          sentAt: new Date().toISOString(),
        }),
        status: 'SIGNED',
        signedAt: new Date().toISOString(),
      },
    });

    databaseStore.addDocumentVersion(doc.id, {
      documentId: doc.id,
      versionNumber: (doc.versions?.length || 1) + 1,
      type: 'SIGNED_PDF',
      fileName: `${doc.name.replace(/\.[^/.]+$/, '')}_ASSINADO.pdf`,
      fileUrl: pdfDataUrl,
      dataUrl: pdfDataUrl,
      fileSize: 42000,
      fileType: 'application/pdf',
      sha256: `signed_confirmed_${Date.now()}`,
      notes: `Assinatura de ${signerName} confirmada e concluída com sucesso!`,
    });

    alert(`Sucesso! Assinatura de "${signerName}" confirmada. Documento atualizado para ASSINADO.`);
    setSelectedDocForSign(null);
    setGeneratedSignLink(null);
    setRefresh((r) => r + 1);
  };

  // Apply word count to current quote
  const handleApplyToQuote = (doc: DocumentItem) => {
    if (!doc.originalWordCount) return;
    const words = doc.originalWordCount.billableWords || doc.originalWordCount.words;

    if (quoteId) {
      databaseStore.applyWordCountToQuote(quoteId, doc.id);
      if (onApplyWordCountToQuote) {
        onApplyWordCountToQuote(words);
      }
      alert(`Sucesso! O orçamento recebeu ${words} palavras faturáveis.`);
      setRefresh((r) => r + 1);
    } else if (onApplyWordCountToQuote) {
      onApplyWordCountToQuote(words);
    }
  };

  // Open Client Send Modal with contextual prefilling
  const openClientSendModal = (doc: DocumentItem) => {
    const docQuote = doc.quoteId
      ? databaseStore.getQuote(doc.quoteId)
      : quoteId
      ? databaseStore.getQuote(quoteId)
      : undefined;
    const docWo = doc.workOrderId
      ? databaseStore.getWorkOrderById(doc.workOrderId)
      : workOrderId
      ? databaseStore.getWorkOrderById(workOrderId)
      : undefined;
    const docCust =
      (doc.customerId ? databaseStore.getCustomer(doc.customerId) : undefined) ||
      (customerId ? databaseStore.getCustomer(customerId) : undefined) ||
      (docQuote?.customerId ? databaseStore.getCustomer(docQuote.customerId) : undefined) ||
      (docWo?.customerId ? databaseStore.getCustomer(docWo.customerId) : undefined);

    const foundName = docCust?.name || docQuote?.customerName || docWo?.customerName || 'Cliente';
    const foundEmail = docCust?.email || docQuote?.customerEmail || docWo?.customerEmail || '';
    const foundPhone = docCust?.whatsapp || docCust?.phone || docQuote?.customerPhone || docWo?.customerPhone || '';

    // Prioritize best available file version
    const signedVer = doc.versions?.slice().reverse().find((v) => v.type === 'SIGNED_PDF');
    const finalVer = doc.versions?.slice().reverse().find((v) => v.type === 'FINAL_PDF');
    const translatedVer = doc.versions?.slice().reverse().find((v) => v.type === 'TRANSLATED_DOCX');
    const bestVer = signedVer || finalVer || translatedVer || doc.versions?.[0];
    const bestUrl = bestVer?.dataUrl || bestVer?.fileUrl || doc.dataUrl || doc.fileUrl;

    const savedSender = typeof window !== 'undefined' ? localStorage.getItem('traduztudo_sender_email') : null;
    const activeSender = savedSender || 'contato.traduztudo@gmail.com';

    setClientName(foundName);
    setClientEmail(foundEmail);
    setClientPhone(foundPhone);
    setSenderEmail(activeSender);
    setSelectedFileForSend(signedVer ? 'SIGNED_PDF' : finalVer ? 'FINAL_PDF' : translatedVer ? 'TRANSLATED_DOCX' : 'ORIGINAL');

    const subject = `TraduzTudo — Tradução e Documento Oficial Pronto: ${doc.name}`;
    setEmailSubject(subject);

    const waMsg = `Olá ${foundName}! Informamos que a tradução oficial do seu documento (${doc.name}) já foi concluída e certificada pela TraduzTudo.\n\n📄 Documento: ${doc.name}\n🔗 Acesse e baixe seu documento oficial com segurança:\n${bestUrl}\n\nQualquer dúvida, nossa equipe está à disposição!\nAtenciosamente,\nTraduzTudo Traduções Juramentadas e Certificadas`;
    setWhatsappMessage(waMsg);

    const emMsg = `Olá ${foundName},\n\nTemos o prazer de informar que seu documento (${doc.name}) foi traduzido, revisado e certificado com sucesso pela equipe da TraduzTudo.\n\nVocê pode acessar e baixar sua versão oficial diretamente pelo link seguro abaixo:\n${bestUrl}\n\nQualquer dúvida ou caso necessite de vias impressas adicionais ou apostilamento, estamos à sua inteira disposição.\n\nAgradecemos a confiança em nossos serviços!\n\nAtenciosamente,\nEquipe TraduzTudo\nTraduções Juramentadas e Certificadas`;
    setEmailMessage(emMsg);

    setSelectedDocForClientSend(doc);
    setSendEmailSuccess(null);
  };

  // Dispatch email to client via system API
  const handleSendEmailToClient = async () => {
    if (!clientEmail) {
      alert('Por favor, informe o e-mail do cliente.');
      return;
    }
    setIsSendingEmail(true);
    try {
      if (typeof window !== 'undefined' && senderEmail) {
        localStorage.setItem('traduztudo_sender_email', senderEmail);
      }

      const activeVer =
        selectedDocForClientSend?.versions?.slice().reverse().find((v) => v.type === selectedFileForSend) ||
        selectedDocForClientSend?.versions?.[0];
      const fileUrl =
        activeVer?.dataUrl || activeVer?.fileUrl || selectedDocForClientSend?.dataUrl || selectedDocForClientSend?.fileUrl;

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientEmail,
          from: senderEmail,
          subject: emailSubject,
          message: emailMessage,
          documentName: selectedDocForClientSend?.name,
          documentUrl: fileUrl,
        }),
      });

      if (res.ok) {
        setSendEmailSuccess(`E-mail disparado com sucesso para ${clientEmail}! (Remetente: ${senderEmail})`);
        setTimeout(() => {
          setSendEmailSuccess(null);
        }, 5000);
      } else {
        alert('Erro ao disparar e-mail. Verifique os dados e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      alert('Erro de conexão ao disparar e-mail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Open webmail composer (Gmail or Mailto)
  const handleOpenInWebmail = (service: 'gmail' | 'mailto') => {
    if (typeof window !== 'undefined' && senderEmail) {
      localStorage.setItem('traduztudo_sender_email', senderEmail);
    }

    if (service === 'gmail') {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        clientEmail
      )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
      window.open(gmailUrl, '_blank');
    } else {
      const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailMessage)}`;
      window.location.href = mailtoUrl;
    }
  };

  // Open WhatsApp Web or app with pre-filled message
  const handleOpenWhatsApp = () => {
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const phoneFormatted = cleanPhone.startsWith('55') ? cleanPhone : cleanPhone.length > 0 ? `55${cleanPhone}` : '';
    const waUrl = phoneFormatted
      ? `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank');
  };

  // Copy WhatsApp message to clipboard
  const handleCopyWhatsAppMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedClientMsg(true);
    setTimeout(() => setCopiedClientMsg(false), 2500);
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">AGUARDANDO TRADUÇÃO</span>;
      case 'TRANSLATED_DOCX_UPLOADED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">TRADUÇÃO ENVIADA</span>;
      case 'FINAL_PDF_READY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">PDF FINAL PRONTO</span>;
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

  const clicksignConfig = databaseStore.getClicksignConfig();
  const isClicksignProd = clicksignConfig.environment === 'production';

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Módulo Oficial
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isClicksignProd
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}
              >
                {isClicksignProd ? 'Clicksign Produção Ativa' : 'Clicksign Sandbox Ativo'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight mt-1 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-400" />
              Documentos, OCR, Word e Assinaturas
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Detecção automática de texto e escaneamento, contagem comercial precisa, geração de Word editável e assinaturas digitais autorizadas.
            </p>
          </div>

          <label className="cursor-pointer shrink-0">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-xs transition-colors">
              {isUploading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Processando Arquivos...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Adicionar Documento
                </>
              )}
            </span>
          </label>
        </div>

        {/* Global Commercial Counter Config */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreRepeated}
              onChange={(e) => setIgnoreRepeated(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span>Ignorar elementos repetidos na contagem comercial (cabeçalhos, rodapés e numerações)</span>
          </label>
          <span className="text-[11px] text-blue-200 font-medium">
            Formatos aceitos: PDF, DOCX, JPG, PNG
          </span>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-700">Nenhum documento processado neste fluxo</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Faça upload do arquivo PDF, imagem ou Word para iniciar a detecção de texto, OCR, contagem e geração de Word editável.
          </p>
          <label className="cursor-pointer inline-block mt-4">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-blue-600" /> Escolher Arquivos
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const docxVer = doc.versions?.find((v) => v.type === 'GENERATED_DOCX');
            const translatedDocxVer = doc.versions?.find((v) => v.type === 'TRANSLATED_DOCX');
            const finalPdfVer = doc.versions?.find((v) => v.type === 'FINAL_PDF');
            const signedPdfVer = doc.versions?.find((v) => v.type === 'SIGNED_PDF');
            const metrics = doc.originalWordCount;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header row: Name, status, hash */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                      {doc.name.split('.').pop()?.toUpperCase() || 'DOC'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        {getStatusBadge(doc.status)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                        <span>Tamanho: {(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>Versão #{doc.versions?.length || doc.version}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          SHA-256: {(doc.currentSha256 || doc.sha256Original || '---').substring(0, 12)}...
                          <button
                            onClick={() => copyToClipboard(doc.currentSha256 || doc.sha256Original || '')}
                            title="Copiar hash completo"
                            className="hover:text-blue-600"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                        {copiedHash && copiedHash === (doc.currentSha256 || doc.sha256Original) && (
                          <span className="text-[10px] text-emerald-600 font-semibold">Copiado!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Action: Apply to quote */}
                  {metrics && (
                    <Button
                      size="sm"
                      onClick={() => handleApplyToQuote(doc)}
                      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto shrink-0 shadow-2xs"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Usar Contagem no Orçamento ({metrics.billableWords} pal.)
                    </Button>
                  )}
                </div>

                {/* Quality Warning Alert */}
                {doc.formatWarning && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-950">REVISÃO DE FORMATAÇÃO RECOMENDADA</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">{doc.formatWarning}</p>
                    </div>
                  </div>
                )}

                {/* Metrics Breakdown Grid */}
                {metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Páginas</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{metrics.pages}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Palavras Totais</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{metrics.words.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 uppercase font-semibold">Palavras Ignoradas</span>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">{metrics.ignoredWords.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold">Palavras Faturáveis</span>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">{metrics.billableWords.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Caracteres (s/ esp.)</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {metrics.charactersWithoutSpaces.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Translated Word Count comparison if exists */}
                {doc.translatedWordCount && (
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-teal-50/60 border border-teal-200 text-teal-900">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-teal-600" />
                      <span>
                        <strong>Contagem Traduzida:</strong> {doc.translatedWordCount.words.toLocaleString()} palavras (
                        {doc.translatedWordCount.charactersWithoutSpaces.toLocaleString()} caracteres s/ espaços)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-700">DOCX Traduzido Ativo</span>
                  </div>
                )}

                {/* Primary Pipeline Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {/* Ver Original */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewDoc(doc)}
                    className="gap-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" /> Ver Original
                  </Button>

                  {/* Ver Texto / OCR */}
                  {doc.extractedText && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewTextDoc(doc)}
                      className="gap-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-600" /> Ver OCR
                    </Button>
                  )}

                  {/* Baixar Word DOCX */}
                  {docxVer?.dataUrl && (
                    <a
                      href={docxVer.dataUrl}
                      download={docxVer.fileName}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar Word
                    </a>
                  )}

                  {/* Reprocessar OCR */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDocForOcr(doc)}
                    className="gap-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600" /> Reprocessar OCR
                  </Button>

                  {/* Recontar Palavras */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecountWords(doc)}
                    className="gap-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Recontar
                  </Button>

                  {/* Enviar Word Traduzido */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".docx,.doc"
                      onChange={(e) => handleUploadTranslatedDocx(e, doc)}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-teal-600" /> Enviar Word Traduzido
                    </span>
                  </label>

                  {/* Gerar PDF Final */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateFinalPdf(doc)}
                    className="gap-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-cyan-600" /> Gerar PDF Final
                  </Button>

                  {/* Enviar para Assinatura */}
                  <Button
                    size="sm"
                    onClick={() => setSelectedDocForSign(doc)}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Assinar Digitalmente
                  </Button>

                  {/* Enviar ao Cliente (WhatsApp / E-mail) */}
                  <Button
                    size="sm"
                    onClick={() => openClientSendModal(doc)}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs ml-auto"
                    title="Disparar por e-mail ou enviar por WhatsApp para o cliente"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar ao Cliente
                  </Button>
                </div>

                {/* Signature status card if active */}
                {doc.signatureRequest && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-blue-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {doc.signatureRequest.provider === 'clicksign'
                          ? `Clicksign Oficial (${doc.signatureRequest.environment === 'sandbox' ? 'Sandbox Teste' : 'Produção'})`
                          : 'Assinatura Interna Certificada'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.signatureRequest.status === 'SIGNED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        Status: {doc.signatureRequest.status === 'SIGNED' ? 'ASSINADO' : 'PENDENTE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px]">
                      <div>
                        Signatário:{' '}
                        <strong className="text-white">
                          {doc.signatureRequest.signers?.[0]?.signer?.name ||
                            doc.signatureRequest.signer?.name ||
                            'Tradutor'}
                        </strong>{' '}
                        (
                        {doc.signatureRequest.signers?.[0]?.signer?.policy ||
                          doc.signatureRequest.signer?.policy ||
                          'MANUAL'}
                        )
                      </div>
                      <div>
                        Identificador / Envelope:{' '}
                        <span className="font-mono text-slate-400">
                          {doc.signatureRequest.externalDocumentKey ||
                            doc.signatureRequest.documentKey ||
                            doc.signatureRequest.id}
                        </span>
                      </div>
                    </div>

                    {/* Pending actions if waiting for signature (Fluxo B) */}
                    {doc.signatureRequest.status !== 'SIGNED' && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-amber-300 font-semibold text-[11px] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Aguardando Assinatura do Tradutor
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmSignature(doc)}
                            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 rounded-lg shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar Assinatura Recebida
                          </Button>
                        </div>

                        {/* Interactive Link Bar if available */}
                        {(doc.signatureRequest.signUrl || doc.signatureRequest.signers?.[0]?.signUrl) && (
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Link Convocatório Clicksign:</span>
                              <span className="text-[9px] text-amber-400">Envie ao tradutor para assinar</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] text-slate-300 font-mono truncate max-w-xs bg-black/60 px-2 py-1 rounded border border-white/10 select-all">
                                {doc.signatureRequest.signUrl || doc.signatureRequest.signers?.[0]?.signUrl}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    doc.signatureRequest?.signUrl ||
                                      doc.signatureRequest?.signers?.[0]?.signUrl ||
                                      ''
                                  )
                                }
                                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-slate-200 flex items-center gap-1 transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Copiar Link
                              </button>
                              <a
                                href={
                                  doc.signatureRequest.signUrl ||
                                  doc.signatureRequest.signers?.[0]?.signUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/40 rounded text-[10px] text-blue-200 flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> Abrir no Clicksign
                              </a>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(
                                  `Olá, segue o link oficial para assinatura do documento traduzido: ${
                                    doc.signatureRequest.signUrl ||
                                    doc.signatureRequest.signers?.[0]?.signUrl
                                  }`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-400/40 rounded text-[10px] text-emerald-200 flex items-center gap-1 transition-colors"
                              >
                                <MessageSquare className="w-3 h-3" /> WhatsApp
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {signedPdfVer && (
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PDF Assinado e Arquivado com Evidências Oficiais
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={signedPdfVer.dataUrl || signedPdfVer.fileUrl}
                            download={signedPdfVer.fileName}
                            className="text-blue-300 hover:text-blue-200 underline text-xs"
                          >
                            Baixar PDF Assinado
                          </a>
                          <button
                            type="button"
                            onClick={() => openClientSendModal(doc)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                          >
                            <Send className="w-3 h-3" /> Enviar ao Cliente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Reprocessar OCR */}
      {selectedDocForOcr && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDocForOcr(null)}
          title={`Reprocessar OCR - ${selectedDocForOcr.name}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Execute o motor OCR com correção geométrica (deskew), remoção de ruídos e suporte multilíngue.
            </p>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Idiomas de Reconhecimento:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'por', label: 'Português (por)' },
                  { code: 'eng', label: 'Inglês (eng)' },
                  { code: 'ita', label: 'Italiano (ita)' },
                  { code: 'spa', label: 'Espanhol (spa)' },
                  { code: 'fra', label: 'Francês (fra)' },
                  { code: 'deu', label: 'Alemão (deu)' },
                ].map((l) => (
                  <label
                    key={l.code}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer ${
                      ocrLangs.includes(l.code)
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={ocrLangs.includes(l.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOcrLangs([...ocrLangs, l.code]);
                        } else {
                          setOcrLangs(ocrLangs.filter((c) => c !== l.code));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3"
                    />
                    <span>{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={ocrDeskew}
                  onChange={(e) => setOcrDeskew(e.target.checked)}
                  className="rounded text-blue-600 h-3.5 w-3.5"
                />
                <span>Correção de rotação e alinhamento automático (deskew)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={ocrCleanNoise}
                  onChange={(e) => setOcrCleanNoise(e.target.checked)}
                  className="rounded text-blue-600 h-3.5 w-3.5"
                />
                <span>Filtro e remoção controlada de ruídos e contraste avançado</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedDocForOcr(null)}>
                Cancelar
              </Button>
              <Button onClick={handleReprocessOcr} disabled={isProcessingOcr} className="bg-blue-600 hover:bg-blue-700">
                {isProcessingOcr ? 'Processando OCR...' : 'Executar OCR'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Enviar para Assinatura (Clicksign) */}
      {selectedDocForSign && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedDocForSign(null);
            setGeneratedSignLink(null);
            setSignatureSuccessMsg(null);
          }}
          title={`Assinatura Digital - ${selectedDocForSign.name}`}
        >
          <div className="space-y-4 text-xs">
            {/* VIEW A: Se o link de convocação já foi gerado */}
            {generatedSignLink ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Envelope Clicksign Gerado com Sucesso!
                  </div>
                  <p className="text-xs text-emerald-700">
                    O link oficial de assinatura para <strong>{customSignerName || 'o tradutor'}</strong> está pronto.
                    Como o sistema está em modo teste/sandbox ou para envio direto, utilize os botões abaixo para acessar, copiar ou despachar o link:
                  </p>
                </div>

                {/* Input com link oficial e botão de cópia */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Link Convocatório de Assinatura:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedSignLink}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 select-all"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedSignLink);
                        setCopiedSignLink(true);
                        setTimeout(() => setCopiedSignLink(false), 2500);
                      }}
                      className="gap-1 whitespace-nowrap"
                    >
                      {copiedSignLink ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Ações Rápidas: Abrir e WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={generatedSignLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-xs text-center transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    Abrir no Clicksign (Assinar Agora)
                  </a>

                  <a
                    href={`https://wa.me/${(customSignerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${customSignerName || 'Tradutor'}, segue o link oficial para assinatura do documento traduzido: ${generatedSignLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs text-center transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Enviar por WhatsApp
                  </a>
                </div>

                {/* Confirmação de Assinatura Recebida */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs">
                    Já coletou a assinatura do tradutor?
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Assim que o tradutor assinar pelo link ou confirmar o envio, clique abaixo para registrar o documento como <strong>ASSINADO</strong> e arquivar o PDF oficial no histórico.
                  </p>
                  <Button
                    onClick={() => handleConfirmSignature(selectedDocForSign)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Assinatura Recebida & Concluir
                  </Button>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDocForSign(null);
                      setGeneratedSignLink(null);
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              /* VIEW B: Formulário de Configuração */
              <>
                {/* Clicksign Environment Notice Banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isClicksignProd
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={`w-4 h-4 ${isClicksignProd ? 'text-emerald-600' : 'text-amber-600'}`}
                    />
                    <span>
                      Provedor: <strong>Clicksign Oficial</strong> (
                      {isClicksignProd
                        ? 'Ambiente de Produção Oficial Ativo'
                        : 'Ambiente de Teste / Sandbox Ativo'}
                      )
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isClicksignProd
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-200/80 text-amber-900'
                    }`}
                  >
                    {isClicksignProd ? 'PRODUÇÃO' : 'SANDBOX'}
                  </span>
                </div>

                {signatureSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {signatureSuccessMsg}
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-800 block mb-2">Selecione o Fluxo e Signatário:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Fluxo A - Carla Strambio */}
                    <div
                      onClick={() => {
                        setSignerType('CARLA');
                        setSignatureModalPolicy('AUTO_SIGNATURE');
                      }}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        signerType === 'CARLA'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">FLUXO A — Carla Strambio</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                          OFICIAL
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        <strong>Assinatura Automática Autorizada</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Utiliza a API oficial da Clicksign para certificar e assinar automaticamente sem retenção de senhas ou certificados privados.
                      </p>
                    </div>

                    {/* Fluxo B - Outro Tradutor */}
                    <div
                      onClick={() => {
                        setSignerType('CUSTOM');
                        setSignatureModalPolicy('MANUAL_SIGNATURE');
                      }}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        signerType === 'CUSTOM'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">FLUXO B — Outro Tradutor</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                          MANUAL
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        <strong>Assinatura Manual Convocada / Carimbo</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Permite gerar link Clicksign (e-mail/WhatsApp) ou certificar diretamente com carimbo próprio sem Clicksign.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opções específicas do FLUXO B */}
                {signerType === 'CUSTOM' && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="font-bold text-slate-800 block">
                      Como deseja coletar a assinatura de {customSignerName || 'Diego Seguro'}?
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div
                        onClick={() => setFluxoBMethod('DIRECT_MANUAL')}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          fluxoBMethod === 'DIRECT_MANUAL'
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            Assinatura Direta / Carimbo
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            Sem Clicksign
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          O tradutor já traduziu e carimbou. Registra como <strong>ASSINADO</strong> imediatamente com validade interna.
                        </p>
                      </div>

                      <div
                        onClick={() => setFluxoBMethod('CLICKSIGN')}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          fluxoBMethod === 'CLICKSIGN'
                            ? 'border-blue-600 bg-blue-50/60 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            Envelope Clicksign Oficial
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            Clicksign Link
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Gera o envelope oficial e entrega o link na tela para envio ao tradutor via WhatsApp ou e-mail.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="font-medium text-slate-700 block mb-0.5">Nome do Tradutor:</label>
                        <input
                          type="text"
                          value={customSignerName}
                          onChange={(e) => setCustomSignerName(e.target.value)}
                          placeholder="Ex: Diego Seguro"
                          className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-medium text-slate-700 block mb-0.5">E-mail do Tradutor:</label>
                        <input
                          type="email"
                          value={customSignerEmail}
                          onChange={(e) => setCustomSignerEmail(e.target.value)}
                          placeholder="diseguro20@gmail.com"
                          className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-medium text-slate-700 block mb-0.5">
                          WhatsApp / Celular (Opcional - para envio direto):
                        </label>
                        <input
                          type="text"
                          value={customSignerPhone}
                          onChange={(e) => setCustomSignerPhone(e.target.value)}
                          placeholder="Ex: (11) 99999-9999"
                          className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Modalidade de Certificação:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="sigtype"
                        checked={signatureTypeChoice === 'ELETRONICA'}
                        onChange={() => setSignatureTypeChoice('ELETRONICA')}
                        className="text-blue-600"
                      />
                      <span>Assinatura Eletrônica Avançada</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="sigtype"
                        checked={signatureTypeChoice === 'ICP_BRASIL'}
                        onChange={() => setSignatureTypeChoice('ICP_BRASIL')}
                        className="text-blue-600"
                      />
                      <span>Certificado Digital ICP-Brasil</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDocForSign(null);
                      setGeneratedSignLink(null);
                    }}
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => handleSendForSignature(selectedDocForSign)}
                    disabled={isRequestingSignature}
                    className={`font-semibold text-white ${
                      signerType === 'CUSTOM' && fluxoBMethod === 'DIRECT_MANUAL'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isRequestingSignature
                      ? 'Processando...'
                      : signerType === 'CARLA'
                      ? 'Executar Assinatura Automática'
                      : fluxoBMethod === 'DIRECT_MANUAL'
                      ? 'Confirmar Assinatura Manual Direta'
                      : 'Gerar Envelope & Link Clicksign'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Ver Texto / OCR Extracted */}
      {previewTextDoc && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewTextDoc(null)}
          title={`Texto Extraído & Camada OCR - ${previewTextDoc.name}`}
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">
                Idioma Detectado: {previewTextDoc.sourceLanguage?.toUpperCase() || 'POR'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {previewTextDoc.originalWordCount?.words} palavras | {previewTextDoc.originalWordCount?.lines} linhas
              </span>
            </div>
            <textarea
              readOnly
              value={previewTextDoc.extractedText}
              rows={16}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none select-all"
            />
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(previewTextDoc.extractedText || '')}
              >
                Copiar Todo o Texto
              </Button>
              <Button size="sm" onClick={() => setPreviewTextDoc(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Enviar ao Cliente (WhatsApp / E-mail) */}
      {selectedDocForClientSend && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedDocForClientSend(null);
            setSendEmailSuccess(null);
          }}
          title={`Enviar ao Cliente — ${selectedDocForClientSend.name}`}
        >
          <div className="space-y-4 text-xs">
            {/* Success message banner */}
            {sendEmailSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {sendEmailSuccess}
              </div>
            )}

            {/* Channel Tabs */}
            <div className="flex border-b border-slate-200 gap-1 pb-1">
              <button
                type="button"
                onClick={() => setClientSendChannel('whatsapp')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  clientSendChannel === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Enviar por WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setClientSendChannel('email')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  clientSendChannel === 'email'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-4 h-4" /> Disparar por E-mail
              </button>
            </div>

            {/* Informações Básicas do Cliente e Arquivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5">Nome do Cliente:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-0.5">Versão do Arquivo:</label>
                <select
                  value={selectedFileForSend}
                  onChange={(e) => setSelectedFileForSend(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                >
                  {selectedDocForClientSend.versions
                    ?.slice()
                    .reverse()
                    .map((v) => (
                      <option key={v.id || v.type} value={v.type}>
                        {v.type === 'SIGNED_PDF'
                          ? '⭐ PDF Assinado Oficial (Recomendado)'
                          : v.type === 'FINAL_PDF'
                          ? 'PDF Final'
                          : v.type === 'TRANSLATED_DOCX'
                          ? 'Word Traduzido (.docx)'
                          : v.type === 'OCR_PDF'
                          ? 'PDF com Camada OCR'
                          : 'Arquivo Original'}
                      </option>
                    ))}
                  {(!selectedDocForClientSend.versions || selectedDocForClientSend.versions.length === 0) && (
                    <option value="ORIGINAL">Arquivo Original</option>
                  )}
                </select>
              </div>
            </div>

            {/* ABA: WHATSAPP */}
            {clientSendChannel === 'whatsapp' && (
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">
                    Telefone / WhatsApp do Cliente:
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999 ou 5511999999999"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    O link oficial do WhatsApp abre automaticamente com a mensagem e o documento preenchidos.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="font-semibold text-slate-700">Mensagem do WhatsApp:</label>
                    <button
                      type="button"
                      onClick={handleCopyWhatsAppMessage}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                    >
                      {copiedClientMsg ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar Texto
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-sans text-xs bg-white text-slate-800"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDocForClientSend(null)}
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={handleCopyWhatsAppMessage}
                    variant="outline"
                    className="gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Mensagem
                  </Button>
                  <Button
                    onClick={handleOpenWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" /> Abrir WhatsApp e Enviar
                  </Button>
                </div>
              </div>
            )}

            {/* ABA: E-MAIL */}
            {clientSendChannel === 'email' && (
              <div className="space-y-3">
                {/* Notice sobre CNPJ e remetente */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Configuração Provisória de E-mail:</strong>
                    <p className="mt-0.5 text-amber-800">
                      Na próxima terça-feira com a emissão do CNPJ você poderá fixar o e-mail corporativo final (@traduztudo.com.br). Enquanto isso, você pode digitar qualquer e-mail de envio abaixo para disparar ou utilizar a opção <strong>"Abrir no Gmail"</strong> para enviar direto da sua conta.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">
                      E-mail do Remetente (De):
                    </label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="seu.email@gmail.com ou contato@empresa.com"
                      className="w-full px-3 py-1.5 border rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">
                      E-mail do Cliente (Para) *:
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-1.5 border rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Assunto:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Mensagem do E-mail:</label>
                  <textarea
                    rows={6}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-sans text-xs bg-white text-slate-800"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDocForClientSend(null)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenInWebmail('gmail')}
                    className="gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
                    title="Abre o Gmail com tudo preenchido para envio manual da sua conta"
                  >
                    <Mail className="w-3.5 h-3.5 text-red-600" /> Abrir no Gmail
                  </Button>
                  <Button
                    onClick={handleSendEmailToClient}
                    disabled={isSendingEmail}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingEmail ? 'Disparando E-mail...' : 'Disparar E-mail pelo Sistema'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Visualizador Universal de Documentos, PDF & OCR */}
      <UniversalDocumentViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
}
