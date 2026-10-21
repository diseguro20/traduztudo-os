import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocumentFile, calculateSha256, generateDocxFromText } from '@/lib/documents/documentProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileDataUrl, quoteId, workOrderId, customerId, uploadedBy, targetLanguage = 'it' } = body;

    if (!fileName || !fileDataUrl) {
      return NextResponse.json({ error: 'Arquivo e nome são obrigatórios' }, { status: 400 });
    }

    const sha256Original = await calculateSha256(fileDataUrl);
    const analysis = await analyzeDocumentFile(fileName, fileDataUrl, { targetLang: targetLanguage });

    // 1. Generate original editable DOCX
    const docxDataUrl = await generateDocxFromText(
      fileName.replace(/\.[^/.]+$/, ''),
      [analysis.extractedText],
      {
        language: analysis.detectedLanguage,
        wordCount: analysis.metrics.billableWords,
        sourceDocument: fileName,
      }
    );
    const docxSha256 = await calculateSha256(docxDataUrl);

    // 2. Generate translated DOCX if translation succeeded
    let translatedDocxDataUrl: string | undefined;
    let translatedDocxSha256: string | undefined;

    if (analysis.translatedText) {
      try {
        translatedDocxDataUrl = await generateDocxFromText(
          `${fileName.replace(/\.[^/.]+$/, '')}_TRADUZIDO_${(analysis.targetLanguage || targetLanguage).toUpperCase()}`,
          [analysis.translatedText],
          {
            language: analysis.targetLanguage || targetLanguage,
            wordCount: analysis.translatedMetrics?.billableWords || analysis.metrics.billableWords,
            sourceDocument: fileName,
          }
        );
        translatedDocxSha256 = await calculateSha256(translatedDocxDataUrl);
      } catch (transDocxErr) {
        console.warn('Could not generate translated DOCX:', transDocxErr);
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      sha256Original,
      docxDataUrl,
      docxSha256,
      translatedDocxDataUrl,
      translatedDocxSha256,
      translatedText: analysis.translatedText,
      translatedMetrics: analysis.translatedMetrics,
      initialStatus: analysis.needsOcr ? 'OCR_COMPLETED' : 'DOCX_READY',
    });
  } catch (error: any) {
    console.error('Error processing document upload:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar documento' }, { status: 500 });
  }
}
