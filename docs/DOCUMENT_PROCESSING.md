# Ciclo de Vida e Processamento de Documentos — TraduzTudo OS

Este guia detalha o fluxo de versões, contagem comercial e geração de arquivos no TraduzTudo OS.

---

## 1. Imutabilidade e Integridade Criptográfica (SHA-256)

Para garantir validade jurídica e segurança operacional:
1. O **arquivo original** enviado pelo cliente jamais é sobrescrito ou alterado;
2. Todo arquivo recebido tem seu hash **SHA-256** calculado imediatamente na chegada;
3. Cada etapa subsequente cria uma **nova versão independente** com seu próprio hash SHA-256;
4. O histórico completo de versões permanece auditável no sistema:
   - Versão 1: `ORIGINAL` (SHA-256 original do cliente);
   - Versão 2: `OCR_PDF` (PDF com camada de texto pesquisável);
   - Versão 3: `GENERATED_DOCX` (Word gerado para o tradutor);
   - Versão 4: `TRANSLATED_DOCX` (Word traduzido enviado pelo tradutor);
   - Versão 5: `FINAL_PDF` (PDF final imutável preparado para assinatura);
   - Versão 6: `SIGNED_PDF` (PDF final assinado digitalmente com certificado/evidências).

---

## 2. Máquina de Estados (Pipeline Status)

| Status | Descrição |
|---|---|
| `UPLOADED` | Arquivo recebido e hash SHA-256 gerado |
| `ANALYZING` | Detecção se o PDF é digital ou escaneado em andamento |
| `OCR_PROCESSING` | Reconhecimento óptico de caracteres em execução |
| `OCR_COMPLETED` | OCR finalizado, camada de texto e métricas geradas |
| `DOCX_READY` | Arquivo Word editável (.docx) disponível para download |
| `TRANSLATION_PENDING` | Aguardando tradutor trabalhar e finalizar o arquivo |
| `TRANSLATED_DOCX_UPLOADED` | Word traduzido enviado, gerando nova contagem |
| `FINAL_PDF_READY` | Conversão para PDF final realizada e hash registrado |
| `SIGNATURE_PENDING` | Envelope criado no provedor (Clicksign) aguardando assinatura |
| `SIGNED` | Documento assinado digitalmente e arquivado com evidências |
| `ERROR` | Ocorrência de falha no processamento com detalhes registrados |

---

## 3. Contagem Comercial de Palavras

A precificação e faturamento de traduções dependem de contagens precisas. O sistema fornece métricas completas:

### Métricas Calculadas:
- **Palavras Detectadas:** Total bruto de palavras identificadas no documento;
- **Palavras Ignoradas:** Palavras correspondentes a cabeçalhos e rodapés repetitivos, números de página (ex: "Página 1 de 5") ou marcas d'água recorrentes;
- **Palavras Faturáveis:** Diferença efetiva que representa o conteúdo traduzível real;
- **Caracteres (com e sem espaços):** Fundamental para parâmetros de laudas e precificação por caracteres;
- **Páginas e Linhas:** Distribuição quantitativa detalhada por página.

### Regra de Ouro da Integração com Orçamentos:
O sistema **NÃO modifica automaticamente** os valores do orçamento sem ação explícita do usuário. O operador possui o botão dedicado:
> **USAR CONTAGEM NO ORÇAMENTO**

Ao clicar, o volume faturável é transferido de forma auditada para a quantidade do item de tradução do orçamento, recalculando subtotal e total com segurança.
