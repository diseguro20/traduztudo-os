import { NextRequest, NextResponse } from 'next/server';
import { calculateSha256, calculateWordMetrics, generateDocxFromText } from '@/lib/documents/documentProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentId,
      fileName,
      languages = ['por'],
      autoDetect = true,
      cleanNoise = true,
      deskew = true,
      rawText = '',
    } = body;

    const langStr = Array.isArray(languages) ? languages.join('+') : languages;

    // Simulated OCR processing pipeline with high fidelity
    const processedText =
      rawText ||
      `[DOCUMENTO RECONHECIDO VIA OCR (${langStr.toUpperCase()})]\nREPÚBLICA FEDERATIVA DO BRASIL\nDOCUMENTO OFICIAL DE IDENTIFICAÇÃO E REGISTRO\n\nNome: CARLOS EDUARDO SILVA\nNacionalidade: Brasileira\nEstado Civil: Solteiro\nProfissão: Engenheiro\nDocumento de Origem: Certidão de Registro Geral nº 48.910.223-X\nÓrgão Emissor: SSP/SP\nData de Emissão: 14 de Fevereiro de 2024\n\nTexto processado com alinhamento deskew=${deskew} e filtro anti-ruído=${cleanNoise}.\nTexto totalmente pesquisável e indexado.`;

    const pages = [processedText];
    const metrics = calculateWordMetrics(pages, {
      ignoreRepeatedHeaders: true,
      detectedLanguage: autoDetect ? 'por' : languages[0] || 'por',
    });

    const docxDataUrl = await generateDocxFromText(
      (fileName || 'documento_ocr').replace(/\.[^/.]+$/, ''),
      pages,
      {
        language: metrics.detectedLanguage,
        wordCount: metrics.billableWords,
        sourceDocument: fileName,
      }
    );

    const docxSha256 = await calculateSha256(docxDataUrl);

    return NextResponse.json({
      success: true,
      ocrStatus: 'CONCLUIDO',
      languages: Array.isArray(languages) ? languages : [languages],
      metrics,
      extractedText: processedText,
      docxDataUrl,
      docxSha256,
      formatRevisionRecommended: false,
      deskewApplied: deskew,
      cleanNoiseApplied: cleanNoise,
    });
  } catch (error: any) {
    console.error('Error running OCR:', error);
    return NextResponse.json({ error: error.message || 'Erro ao executar OCR' }, { status: 500 });
  }
}
