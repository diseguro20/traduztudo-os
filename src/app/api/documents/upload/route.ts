import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocumentFile, calculateSha256, generateDocxFromText } from '@/lib/documents/documentProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileDataUrl, quoteId, workOrderId, customerId, uploadedBy } = body;

    if (!fileName || !fileDataUrl) {
      return NextResponse.json({ error: 'Arquivo e nome são obrigatórios' }, { status: 400 });
    }

    const sha256Original = await calculateSha256(fileDataUrl);
    const analysis = await analyzeDocumentFile(fileName, fileDataUrl);

    // Generate initial editable DOCX
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

    return NextResponse.json({
      success: true,
      analysis,
      sha256Original,
      docxDataUrl,
      docxSha256,
      initialStatus: analysis.needsOcr ? 'OCR_COMPLETED' : 'DOCX_READY',
    });
  } catch (error: any) {
    console.error('Error processing document upload:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar documento' }, { status: 500 });
  }
}
