import { NextRequest, NextResponse } from 'next/server';
import {
  calculateSha256,
  calculateWordMetrics,
  translateDocumentText,
  generateDocxFromText,
  detectLanguageFromText,
} from '@/lib/documents/documentProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentId,
      fileName = 'documento_traduzido.docx',
      fileDataUrl,
      targetLanguage = 'it',
      sourceLanguage = 'por',
      textContent = '',
    } = body;

    let translated = textContent;

    // If textContent is provided, translate it dynamically to the requested target language
    if (textContent && textContent.trim().length > 0) {
      const srcLang = sourceLanguage || detectLanguageFromText(textContent, fileName);
      translated = await translateDocumentText(textContent, srcLang, targetLanguage);
    }

    if (!translated) {
      translated = '[Texto para tradução não fornecido]';
    }

    const translatedPages = translated.split('\n\n--- QUEBRA DE PÁGINA ---\n\n');
    const metrics = calculateWordMetrics(translatedPages, {
      ignoreRepeatedHeaders: true,
      detectedLanguage: targetLanguage,
    });

    let docxDataUrl = fileDataUrl;
    let sha256 = '';

    if (!docxDataUrl || !docxDataUrl.startsWith('data:')) {
      docxDataUrl = await generateDocxFromText(
        `${fileName.replace(/\.[^/.]+$/, '')}_TRADUZIDO_${targetLanguage.toUpperCase()}`,
        translatedPages,
        {
          language: targetLanguage,
          wordCount: metrics.billableWords,
          sourceDocument: fileName,
        }
      );
    }

    sha256 = await calculateSha256(docxDataUrl);

    return NextResponse.json({
      success: true,
      sha256,
      translatedWordCount: metrics,
      translatedText: translated,
      docxDataUrl,
      targetLanguage,
      status: 'TRANSLATED_DOCX_UPLOADED',
    });
  } catch (error: any) {
    console.error('Error in translate API:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar tradução' }, { status: 500 });
  }
}
