# Integração Clicksign — TraduzTudo OS

Este documento detalha as configurações técnicas, credenciais e operação da integração oficial com a Clicksign.

---

## 1. Configuração de Variáveis de Ambiente

As credenciais da Clicksign devem ser configuradas no arquivo `.env.local` (ou painel da Vercel em produção):

```bash
# Define o ambiente: 'sandbox' ou 'production'
CLICKSIGN_ENVIRONMENT=sandbox
NEXT_PUBLIC_SIGNATURE_ENVIRONMENT=sandbox

# Endpoints oficiais
CLICKSIGN_SANDBOX_URL=https://sandbox.clicksign.com/api/v1
CLICKSIGN_PROD_URL=https://app.clicksign.com/api/v1

# Token de Acesso obtido no painel Clicksign (Configurações > API)
CLICKSIGN_ACCESS_TOKEN=seu_access_token_aqui

# Segredo de validação de webhooks (HMAC SHA-256)
CLICKSIGN_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

> [!NOTE] Indicador Visual de Sandbox
> Sempre que `CLICKSIGN_ENVIRONMENT=sandbox`, a interface do TraduzTudo OS exibirá o distintivo amarelo **AMBIENTE DE TESTE (SANDBOX)** para garantir que nenhum operador confunda os ambientes.

---

## 2. Endpoints do TraduzTudo OS

### 1. Solicitação de Assinatura
`POST /api/signatures/request`

**Payload:**
```json
{
  "documentId": "doc-1728250000000",
  "documentVersionId": "ver-1728250000000-5",
  "fileName": "certidao_nascimento_FINAL.pdf",
  "pdfDataUrl": "data:application/pdf;base64,...",
  "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
  "signer": {
    "name": "Carla Strambio",
    "email": "carla.strambio@traduztudo.com",
    "policy": "AUTO_SIGNATURE",
    "signatureType": "ELETRONICA",
    "authMethod": "API_AUTO",
    "isSpecialSigner": true
  }
}
```

### 2. Webhook Listener
`POST /api/webhooks/clicksign`
- Recebe notificações em tempo real de eventos da Clicksign (`upload`, `sent`, `auto_signed`, `signed`, `closed`);
- Executa verificação idempotente para não duplicar eventos ou downloads;
- Registra as evidências completas e atualiza o status do documento para `SIGNED`.

`GET /api/webhooks/clicksign`
- Endpoint de healthcheck para validação rápida de conectividade e status ativo do listener.

---

## 3. Fluxo de Auditoria e Guarda do Arquivo Assinado

Quando um documento é assinado na Clicksign:
1. O PDF assinado contendo os carimbos oficiais e certificação ICP-Brasil é arquivado no repositório;
2. Uma nova versão do documento é gerada com o tipo `SIGNED_PDF` e o hash SHA-256 do arquivo assinado é registrado;
3. O log de auditoria é salvo contendo:
   - Identificador do Envelope na Clicksign;
   - Nome do Signatário e e-mail;
   - Data e hora com fuso horário UTC e carimbo de tempo oficial;
   - Protocolo de certificação digital;
4. O documento fica disponível para download imediato tanto pelo operador interno quanto na tela do cliente.
