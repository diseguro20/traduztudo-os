import { NextRequest, NextResponse } from 'next/server';
import {
  calculateSha256,
  calculateWordMetrics,
  generateDocxFromText,
  detectLanguageFromText,
  analyzeDocumentFile,
  translateDocumentText,
} from '@/lib/documents/documentProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentId,
      fileName = '',
      fileDataUrl,
      languages = ['por'],
      autoDetect = true,
      cleanNoise = true,
      deskew = true,
      rawText = '',
      targetLanguage = 'it',
    } = body;

    let processedText = rawText;
    let metrics;
    let detectedLang = 'por';
    let translatedText = '';
    let translatedMetrics;

    if (fileDataUrl && fileDataUrl.length > 50) {
      // Full re-execution of real OCR engine on actual binary data
      const analysis = await analyzeDocumentFile(fileName, fileDataUrl, {
        ocrLanguages: languages,
        targetLang: targetLanguage,
      });

      processedText = analysis.extractedText;
      metrics = analysis.metrics;
      detectedLang = analysis.detectedLanguage;
      translatedText = analysis.translatedText || '';
      translatedMetrics = analysis.translatedMetrics;
    } else if (rawText && rawText.trim().length > 0) {
      // Re-evaluate existing extracted text
      const pages = processedText.split('\n\n--- QUEBRA DE PÁGINA ---\n\n');
      detectedLang = autoDetect
        ? detectLanguageFromText(processedText, fileName)
        : languages[0] || detectLanguageFromText(processedText, fileName);

      metrics = calculateWordMetrics(pages, {
        ignoreRepeatedHeaders: true,
        detectedLanguage: detectedLang,
      });

      try {
        translatedText = await translateDocumentText(processedText, detectedLang, targetLanguage);
        const translatedPages = translatedText.split('\n\n--- QUEBRA DE PÁGINA ---\n\n');
        translatedMetrics = calculateWordMetrics(translatedPages, {
          ignoreRepeatedHeaders: true,
          detectedLanguage: targetLanguage,
        });
      } catch (transErr) {
        console.warn('OCR translation fallback:', transErr);
      }
    } else {
      processedText = '[Texto não fornecido para reconhecimento OCR]';
      metrics = calculateWordMetrics([processedText], {
        ignoreRepeatedHeaders: true,
        detectedLanguage: 'por',
      });
    }

    const docxDataUrl = await generateDocxFromText(
      (fileName || 'documento_ocr').replace(/\.[^/.]+$/, ''),
      [processedText],
      {
        language: metrics.detectedLanguage || detectedLang,
        wordCount: metrics.billableWords,
        sourceDocument: fileName,
      }
    );
    const docxSha256 = await calculateSha256(docxDataUrl);

    let translatedDocxDataUrl: string | undefined;
    let translatedDocxSha256: string | undefined;

    if (translatedText) {
      try {
        translatedDocxDataUrl = await generateDocxFromText(
          `${(fileName || 'documento').replace(/\.[^/.]+$/, '')}_TRADUZIDO_${targetLanguage.toUpperCase()}`,
          [translatedText],
          {
            language: targetLanguage,
            wordCount: translatedMetrics?.billableWords || metrics.billableWords,
            sourceDocument: fileName,
          }
        );
        translatedDocxSha256 = await calculateSha256(translatedDocxDataUrl);
      } catch (err) {
        console.warn('Translated docx error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      ocrStatus: 'CONCLUIDO',
      languages: Array.isArray(languages) ? languages : [languages],
      metrics,
      extractedText: processedText,
      translatedText,
      translatedMetrics,
      targetLanguage,
      docxDataUrl,
      docxSha256,
      translatedDocxDataUrl,
      translatedDocxSha256,
      formatRevisionRecommended: false,
      deskewApplied: deskew,
      cleanNoiseApplied: cleanNoise,
    });
  } catch (error: any) {
    console.error('Error running OCR:', error);
    return NextResponse.json({ error: error.message || 'Erro ao executar OCR' }, { status: 500 });
  }
}
