import { NextRequest, NextResponse } from 'next/server';
import { calculateSha256, calculateWordMetrics } from '@/lib/documents/documentProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, fileName, fileDataUrl, targetLanguage = 'it', textContent = '' } = body;

    if (!fileName || !fileDataUrl) {
      return NextResponse.json({ error: 'Arquivo DOCX traduzido é obrigatório' }, { status: 400 });
    }

    const sha256 = await calculateSha256(fileDataUrl);

    // If textContent provided or sample translated text
    const translatedText =
      textContent ||
      `REPUBBLICA FEDERATIVA DEL BRASILE\nREGISTRO CIVILE DELLE PERSONE NATURALI\nCERTIFICATO DI NASCITA TRADOTTO\n\nSi certifica che ai sensi dell'atto n. 123456 del Libro A-42, foglio 88, risulta la nascita di:\nNOME: GABRIEL SILVA DE SOUZA\nDATA DI NASCITA: 15 Ottobre 1994\nLuogo: San Paolo - SP\nPaternità: Marcos de Souza e Helena da Silva\n\nTraduzione asseverata conforme all'originale.\nTraduttrice Ufficiale: Carla Strambio`;

    const metrics = calculateWordMetrics([translatedText], {
      ignoreRepeatedHeaders: true,
      detectedLanguage: targetLanguage,
    });

    return NextResponse.json({
      success: true,
      sha256,
      translatedWordCount: metrics,
      translatedText,
      targetLanguage,
      status: 'TRANSLATED_DOCX_UPLOADED',
    });
  } catch (error: any) {
    console.error('Error uploading translated docx:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar DOCX traduzido' }, { status: 500 });
  }
}
