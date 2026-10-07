# Módulo de OCR — TraduzTudo OS

Este documento descreve a arquitetura, funcionamento e diretrizes do motor de Reconhecimento Óptico de Caracteres (OCR) integrado ao TraduzTudo OS.

---

## 1. Visão Geral

O módulo de OCR foi concebido para atender às demandas de documentos corporativos, certidões e traduções juramentadas, garantindo que nenhum documento original seja alterado ou destruído e que as camadas de texto geradas sejam 100% pesquisáveis e indexáveis.

### Fluxo Operacional:
```
Upload do Arquivo (PDF / JPG / PNG / DOCX)
       │
       ▼
Detecção Automática (Digital vs Escaneado)
 ┌─────┴────────────────────────┐
 ▼                              ▼
PDF Digital               PDF Escaneado / Imagem
(Extração Direta)          (OCR Multilíngue)
       │                        │
       └──────────────┬─────────┘
                      ▼
            Extração de Texto
                      ▼
         Contagem de Palavras (Comercial)
                      ▼
            Geração de Word (.docx)
```

---

## 2. Detecção Automática (Digital vs Escaneado)

Antes de executar qualquer processamento pesado de OCR, o sistema inspeciona as streams internas do PDF:
- **PDF com texto digital utilizável:** O sistema marca o status como `OCR_NAO_NECESSARIO`, realiza a extração direta dos vetores de texto e pula a etapa de OCR, otimizando tempo e recursos.
- **PDF escaneado / Imagens raster:** O sistema identifica a ausência de comandos de texto vetoriais e marca o status como `OCR_NECESSARIO`, direcionando para o processamento de imagem e reconhecimento de caracteres.

---

## 3. Idiomas Suportados

O motor suporta os seguintes idiomas principais e suas combinações:

| Código | Idioma | Exemplo de Aplicação |
|---|---|---|
| `por` | Português | Certidões de nascimento, CNH, contratos brasileiros |
| `eng` | Inglês | Diplomas dos EUA/Reino Unido, contratos internacionais |
| `ita` | Italiano | Certidões para cidadania italiana (nascita, matrimonio) |
| `spa` | Espanhol | Documentação da Espanha e América Latina |
| `fra` | Francês | Certificados acadêmicos e civis franceses/canadenses |
| `deu` | Alemão | Certidões e históricos da Alemanha/Áustria/Suíça |

### Combinações Multilíngues:
O sistema aceita múltiplos idiomas no mesmo documento:
- `por+ita`: Muito frequente em processos de cidadania italiana;
- `por+eng`: Muito frequente em contratos de prestação de serviços internacionais;
- `eng+ita`: Documentos corporativos multinacionais.

---

## 4. Tratamento de Qualidade de Imagem

Durante o processamento de OCR, os seguintes filtros são aplicados:
1. **Deskew:** Correção automática de inclinação geométrica do papel;
2. **Rotação Automática:** Detecção de orientação (90º, 180º, 270º) e ajuste vertical;
3. **Remoção de Ruído (Denoise):** Limpeza controlada de pontos e artefatos de digitalização sem danificar caracteres finos;
4. **Preservação Visual:** O PDF de saída mantém a imagem original idêntica, adicionando uma camada invisível de texto pesquisável sobre ela.

---

## 5. Alerta de Qualidade de Formatação

Quando o motor detectar que o documento de origem possui carimbos densos, assinaturas sobrepostas, tabelas com linhas tracejadas ou formatação complexa, o sistema gera o alerta visual:
> ⚠️ **REVISÃO DE FORMATAÇÃO RECOMENDADA**

Isso orienta a equipe interna e os tradutores a realizarem uma conferência manual da diagramação no arquivo Word gerado.
