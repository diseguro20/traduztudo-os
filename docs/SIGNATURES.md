# Arquitetura de Assinaturas Digitais — TraduzTudo OS

Este documento descreve os fluxos, políticas de segurança e a interface modular de assinaturas digitais do TraduzTudo OS.

---

## 1. Princípios de Segurança e Conformidade

Por determinação de segurança e compliance jurídico:

> [!CAUTION] Diretrizes Rígidas de Segurança
> 1. O sistema **NUNCA armazena** senhas pessoais, logins, cookies de sessão, códigos OTP ou 2FA de signatários;
> 2. O sistema **NUNCA armazena** arquivos de certificados privados (.pfx, .p12) ou chaves criptográficas privadas de terceiros;
> 3. O sistema **NUNCA utiliza automação de navegador** (Puppeteer, Selenium, etc.), simulação de cliques ou scraping;
> 4. Todas as operações de assinatura ocorrem **estritamente através de APIs oficiais** fornecidas e homologadas pelos provedores credenciados.

---

## 2. Interface Modular `ISignatureProvider`

O sistema adota o padrão Provider para permitir desacoplamento total da plataforma de assinatura:

```typescript
export interface ISignatureProvider {
  name: string;
  isSandbox: boolean;
  createDocument(input: SignatureDocumentInput): Promise<SignatureProviderDocumentResult>;
  createSigner(signer: SignerConfig): Promise<SignatureProviderSignerResult>;
  addSignerToDocument(params: { documentKey: string; signerKey: string; message?: string }): Promise<{ requestSignatureKey: string; signUrl?: string }>;
  executeAutomaticSignature(params: { documentKey: string; signerKey: string; signer: SignerConfig }): Promise<{ success: boolean; signedAt: string; evidenceData: any }>;
  getDocumentStatus(documentKey: string): Promise<SignatureProviderStatusResult>;
  downloadSignedDocument(documentKey: string): Promise<{ fileBase64OrUrl: string; fileName: string }>;
  processWebhook(payload: any, signatureHeader?: string): Promise<SignatureWebhookResult>;
}
```

---

## 3. Os Dois Fluxos Operacionais

### FLUXO A — Carla Strambio (Assinatura Automática Autorizada)
- **Signatária:** Carla Strambio (Tradutora Titular Especial);
- **Policy:** `AUTO_SIGNATURE`;
- **Mecanismo:** A API oficial do provedor (Clicksign) é acionada com autorização prévia e mandato legal. O documento é enviado, associado à conta dela e a assinatura digital oficial é processada e certificada via API sem interação manual a cada arquivo;
- **Resultado:** Retorno imediato do status `SIGNED` e registro do protocolo de evidências oficial.

### FLUXO B — Outros Tradutores (Assinatura Manual Convocada)
- **Signatários:** Demais tradutores cadastrados e homologados;
- **Policy:** `MANUAL_SIGNATURE`;
- **Mecanismo:** O sistema cria o envelope via API, adiciona o tradutor como signatário e dispara a notificação oficial por e-mail ou WhatsApp;
- **Resultado:** O tradutor clica no link oficial do provedor, realiza a validação de identidade e assina digitalmente. Ao concluir, o webhook notifica o TraduzTudo OS, que baixa o PDF assinado.

---

## 4. Modalidades de Assinatura

1. **Assinatura Eletrônica Avançada:** Em conformidade com a Lei Federal nº 14.063/2020 e MP 2.200-2/2001, utilizando pontos de contato (e-mail, IP, geolocalização e carimbo de tempo);
2. **Certificado Digital ICP-Brasil:** Exigência para traduções com validade pública plena em órgãos que demandam assinatura qualificada ICP-Brasil (A1/A3).
