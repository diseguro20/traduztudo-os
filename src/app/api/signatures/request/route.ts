import { NextRequest, NextResponse } from 'next/server';
import { clicksignProvider } from '@/lib/signatures/ClicksignSignatureProvider';
import { SignerConfig, SignatureRequest, SignatureOverallStatus } from '@/types';
import { databaseStore } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const config = databaseStore.getClicksignConfig();
    clicksignProvider.configure(config);

    const body = await req.json();
    const {
      documentId,
      documentVersionId,
      fileName,
      pdfDataUrl,
      sha256,
      signer,
    }: {
      documentId: string;
      documentVersionId: string;
      fileName: string;
      pdfDataUrl: string;
      sha256: string;
      signer: SignerConfig;
    } = body;

    if (!documentId || !fileName || !pdfDataUrl || !signer) {
      return NextResponse.json({ error: 'Parâmetros incompletos para solicitação de assinatura' }, { status: 400 });
    }

    // 1. Create Document in Clicksign
    const docResult = await clicksignProvider.createDocument({
      fileName,
      fileBase64OrUrl: pdfDataUrl,
      sha256,
      documentId,
      folderPath: 'traduztudo/oficiais',
    });

    // 2. Create Signer in Clicksign
    const signerResult = await clicksignProvider.createSigner(signer);

    // 3. Add Signer to Document
    const listResult = await clicksignProvider.addSignerToDocument({
      documentKey: docResult.documentKey,
      signerKey: signerResult.signerKey,
      message: `Assinatura de tradução oficial TraduzTudo: ${fileName}`,
    });

    const isAuto = signer.policy === 'AUTO_SIGNATURE';
    let overallStatus: SignatureOverallStatus = 'SENT';
    let autoEvidence: any = null;
    let signedAt: string | undefined = undefined;

    // 4. If FLUXO A (Carla Strambio / AUTO_SIGNATURE), execute immediate authorized auto-signature via API
    if (isAuto) {
      const autoResult = await clicksignProvider.executeAutomaticSignature({
        documentKey: docResult.documentKey,
        signerKey: signerResult.signerKey,
        signer,
      });

      if (autoResult.success) {
        overallStatus = 'SIGNED';
        autoEvidence = autoResult.evidenceData;
        signedAt = autoResult.signedAt;
      }
    }

    const signatureRequest: SignatureRequest = {
      id: `sig_req_${Date.now()}`,
      documentId,
      documentVersionId,
      provider: 'clicksign',
      envelopeId: docResult.envelopeId,
      externalDocumentKey: docResult.documentKey,
      status: overallStatus,
      environment: clicksignProvider.isSandbox ? 'sandbox' : 'production',
      sentAt: new Date().toISOString(),
      completedAt: signedAt,
      signers: [
        {
          signer,
          status: overallStatus === 'SIGNED' ? 'SIGNED' : 'SENT',
          externalSignerKey: signerResult.signerKey,
          signUrl: listResult.signUrl || signerResult.signUrl,
          signedAt,
        },
      ],
      rawAuditLog: JSON.stringify({
        provider: 'Clicksign API v1',
        environment: clicksignProvider.getEnvironmentLabel(),
        policy: signer.policy,
        signer: signer.name,
        documentKey: docResult.documentKey,
        autoEvidence,
      }),
    };

    return NextResponse.json({
      success: true,
      signatureRequest,
      isSandbox: clicksignProvider.isSandbox,
      environmentLabel: clicksignProvider.getEnvironmentLabel(),
      status: overallStatus,
      signUrl: listResult.signUrl || signerResult.signUrl,
    });
  } catch (error: any) {
    console.error('Error requesting digital signature:', error);
    return NextResponse.json({ error: error.message || 'Erro ao solicitar assinatura' }, { status: 500 });
  }
}
