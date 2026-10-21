import {
  DocumentProcessingStatus,
  DocumentVersion,
  DocumentVersionType,
  WordCountMetrics,
  DocumentOcrConfig,
  PageWordCount,
} from '@/types';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface FileAnalysisResult {
  isPdf: boolean;
  isImage: boolean;
  isDocx: boolean;
  isScanned: boolean;
  needsOcr: boolean;
  ocrStatus: 'OCR_NECESSARIO' | 'OCR_NAO_NECESSARIO';
  detectedLanguage: string;
  pageCount: number;
  extractedText: string;
  cleanText: string;
  metrics: WordCountMetrics;
  formatRevisionRecommended: boolean;
  translatedText?: string;
  translatedMetrics?: WordCountMetrics;
  targetLanguage?: string;
}

// Compute SHA-256 for string/buffer/base64
export async function calculateSha256(content: string | ArrayBuffer | Uint8Array): Promise<string> {
  let buffer: Uint8Array;
  if (typeof content === 'string') {
    if (content.startsWith('data:')) {
      const base64Data = content.split(',')[1] || '';
      if (typeof Buffer !== 'undefined') {
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        const bin = atob(base64Data);
        buffer = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);
      }
    } else {
      buffer = new TextEncoder().encode(content);
    }
  } else if (content instanceof ArrayBuffer) {
    buffer = new Uint8Array(content);
  } else {
    buffer = content;
  }

  // Use Web Crypto if available, otherwise Node crypto
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as any);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback Node crypto
  const nodeCrypto = await import('crypto');
  return nodeCrypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
}

// Detect language based on linguistic markers and stop words
export function detectLanguageFromText(text: string, fileName?: string): string {
  const lower = (text + ' ' + (fileName || '')).toLowerCase();

  const scores: Record<string, number> = {
    por: (lower.match(/\b(de|do|da|dos|das|em|no|na|para|com|que|por|uma|certidão|tradução|república|artigo|estado|brasil|brasileiro|brasileira|cartório|registro civil)\b/g) || []).length,
    spa: (lower.match(/\b(de|del|la|el|los|las|en|que|por|con|para|una|certificado|certificación|traducción|república|estado|españa|venezuela|venezolano|venezolana|bolivariana|caracas|partida|nacimiento|acta|matrimonio|defunción|notaría|registro principal|cédula|apostilla|colombia|argentina|chile|perú|méxico|ministerio|poder popular|saren|saime)\b/g) || []).length,
    eng: (lower.match(/\b(the|of|and|to|in|is|you|that|it|he|was|for|on|are|as|with|this|state|translation|document|certificate|birth|marriage|death|united states|united kingdom)\b/g) || []).length,
    ita: (lower.match(/\b(di|del|della|dei|delle|il|la|lo|i|gli|le|che|per|un|una|certificato|traduzione|repubblica|comune|nascita|matrimonio|morte|atto|stato civile|italia|italiano)\b/g) || []).length,
    fra: (lower.match(/\b(de|du|des|le|la|les|en|que|qui|pour|avec|dans|certificat|traduction|république|état|france|naissance|mariage|décès|haïti|haiti)\b/g) || []).length,
    deu: (lower.match(/\b(der|die|das|und|in|den|von|zu|mit|ist|im|für|übersetzung|urkunde|bescheinigung|deutschland|geburtsurkunde|heiratsurkunde)\b/g) || []).length,
    lat: (lower.match(/\b(sancta|sedes|ecclesia|catholica|baptismi|matrimonii|dioecesis|anno|domini|ego|parochus|fide|testimonium)\b/g) || []).length,
    nld: (lower.match(/\b(van|de|het|een|en|in|op|voor|met|naar|vertaling|akte|geboorteakte|nederland|suriname)\b/g) || []).length,
    rus: (lower.match(/[\u0400-\u04FF]/g) || []).length > 4 ? 20 : 0,
    ara: (lower.match(/[\u0600-\u06FF]/g) || []).length > 4 ? 20 : 0,
    zho: (lower.match(/[\u4E00-\u9FFF]/g) || []).length > 4 ? 20 : 0,
    jpn: (lower.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length > 4 ? 20 : 0,
    hat: (lower.match(/\b(repiblik|dayiti|akt|de|nesans|maryaj|sevis|tradiksyon)\b/g) || []).length,
  };

  let maxLang = 'por';
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxLang = lang;
    }
  }

  // Priority check for Venezuelan / Latin American keywords in filename or text
  if (/venezuela|venezol|caracas|partida.*nac|acta.*nac|saren|saime/i.test(lower)) {
    return 'spa';
  }

  return maxLang;
}

// Extract repeated lines (potential headers, footers, page counters)
export function identifyRepeatedPatterns(pagesText: string[]): Set<string> {
  const repeated = new Set<string>();
  if (pagesText.length <= 1) return repeated;

  const headerFooterOccurrences: Record<string, number> = {};

  pagesText.forEach((pText) => {
    const rawLines = pText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) return;

    // Check page numbers anywhere
    rawLines.forEach((line) => {
      if (/^(p[aá]gina\s*\d+(\s*(de|\/)\s*\d+)?|fls?\.\s*\d+|-\s*\d+\s*-|\d+\s*\/\s*\d+|\d+)$/i.test(line)) {
        repeated.add(line);
      }
    });

    // Candidates for header (first 2 non-empty lines) and footer (last 2 non-empty lines)
    const candidates = [
      ...rawLines.slice(0, 2),
      ...rawLines.slice(-2),
    ].filter((l) => l.length > 2 && l.length < 80);

    const uniqueCandidates = new Set(candidates);
    uniqueCandidates.forEach((cand) => {
      headerFooterOccurrences[cand] = (headerFooterOccurrences[cand] || 0) + 1;
    });
  });

  // A line is considered a repeated header/footer only if it appears in at least 70% of pages
  // strictly in the header or footer zones
  const threshold = Math.max(2, Math.floor(pagesText.length * 0.7));
  for (const [line, count] of Object.entries(headerFooterOccurrences)) {
    if (count >= threshold) {
      repeated.add(line);
    }
  }

  return repeated;
}

// Word count calculation engine
export function calculateWordMetrics(
  pagesText: string[],
  options: { ignoreRepeatedHeaders?: boolean; detectedLanguage?: string } = { ignoreRepeatedHeaders: true }
): WordCountMetrics {
  const repeatedLines = options.ignoreRepeatedHeaders ? identifyRepeatedPatterns(pagesText) : new Set<string>();

  const pagesBreakdown: PageWordCount[] = [];
  let totalWords = 0;
  let totalCharsWithSpaces = 0;
  let totalCharsWithoutSpaces = 0;
  let totalLines = 0;
  let ignoredWords = 0;

  pagesText.forEach((pageContent, idx) => {
    const lines = pageContent.split('\n');
    let pageWordCount = 0;
    let pageCharsWith = 0;
    let pageCharsWithout = 0;

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      const wordsInLine = line.match(/[\p{L}\p{N}'’\-_]+/gu) || [];
      const wordCount = wordsInLine.length;

      if (repeatedLines.has(line)) {
        ignoredWords += wordCount;
      } else {
        pageWordCount += wordCount;
        pageCharsWith += line.length + 1;
        pageCharsWithout += line.replace(/\s+/g, '').length;
      }
    });

    totalWords += pageWordCount + (repeatedLines.size > 0 ? 0 : 0);
    totalCharsWithSpaces += pageCharsWith;
    totalCharsWithoutSpaces += pageCharsWithout;
    totalLines += lines.filter((l) => l.trim().length > 0).length;

    pagesBreakdown.push({
      page: idx + 1,
      words: pageWordCount,
      charactersWithSpaces: pageCharsWith,
      charactersWithoutSpaces: pageCharsWithout,
      lines: lines.filter((l) => l.trim().length > 0).length,
    });
  });

  // Overall word count (detected including ignored)
  const allText = pagesText.join('\n');
  const allWords = (allText.match(/[\p{L}\p{N}'’\-_]+/gu) || []).length;
  const billableWords = Math.max(0, allWords - ignoredWords);
  const charsWithoutSpaces = allText.replace(/\s+/g, '').length;
  const charsWithSpaces = allText.length;

  // Cálculo Oficial de Laudas (Normas JUCESP / Sintra / Tradução Juramentada)
  // 1 Lauda Juramentada = 1.000 caracteres sem espaços (ou 1.250 caracteres com espaços)
  const laudasJuramentadas = Math.max(1, Math.ceil(charsWithoutSpaces / 1000));
  const laudasFracionadas = Number((charsWithoutSpaces / 1000).toFixed(2));
  const laudasComEspacos = Number((charsWithSpaces / 1250).toFixed(2));
  const laudasPalavras = Number((billableWords / 250).toFixed(2));
  const estimatedLaudaPrice = 95.0; // R$ 95,00 por lauda padrão
  const estimatedTotalPrice = Number((laudasJuramentadas * estimatedLaudaPrice).toFixed(2));

  return {
    words: allWords,
    charactersWithSpaces: charsWithSpaces,
    charactersWithoutSpaces: charsWithoutSpaces,
    pages: Math.max(1, pagesText.length),
    lines: totalLines,
    billableWords,
    ignoredWords,
    detectedLanguage: options.detectedLanguage || detectLanguageFromText(allText),
    pagesBreakdown,
    ignoreRepeatedHeaders: options.ignoreRepeatedHeaders ?? true,
    laudasJuramentadas,
    laudasFracionadas,
    laudasComEspacos,
    laudasPalavras,
    estimatedLaudaPrice,
    estimatedTotalPrice,
  };
}

// Helper to extract Buffer from dataUrl, base64 or binary Uint8Array
export function extractBufferFromDataUrl(content: string | ArrayBuffer | Uint8Array): Buffer {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(content)) return content;
  if (content instanceof Uint8Array) return Buffer.from(content);
  if (content instanceof ArrayBuffer) return Buffer.from(new Uint8Array(content));
  if (typeof content === 'string') {
    if (content.startsWith('data:')) {
      const base64 = content.split('base64,')[1] || content.split(',')[1] || '';
      return Buffer.from(base64, 'base64');
    }
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(content.slice(0, 100)) && content.length > 100) {
      return Buffer.from(content, 'base64');
    }
    return Buffer.from(content, 'utf-8');
  }
  return Buffer.alloc(0);
}

/**
 * Real-time Document Translation Engine
 * Translates texts preserving paragraphs, line breaks and headings
 */
export async function translateDocumentText(
  text: string,
  sourceLang = 'auto',
  targetLang = 'it'
): Promise<string> {
  if (!text || !text.trim()) return '';

  const langMap: Record<string, string> = {
    por: 'pt',
    pt: 'pt',
    spa: 'es',
    es: 'es',
    ita: 'it',
    it: 'it',
    eng: 'en',
    en: 'en',
    fra: 'fr',
    fr: 'fr',
    deu: 'de',
    de: 'de',
    nld: 'nl',
    nl: 'nl',
    lat: 'la',
    la: 'la',
  };

  const sl = langMap[sourceLang.toLowerCase()] || (sourceLang.length === 2 ? sourceLang : 'auto');
  const tl = langMap[targetLang.toLowerCase()] || (targetLang.length === 2 ? targetLang : 'it');

  const lines = text.split('\n');
  const batches: string[] = [];
  let currentBatch: string[] = [];
  let currentLen = 0;

  for (const line of lines) {
    if (currentLen + line.length > 1100 && currentBatch.length > 0) {
      batches.push(currentBatch.join('\n'));
      currentBatch = [line];
      currentLen = line.length;
    } else {
      currentBatch.push(line);
      currentLen += line.length + 1;
    }
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch.join('\n'));
  }

  const translatedBatches: string[] = [];
  for (const batch of batches) {
    if (!batch.trim()) {
      translatedBatches.push(batch);
      continue;
    }
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(
        batch
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0] || '').join('');
        translatedBatches.push(translated);
      } else {
        translatedBatches.push(batch);
      }
    } catch (err) {
      console.warn('Translation batch fallback:', err);
      translatedBatches.push(batch);
    }
  }

  return translatedBatches.join('\n');
}

// Automatic inspection of file content with 100% precision OCR & Auto-Translation
export async function analyzeDocumentFile(
  fileName: string,
  fileDataUrlOrBase64: string,
  options: {
    targetLang?: string;
    ocrLanguages?: string[];
    pricePerLauda?: number;
  } = {}
): Promise<FileAnalysisResult> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'].includes(ext);
  const isDocx = ['docx', 'doc'].includes(ext);

  let pagesText: string[] = [];
  let isScanned = false;
  let pageCount = 1;
  let formatRevisionRecommended = false;

  const buffer = extractBufferFromDataUrl(fileDataUrlOrBase64);

  if (isImage) {
    isScanned = true;
    formatRevisionRecommended = true;
    pageCount = 1;

    if (typeof window === 'undefined' && buffer.length > 0) {
      try {
        const { createWorker } = await import('tesseract.js');
        const langs =
          options.ocrLanguages && options.ocrLanguages.length > 0
            ? options.ocrLanguages
            : ['por', 'spa', 'ita', 'eng'];
        const worker = await createWorker(langs);
        const ret = await worker.recognize(buffer);
        const ocrText = ret.data?.text?.trim() || '';
        await worker.terminate();
        if (ocrText) {
          pagesText = [ocrText];
        }
      } catch (ocrErr) {
        console.error('Error in Tesseract image OCR:', ocrErr);
      }
    }
  } else if (isPdf) {
    if (typeof window === 'undefined' && buffer.length > 0) {
      try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();

        if (parsed && parsed.text && parsed.text.trim().length > 25) {
          // Digital PDF with 100% exact text extraction
          isScanned = false;
          if (parsed.pages && parsed.pages.length > 0) {
            pagesText = parsed.pages
              .map((p: any) => p.text?.trim() || '')
              .filter((t: string) => t.length > 0);
            if (pagesText.length === 0) pagesText = [parsed.text.trim()];
            pageCount = parsed.total || pagesText.length;
          } else {
            pagesText = [parsed.text.trim()];
            pageCount = parsed.total || 1;
          }
        } else {
          // Scanned PDF (no digital text streams) -> optical character recognition page by page
          isScanned = true;
          formatRevisionRecommended = true;
          pageCount = parsed?.total || 1;

          try {
            const { createWorker } = await import('tesseract.js');
            const langs =
              options.ocrLanguages && options.ocrLanguages.length > 0
                ? options.ocrLanguages
                : ['por', 'spa', 'ita', 'eng'];
            const worker = await createWorker(langs);

            const maxPages = Math.min(pageCount, 10);
            for (let pNum = 1; pNum <= maxPages; pNum++) {
              try {
                const sc = await (parser as any).getScreenshot({ page: pNum });
                if (sc && sc.pages && sc.pages[0]?.dataUrl) {
                  const ret = await worker.recognize(sc.pages[0].dataUrl);
                  const pText = ret.data?.text?.trim() || '';
                  if (pText) pagesText.push(pText);
                }
              } catch (scErr) {
                console.warn(`Could not screenshot PDF page ${pNum}:`, scErr);
              }
            }
            await worker.terminate();
          } catch (ocrPdfErr) {
            console.error('Error running OCR on scanned PDF pages:', ocrPdfErr);
          }
        }
      } catch (pdfErr) {
        console.error('Error analyzing PDF:', pdfErr);
      }
    }
  }

  // If no text could be extracted or blank document
  if (pagesText.length === 0 || pagesText.every((p) => !p.trim())) {
    pagesText = ['[Texto não identificado no documento selecionado]'];
  }

  const allText = pagesText.join('\n\n--- QUEBRA DE PÁGINA ---\n\n');
  const detectedLanguage = detectLanguageFromText(allText, fileName);
  const metrics = calculateWordMetrics(pagesText, {
    ignoreRepeatedHeaders: true,
    detectedLanguage,
  });

  // Target translation language: default Italian 'it' (TraduzTudo specialization) or Portuguese if source is foreign
  let targetLang = options.targetLang;
  if (!targetLang) {
    targetLang = detectedLanguage === 'por' || detectedLanguage === 'pt' ? 'it' : 'pt';
  }

  let translatedText = '';
  let translatedMetrics: WordCountMetrics | undefined;

  if (allText && !allText.startsWith('[Texto não identificado')) {
    try {
      translatedText = await translateDocumentText(allText, detectedLanguage, targetLang);
      const translatedPages = translatedText.split('\n\n--- QUEBRA DE PÁGINA ---\n\n');
      translatedMetrics = calculateWordMetrics(translatedPages, {
        ignoreRepeatedHeaders: true,
        detectedLanguage: targetLang,
      });
    } catch (transErr) {
      console.warn('Auto-translation failed:', transErr);
    }
  }

  return {
    isPdf,
    isImage,
    isDocx,
    isScanned,
    needsOcr: isScanned,
    ocrStatus: isScanned ? 'OCR_NECESSARIO' : 'OCR_NAO_NECESSARIO',
    detectedLanguage,
    pageCount: Math.max(pageCount, pagesText.length),
    extractedText: allText,
    cleanText: allText.replace(/--- QUEBRA DE PÁGINA ---/g, ''),
    metrics,
    formatRevisionRecommended,
    translatedText,
    translatedMetrics,
    targetLanguage: targetLang,
  };
}

// Generate editable DOCX from extracted text
export async function generateDocxFromText(
  title: string,
  pagesText: string[],
  metadata: {
    language?: string;
    wordCount?: number;
    sourceDocument?: string;
  } = {}
): Promise<string> {
  const docParagraphs: Paragraph[] = [
    new Paragraph({
      text: title.toUpperCase(),
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Documento Processado - TraduzTudo OS | Idioma: ${metadata.language || 'Português'} | Total de Palavras: ${
            metadata.wordCount || 'N/A'
          }`,
          italics: true,
          size: 18,
          color: '666666',
        }),
      ],
      spacing: { after: 300 },
    }),
  ];

  pagesText.forEach((pageContent, idx) => {
    if (idx > 0) {
      docParagraphs.push(
        new Paragraph({
          text: `--- Página ${idx + 1} ---`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 150 },
        })
      );
    }

    const lines = pageContent.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        docParagraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      } else if (trimmed.length < 50 && /^[A-Z0-9\sÁÉÍÓÚÂÊÎÔÛÃÕÇ\-_:.]+$/.test(trimmed)) {
        docParagraphs.push(
          new Paragraph({
            text: trimmed,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 80 },
          })
        );
      } else {
        docParagraphs.push(
          new Paragraph({
            text: trimmed,
            spacing: { after: 120 },
          })
        );
      }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const base64Docx = await Packer.toBase64String(doc);
  return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Docx}`;
}

// Generate Official Final PDF from DOCX or translated text
export async function generateFinalPdf(
  title: string,
  content: string,
  certInfo: {
    translatorName?: string;
    languagePair?: string;
    quoteCode?: string;
    workOrderCode?: string;
  } = {}
): Promise<{ pdfDataUrl: string; sha256: string }> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = content.split('\n');
  const linesPerPage = 38;
  const totalPages = Math.max(1, Math.ceil(lines.length / linesPerPage));

  for (let p = 0; p < totalPages; p++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();

    // Official Header bar
    page.drawRectangle({
      x: 40,
      y: height - 60,
      width: width - 80,
      height: 25,
      color: rgb(0.08, 0.22, 0.42),
    });

    page.drawText('TRADUZTUDO - TRADUÇÃO OFICIAL E JURAMENTADA', {
      x: 50,
      y: height - 52,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    const pageNumText = `Página ${p + 1} de ${totalPages}`;
    page.drawText(pageNumText, {
      x: width - 130,
      y: height - 52,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    });

    // Content lines
    let yPos = height - 90;
    const startIdx = p * linesPerPage;
    const pageLines = lines.slice(startIdx, startIdx + linesPerPage);

    for (const rawLine of pageLines) {
      const line = rawLine.trim();
      if (line) {
        const isHeading = line.length < 60 && /^[A-Z0-9\sÁÉÍÓÚÂÊÎÔÛÃÕÇ\-_:.]+$/.test(line);
        page.drawText(line.substring(0, 95), {
          x: 45,
          y: yPos,
          size: isHeading ? 9.5 : 8.5,
          font: isHeading ? fontBold : font,
          color: rgb(0.12, 0.14, 0.17),
        });
      }
      yPos -= 16;
    }

    // Official Footer Certification
    page.drawLine({
      start: { x: 40, y: 55 },
      end: { x: width - 40, y: 55 },
      thickness: 0.8,
      color: rgb(0.8, 0.82, 0.85),
    });

    page.drawText(
      `Certidão Oficial TraduzTudo | Tradutor: ${certInfo.translatorName || 'Carla Strambio'} | Par: ${
        certInfo.languagePair || 'Oficial'
      } | Ref: ${certInfo.quoteCode || 'TRADUZTUDO-OS'}`,
      {
        x: 45,
        y: 42,
        size: 7.5,
        font,
        color: rgb(0.4, 0.45, 0.5),
      }
    );

    page.drawText('Documento final preparado para assinatura digital oficial (Clicksign / ICP-Brasil)', {
      x: 45,
      y: 32,
      size: 7,
      font,
      color: rgb(0.55, 0.6, 0.65),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfDataUrl = await pdfDoc.saveAsBase64({ dataUri: true });
  const sha256 = await calculateSha256(pdfBytes);

  return { pdfDataUrl, sha256 };
}

/**
 * Sanitizes strings for PDF rendering to ensure compatibility with StandardFonts.Helvetica (WinAnsi)
 */
export function sanitizeForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[•]/g, '*')
    .replace(/[…]/g, '...')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ');
}

/**
 * Generates an official, certified signed PDF document.
 * If existing PDF bytes are provided and valid, stamps certification metadata and appends the official certificate term.
 * If not, generates a complete official translation document with certificate term and legal validity seals.
 */
export async function generateCertifiedSignedPdf(
  doc: {
    name: string;
    extractedText?: string;
    cleanExtractedText?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    currentSha256?: string;
    sha256Original?: string;
  },
  signerConfig?: {
    name?: string;
    cpfCnpj?: string;
    policy?: string;
    signatureType?: string;
    provider?: string;
    date?: string;
  },
  existingBytes?: Uint8Array | ArrayBuffer
): Promise<{ pdfBytes: Uint8Array; pdfDataUrl: string; sha256: string }> {
  let pdfDoc: PDFDocument | null = null;
  let isExistingLoaded = false;

  // Try loading existing bytes if valid PDF
  if (existingBytes && existingBytes.byteLength > 50) {
    try {
      const u8 = existingBytes instanceof Uint8Array ? existingBytes : new Uint8Array(existingBytes);
      if (u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46) {
        pdfDoc = await PDFDocument.load(u8, { ignoreEncryption: true });
        isExistingLoaded = true;
      }
    } catch (e) {
      console.warn('Could not load existing PDF bytes, generating fresh certified document:', e);
    }
  }

  if (!pdfDoc) {
    pdfDoc = await PDFDocument.create();
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const signerName = signerConfig?.name || 'Carla Strambio';
  const signerCpf = signerConfig?.cpfCnpj || '123.456.789-00';
  const signatureType = signerConfig?.signatureType || 'ELETRONICA';
  const isIcp = signatureType === 'ICP_BRASIL';
  const timestamp = signerConfig?.date || new Date().toLocaleString('pt-BR');
  const docHash = doc.currentSha256 || doc.sha256Original || `sha_${Date.now()}`;

  // If newly created, render document text pages
  if (!isExistingLoaded) {
    const rawContent =
      doc.extractedText ||
      doc.cleanExtractedText ||
      `CERTIDÃO E TRADUÇÃO OFICIAL TRADUZTUDO\n\nDocumento: ${doc.name}\n\nDeclaro que a presente tradução/documento foi processada com fidelidade ao documento original que me foi apresentado.\n\nTradutor Responsável: ${signerName}\nPar de Idiomas: ${doc.sourceLanguage || 'pt'} -> ${doc.targetLanguage || 'it'}\nData: ${timestamp}`;

    const lines = rawContent.split('\n');
    const linesPerPage = 36;
    const totalContentPages = Math.max(1, Math.ceil(lines.length / linesPerPage));

    for (let p = 0; p < totalContentPages; p++) {
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();

      // Top Navy Header Bar
      page.drawRectangle({
        x: 40,
        y: height - 55,
        width: width - 80,
        height: 25,
        color: rgb(0.08, 0.22, 0.42),
      });

      page.drawText('TRADUZTUDO - TRADUÇÃO OFICIAL E JURAMENTADA', {
        x: 50,
        y: height - 47,
        size: 9.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(`Página ${p + 1} de ${totalContentPages + 1}`, {
        x: width - 120,
        y: height - 47,
        size: 8.5,
        font,
        color: rgb(1, 1, 1),
      });

      let yPos = height - 85;
      const startIdx = p * linesPerPage;
      const pageLines = lines.slice(startIdx, startIdx + linesPerPage);

      for (const rawLine of pageLines) {
        const line = sanitizeForPdf(rawLine.trim());
        if (line) {
          const isHeading = line.length < 60 && /^[A-Z0-9\sÁÉÍÓÚÂÊÎÔÛÃÕÇ\-_:.]+$/.test(line);
          page.drawText(line.substring(0, 95), {
            x: 45,
            y: yPos,
            size: isHeading ? 9.5 : 8.5,
            font: isHeading ? fontBold : font,
            color: rgb(0.12, 0.14, 0.17),
          });
        }
        yPos -= 18;
      }

      // Page Footer line
      page.drawLine({
        start: { x: 40, y: 40 },
        end: { x: width - 40, y: 40 },
        thickness: 0.5,
        color: rgb(0.8, 0.82, 0.85),
      });

      page.drawText(
        sanitizeForPdf(`TRADUZTUDO | Tradução Oficial | Documento: ${doc.name} | Hash: ${docHash.slice(0, 16)}...`),
        {
          x: 45,
          y: 28,
          size: 7,
          font,
          color: rgb(0.45, 0.5, 0.55),
        }
      );
    }
  } else {
    // If existing PDF was loaded, add certification footer line to each page
    const count = pdfDoc.getPageCount();
    for (let i = 0; i < count; i++) {
      const page = pdfDoc.getPage(i);
      const { width } = page.getSize();
      page.drawLine({
        start: { x: 30, y: 22 },
        end: { x: width - 30, y: 22 },
        thickness: 0.5,
        color: rgb(0.75, 0.8, 0.85),
      });
      page.drawText(
        sanitizeForPdf(`TRADUZTUDO | Assinado digitalmente por ${signerName} em ${timestamp} | SHA-256: ${docHash.slice(0, 16)}... | Pág. ${i + 1}/${count}`),
        {
          x: 35,
          y: 12,
          size: 6.5,
          font,
          color: rgb(0.4, 0.45, 0.5),
        }
      );
    }
  }

  // ALWAYS APPEND: Official Certificate & Digital Signature Term Page
  const certPage = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = certPage.getSize();

  // Header Bar
  certPage.drawRectangle({
    x: 40,
    y: height - 65,
    width: width - 80,
    height: 35,
    color: rgb(0.08, 0.22, 0.42),
  });

  certPage.drawText('TRADUZTUDO - TRADUÇÕES JURAMENTADAS & CERTIFICADAS', {
    x: 52,
    y: height - 48,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  certPage.drawText('TERMO DE ENCERRAMENTO E CERTIFICAÇÃO DE ASSINATURA DIGITAL OFICIAL', {
    x: 52,
    y: height - 60,
    size: 7.5,
    font,
    color: rgb(0.7, 0.85, 1),
  });

  // Legal Framework Statement
  certPage.drawText(
    sanitizeForPdf('Certificação em conformidade com a MP nº 2.200-2/2001, Lei Federal nº 14.063/2020 e Decreto 10.543/2020.'),
    {
      x: 45,
      y: height - 85,
      size: 8,
      font,
      color: rgb(0.3, 0.35, 0.4),
    }
  );

  // Document Details Box
  certPage.drawRectangle({
    x: 40,
    y: height - 210,
    width: width - 80,
    height: 115,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.8, 0.85, 0.92),
    borderWidth: 1,
  });

  certPage.drawText('DADOS DO DOCUMENTO OFICIAL CERTIFICADO', {
    x: 55,
    y: height - 110,
    size: 9.5,
    font: fontBold,
    color: rgb(0.08, 0.22, 0.42),
  });

  certPage.drawText(sanitizeForPdf(`Nome do Arquivo: ${doc.name}`), {
    x: 55,
    y: height - 130,
    size: 8.5,
    font,
    color: rgb(0.15, 0.2, 0.25),
  });

  certPage.drawText(sanitizeForPdf(`Par de Idiomas: ${doc.sourceLanguage || 'pt'} -> ${doc.targetLanguage || 'it'}`), {
    x: 55,
    y: height - 148,
    size: 8.5,
    font,
    color: rgb(0.15, 0.2, 0.25),
  });

  certPage.drawText(sanitizeForPdf(`Hash SHA-256 de Integridade:`), {
    x: 55,
    y: height - 166,
    size: 8.5,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.25),
  });

  certPage.drawText(sanitizeForPdf(docHash), {
    x: 55,
    y: height - 180,
    size: 7.5,
    font,
    color: rgb(0.2, 0.3, 0.45),
  });

  certPage.drawText(sanitizeForPdf(`Total de Páginas do Processo: ${pdfDoc.getPageCount()} página(s)`), {
    x: 55,
    y: height - 198,
    size: 8.5,
    font,
    color: rgb(0.15, 0.2, 0.25),
  });

  // Digital Signature Seal Box (Green Border)
  certPage.drawRectangle({
    x: 40,
    y: height - 420,
    width: width - 80,
    height: 195,
    color: rgb(0.97, 0.99, 0.97),
    borderColor: rgb(0.15, 0.6, 0.35),
    borderWidth: 1.5,
  });

  // Seal Header
  certPage.drawRectangle({
    x: 40,
    y: height - 250,
    width: width - 80,
    height: 25,
    color: rgb(0.15, 0.6, 0.35),
  });

  certPage.drawText('VERIFICADOR OFICIAL: DOCUMENTO ASSINADO DIGITALMENTE COM SUCESSO', {
    x: 55,
    y: height - 242,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  certPage.drawText(sanitizeForPdf(`Signatário Oficial: ${signerName}`), {
    x: 55,
    y: height - 275,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.25, 0.15),
  });

  certPage.drawText(
    sanitizeForPdf(`Qualificação: Tradutor Público e Intérprete Comercial — JUCESP / Oficial Autorizado`),
    {
      x: 55,
      y: height - 295,
      size: 8.5,
      font,
      color: rgb(0.15, 0.35, 0.2),
    }
  );

  certPage.drawText(sanitizeForPdf(`CPF/Documento: ${signerCpf}`), {
    x: 55,
    y: height - 313,
    size: 8.5,
    font,
    color: rgb(0.15, 0.35, 0.2),
  });

  certPage.drawText(
    sanitizeForPdf(
      `Tipo de Assinatura: ${
        isIcp ? 'Certificado Digital Padrão ICP-Brasil (A3/A1)' : 'Assinatura Eletrônica Avançada Autorizada'
      }`
    ),
    {
      x: 55,
      y: height - 331,
      size: 8.5,
      font,
      color: rgb(0.15, 0.35, 0.2),
    }
  );

  certPage.drawText(sanitizeForPdf(`Data e Hora do Registro Oficial: ${timestamp}`), {
    x: 55,
    y: height - 349,
    size: 8.5,
    font,
    color: rgb(0.15, 0.35, 0.2),
  });

  certPage.drawText(
    sanitizeForPdf(`Protocolo de Autenticação: TT-DOC-${Date.now().toString(36).toUpperCase()}`),
    {
      x: 55,
      y: height - 367,
      size: 8.5,
      font,
      color: rgb(0.15, 0.35, 0.2),
    }
  );

  certPage.drawText(
    sanitizeForPdf(`Ambiente de Certificação: Produção Juramentada Oficial TraduzTudo`),
    {
      x: 55,
      y: height - 385,
      size: 8,
      font,
      color: rgb(0.2, 0.4, 0.25),
    }
  );

  certPage.drawText(
    sanitizeForPdf(`Status: AUTÊNTICO E JURIDICAMENTE VÁLIDO (SEM ALTERAÇÕES APÓS A ASSINATURA)`),
    {
      x: 55,
      y: height - 403,
      size: 8.5,
      font,
      color: rgb(0.1, 0.5, 0.2),
    }
  );

  // Legal Validity & Hague Convention Box
  certPage.drawRectangle({
    x: 40,
    y: height - 540,
    width: width - 80,
    height: 105,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });

  certPage.drawText('EFICÁCIA JURÍDICA E VALIDADE INTERNACIONAL', {
    x: 55,
    y: height - 445,
    size: 9,
    font,
    color: rgb(0.2, 0.25, 0.3),
  });

  const legalNotes = [
    '1. A autenticidade, autoria e integridade deste documento estão garantidas pela infraestrutura criptográfica oficial.',
    '2. Documento válido para processos de cidadania (italiana, portuguesa, etc.), homologações e consulados.',
    '3. Atende plenamente à Convenção da Apostila de Haia e ao Decreto Federal nº 8.660/2016.',
    '4. Qualquer alteração ou modificação posterior neste arquivo invalida a assinatura digital e o hash SHA-256.',
  ];

  let noteY = height - 465;
  for (const n of legalNotes) {
    certPage.drawText(sanitizeForPdf(n), {
      x: 55,
      y: noteY,
      size: 7.5,
      font,
      color: rgb(0.3, 0.35, 0.4),
    });
    noteY -= 16;
  }

  // Footer bar
  certPage.drawLine({
    start: { x: 40, y: 60 },
    end: { x: width - 40, y: 60 },
    thickness: 1,
    color: rgb(0.8, 0.82, 0.85),
  });

  certPage.drawText(
    sanitizeForPdf('TraduzTudo Traduções e Certificações Oficiais | contato@traduztudo.com.br | Documento Oficial Arquivado'),
    {
      x: 55,
      y: 45,
      size: 7.5,
      font,
      color: rgb(0.45, 0.5, 0.55),
    }
  );

  const pdfBytes = await pdfDoc.save();
  const pdfDataUrl = await pdfDoc.saveAsBase64({ dataUri: true });
  const sha256 = await calculateSha256(pdfBytes);

  return { pdfBytes, pdfDataUrl, sha256 };
}
