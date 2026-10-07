import { SignerConfig, SignatureOverallStatus, SignatureRequest } from '@/types';

export interface SignatureDocumentInput {
  fileName: string;
  fileBase64OrUrl: string;
  sha256: string;
  folderPath?: string;
  documentId: string;
}

export interface SignatureProviderDocumentResult {
  documentKey: string;
  envelopeId?: string;
  uploadStatus: string;
}

export interface SignatureProviderSignerResult {
  signerKey: string;
  signUrl?: string;
}

export interface SignatureProviderStatusResult {
  status: SignatureOverallStatus;
  signedFileUrl?: string;
  evidenceUrl?: string;
  signers: Array<{
    email: string;
    signerKey: string;
    status: 'PENDING' | 'SENT' | 'SIGNED' | 'REJECTED';
    signedAt?: string;
    signUrl?: string;
  }>;
}

export interface SignatureWebhookResult {
  handled: boolean;
  event: string;
  documentKey?: string;
  isCompleted: boolean;
  signedFileUrl?: string;
  evidenceUrl?: string;
  auditMessage: string;
  rawPayload: any;
}

export interface ISignatureProvider {
  name: string;
  isSandbox: boolean;
  getEnvironmentLabel(): string;

  createDocument(input: SignatureDocumentInput): Promise<SignatureProviderDocumentResult>;
  createSigner(signer: SignerConfig): Promise<SignatureProviderSignerResult>;
  addSignerToDocument(params: {
    documentKey: string;
    signerKey: string;
    message?: string;
  }): Promise<{ requestSignatureKey: string; signUrl?: string }>;
  executeAutomaticSignature(params: {
    documentKey: string;
    signerKey: string;
    signer: SignerConfig;
  }): Promise<{ success: boolean; signedAt: string; evidenceData: any }>;
  getDocumentStatus(documentKey: string): Promise<SignatureProviderStatusResult>;
  downloadSignedDocument(documentKey: string): Promise<{ fileBase64OrUrl: string; fileName: string }>;
  processWebhook(payload: any, signatureHeader?: string): Promise<SignatureWebhookResult>;
}
