import { NextRequest, NextResponse } from 'next/server';
import { generateFinalPdf } from '@/lib/documents/documentProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentId,
      documentName,
      translatedContent,
      translatorName = 'Carla Strambio',
      languagePair = 'Português -> Italiano',
      quoteCode,
      workOrderCode,
    } = body;

    const title = (documentName || 'Documento Oficial Traduzido').replace(/\.[^/.]+$/, '');
    const content =
      translatedContent ||
      `CERTIDÃO E TRADUÇÃO OFICIAL TRADUZTUDO\n\nDeclaro que a presente tradução foi realizada com fidelidade ao documento original que me foi apresentado.\n\nTradutor Responsável: ${translatorName}\nPar de Idiomas: ${languagePair}\nProcesso: ${
        quoteCode || 'TRADUZTUDO-OS'
      }\nData de Emissão: ${new Date().toLocaleDateString('pt-BR')}`;

    const { pdfDataUrl, sha256 } = await generateFinalPdf(title, content, {
      translatorName,
      languagePair,
      quoteCode,
      workOrderCode,
    });

    return NextResponse.json({
      success: true,
      pdfDataUrl,
      sha256,
      fileName: `${title}_FINAL.pdf`,
      status: 'FINAL_PDF_READY',
    });
  } catch (error: any) {
    console.error('Error generating final PDF:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar PDF final' }, { status: 500 });
  }
}
