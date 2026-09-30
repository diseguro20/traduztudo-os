# TraduzTudo OS — Sistema Operacional SaaS para Empresas de Tradução

> **Gestão inteligente para empresas de traduções juramentadas, certificadas e técnicas.**

[![Production Live](https://img.shields.io/badge/Vercel-traduztudo--os.vercel.app-blue?style=for-the-badge&logo=vercel)](https://traduztudo-os.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-diseguro20%2Ftraduztudo--os-black?style=for-the-badge&logo=github)](https://github.com/diseguro20/traduztudo-os)
[![Firebase Integrated](https://img.shields.io/badge/Firebase-Firestore%20%26%20Storage-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)

---

## 🚀 Links do Projeto

* **Sistema em Produção:** [https://traduztudo-os.vercel.app](https://traduztudo-os.vercel.app)
* **Repositório GitHub:** [https://github.com/diseguro20/traduztudo-os](https://github.com/diseguro20/traduztudo-os)
* **Portal do Cliente:** [https://traduztudo-os.vercel.app/portal](https://traduztudo-os.vercel.app/portal)
* **Aprovação Pública de Orçamento (Exemplo):** [https://traduztudo-os.vercel.app/orcamento/token_abc123_roberto_alencar](https://traduztudo-os.vercel.app/orcamento/token_abc123_roberto_alencar)
* **Site Institucional de Referência:** [https://traduztudo.vercel.app/](https://traduztudo.vercel.app/)

---

## 🛠️ Stack Tecnológica

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
* **Linguagem:** TypeScript 5
* **Estilização & UX/UI:** Tailwind CSS + Design System SaaS moderno (badges, modais, drawers, kanban)
* **Gráficos & BI:** Recharts
* **Banco de Dados & BaaS:** Google Firebase (Firestore multi-tenant particionado por tenantId, Firebase Storage)
* **Deploy & Hospedagem:** Vercel Edge Global Network

---

## 🏛️ Arquitetura Multi-Tenancy

O **TraduzTudo OS** foi construído nativamente com arquitetura multi-tenant escalável:

* Cada empresa cliente é um **Tenant** com identificador único (`tenantId`).
* **Isolamento de dados:** todas as coleções do Firestore são segregadas no caminho:
  ```
  /tenants/{tenantId}/customers
  /tenants/{tenantId}/leads
  /tenants/{tenantId}/services
  /tenants/{tenantId}/quotes
  /tenants/{tenantId}/workOrders
  /tenants/{tenantId}/documents
  /tenants/{tenantId}/accountsReceivable
  /tenants/{tenantId}/accountsPayable
  /tenants/{tenantId}/auditLogs
  ```
* O `tenantId` é resolvido e validado no servidor, impedindo vazamento de dados entre empresas.

---

## 📦 Módulos Implementados

### 1. Dashboard Executivo & Operacional
* Saudação personalizada e seletor de período (Semanal, Mensal, Anual).
* 6 KPI Cards: Faturamento do período, Saldo a receber, Inadimplência/em atraso, Serviços em andamento, Orçamentos pendentes, Novos clientes.
* Gráficos dinâmicos: Faturamento e Recebimentos mensais (AreaChart), Distribuição de serviços por status (PieChart Donut).
* **Seção ATENÇÃO:** alertas em tempo real de OSs com alta prioridade, prazos próximos e tarefas pendentes.
* **Atalho Global (+):** modal rápido para cadastrar novo cliente, lead, orçamento ou registrar pagamento.

### 2. CRM — Pipeline de Leads
* Funil visual em **Kanban** e visualização em **Tabela**.
* Etapas: *Novo Lead*, *Contato Realizado*, *Orçamento Solicitado*, *Orçamento Enviado*, *Negociação*, *Convertido*, *Perdido*.
* Ação de **Conversão com 1 Clique**: cria automaticamente o Cliente, mantém histórico e registra auditoria.

### 3. Gestão Completa de Clientes
* Cadastro para **Pessoa Física (PF)** com validação de CPF e **Pessoa Jurídica (PJ)** com CNPJ e Contato.
* **Dossiê Individual do Cliente (`/crm/clientes/[id]`):**
  * Resumo financeiro (total gasto, saldo a faturar, quantidade de pedidos).
  * Histórico operacional completo (orçamentos, ordens de serviço, títulos financeiros).
  * Linha do tempo de todas as interações.

### 4. Solicitações Inbound do Site TraduzTudo
* Módulo para receber solicitações enviadas pelo site [https://traduztudo.vercel.app/](https://traduztudo.vercel.app/).
* Endpoint seguro: `POST /api/public/requests` com autenticação via cabeçalho `x-api-key`.
* **Transformação em Orçamento com 1 Clique:** pré-carrega os dados do cliente e serviços no elaborador.

### 5. Orçamentos Comerciais
* Numeração automática padronizada: `ORC-000001`.
* Itens dinâmicos: serviço, quantidade, unidade (lauda, palavra, página, hora, serviço fechado), preço unitário, desconto e cálculo automático.
* Geração de link seguro de aprovação pública: `/orcamento/[token]`.

### 6. Aprovação Pública do Orçamento (`/orcamento/[token]`)
* Página branded com logotipo TraduzTudo para visualização pelo cliente final.
* Botão **APROVAR ORÇAMENTO**:
  * Registra data, hora, IP e token.
  * Cria automaticamente a Ordem de Serviço (`OS-00000X`).
  * Cria a Conta a Receber correspondente.
  * Cria o checklist de tarefas padrão da OS.

### 7. Dossiê da Ordem de Serviço (`/operacao/ordens-servico/[id]`)
* A tela central do workflow de tradução.
* **Linha de Progresso Visual:**
  * ✓ Solicitação recebida
  * ✓ Orçamento aprovado
  * ✓ Pagamento recebido
  * ✓ Documentos recebidos
  * ● Tradução em andamento
  * ○ Revisão linguística
  * ○ Finalização e Certificação
  * ○ Entrega ao cliente
* **8 Abas Operacionais:**
  1. *Resumo:* Instruções, contratos e dados gerais.
  2. *Documentos:* Repositório com upload, download e categorização (Original, Trabalho, Tradução, Revisão, Final, Comprovante).
  3. *Tarefas:* Checklist com prazos e responsáveis.
  4. *Tradução:* Área do tradutor juramentado.
  5. *Revisão:* Fila de aprovação do revisor.
  6. *Financeiro:* Títulos vinculados e quitação.
  7. *Comunicação:* Envio direto de mensagens via WhatsApp e E-mail.
  8. *Histórico:* Trilha de auditoria da ordem.

### 8. Financeiro Integrado
* **Contas a Receber:** status (Pendente, Pago, Parcial, Vencido), baixa rápida com sincronização da OS e Dashboard.
* **Contas a Pagar:** controle de honorários de tradutores, taxas cartorárias e despesas fixas.
* **Fluxo de Caixa:** Entradas, Saídas, Saldo Líquido e gráfico comparativo por período.
* **Despesas:** classificação por categorias (marketing, software, contabilidade, impostos, etc.).

### 9. Portal do Cliente (`/portal`)
* Dashboard simplificado para o cliente final acompanhar o andamento dos seus pedidos em tempo real.
* Visualização e aprovação de orçamentos pendentes.
* Download direto das certidões e traduções juramentadas finalizadas.

### 10. Inteligência & BI (`/relatorios`)
* Relatórios de receita por linha de serviço.
* Produtividade de linguistas (ordens ativas e concluídas).
* Exportação em **CSV** com 1 clique.

### 11. Comunicação & WhatsApp API
* `WhatsAppService` com funções para envio de mensagens, templates e links de pagamento PIX.
* Central de notificações internas em tempo real com sininho no cabeçalho.
* Biblioteca de templates de e-mail transacionais.

### 12. Configurações & Auditoria
* Gerenciamento da empresa tenant e plano SaaS.
* **Equipe e RBAC:** perfis `OWNER`, `ADMIN`, `MANAGER`, `FINANCE`, `ATTENDANT`, `TRANSLATOR`, `REVIEWER`, `VIEWER`.
* **Catálogo de Serviços & Idiomas:** parametrização de preços e unidades.
* **Trilha de Auditoria (LGPD):** registro imutável de eventos com data, usuário, entidade e descrição.
* **Busca Global (`Ctrl + K`):** pesquisa instantânea em clientes, orçamentos, ordens de serviço e leads.

---

## 📡 Integração com o Site TraduzTudo

Para que o site público da TraduzTudo envie solicitações diretamente para o sistema, basta disparar um `POST`:

```bash
curl -X POST https://traduztudo-os.vercel.app/api/public/requests \
  -H "Content-Type: application/json" \
  -H "x-api-key: traduztudo-saas-api-secret-key-2026" \
  -d '{
    "name": "Dra. Juliana Paes",
    "email": "juliana@email.com",
    "phone": "(11) 98888-7777",
    "whatsapp": "(11) 98888-7777",
    "service": "Tradução Juramentada",
    "sourceLanguage": "Português",
    "targetLanguage": "Inglês",
    "notes": "Tradução de certidão de nascimento com 2 laudas.",
    "origin": "Site TraduzTudo"
  }'
```

---

## 💻 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/diseguro20/traduztudo-os.git
cd traduztudo-os
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse: `http://localhost:3000`

---

## 📄 Licença
Propriedade privada de **TraduzTudo — Traduções Juramentadas e Certificadas**. Todos os direitos reservados.
