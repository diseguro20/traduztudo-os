'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Inbox,
  FileSpreadsheet,
  FileCheck2,
  DollarSign,
  Users,
  ShieldCheck,
  ExternalLink,
  Layers,
  Clock,
  Play,
  Check,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const STEPS = [
  {
    id: 1,
    title: 'Recepção de Demanda pelo Site Público',
    subtitle: 'Integração Inbound API & Funil CRM',
    tag: 'Etapa 1: Inbound & Leads',
    color: 'from-blue-600 to-indigo-600',
    description:
      'Toda a jornada começa quando um cliente (Pessoa Física ou Empresa) preenche a solicitação no site oficial da TraduzTudo (https://traduztudo.vercel.app/). O site envia um POST para nossa API protegida, cadastrando a solicitação e abrindo um Lead instantaneamente.',
    details: [
      'Endpoint integrado: POST /api/public/requests com x-api-key.',
      'O lead entra automaticamente no Pipeline CRM como "Novo Lead".',
      'Com apenas 1 clique em "Gerar Orçamento", todos os dados do cliente e serviços são transferidos sem retrabalho.',
    ],
    route: '/operacao/solicitacoes',
    routeLabel: 'Ver Solicitações do Site',
  },
  {
    id: 2,
    title: 'Elaboração Rápida de Orçamentos Comerciais',
    subtitle: 'Cálculo Automático por Lauda, Palavra ou Documento',
    tag: 'Etapa 2: Orçamentos Inteligentes',
    color: 'from-amber-500 to-amber-700',
    description:
      'Chega de planilhas manuais propensas a erros. No elaborador de propostas, o sistema atribui o código sequencial (ex: ORC-000001), calcula o valor exato multiplicando a quantidade de laudas/palavras pelo preço cadastrado, abate descontos e define o prazo de entrega.',
    details: [
      'Multi-itens dinâmicos para incluir traduções e apostilamento no mesmo orçamento.',
      'Validação de prazos e condições de faturamento flexíveis.',
      'Geração de link exclusivo e seguro para o cliente aprovar digitalmente.',
    ],
    route: '/operacao/orcamentos/novo',
    routeLabel: 'Ir para Elaborador de Orçamentos',
  },
  {
    id: 3,
    title: 'Aprovação Digital pelo Cliente',
    subtitle: 'Página Pública Branded com 1 Clique',
    tag: 'Etapa 3: Aprovação & Contrato',
    color: 'from-emerald-500 to-teal-700',
    description:
      'O cliente recebe o link seguro (/orcamento/[token]) em seu WhatsApp ou E-mail. Ele visualiza uma proposta premium com o logotipo da TraduzTudo, detalhamento dos itens e clica em "APROVAR ORÇAMENTO".',
    details: [
      'Registra data, hora, IP de aprovação para respaldo jurídico e compliance.',
      'Cria automaticamente a Ordem de Serviço (OS-00000X) sem intervenção manual.',
      'Gera a cobrança imediata no Contas a Receber e notifica a equipe interna.',
    ],
    route: '/orcamento/token_abc123_roberto_alencar',
    routeLabel: 'Visualizar Tela de Aprovação Digital',
  },
  {
    id: 4,
    title: 'Dossiê da Ordem de Serviço & Produção',
    subtitle: 'Linha de Progresso Visual e 8 Abas Operacionais',
    tag: 'Etapa 4: Coração Operacional',
    color: 'from-purple-600 to-indigo-700',
    description:
      'O Dossiê da OS (/operacao/ordens-servico/[id]) é a central de comando da tradução. À direita, a Linha de Progresso com 8 etapas acompanha o avanço do pedido. À esquerda, 8 abas controlam documentos, tarefas, tradutores e revisores.',
    details: [
      'Atribuição de tradutores juramentados e revisores credenciados.',
      'Upload e versionamento de arquivos (Original, Minuta, Revisão, Final).',
      'Checklist de validação com prazos antes da liberação final ao cliente.',
    ],
    route: '/operacao/ordens-servico/order-001',
    routeLabel: 'Abrir Dossiê da OS-000001',
  },
  {
    id: 5,
    title: 'Controle Financeiro & Fluxo de Caixa',
    subtitle: 'Contas a Receber, Pagar e Conciliação Instantânea',
    tag: 'Etapa 5: Financeiro Conectado',
    color: 'from-emerald-600 to-emerald-800',
    description:
      'Toda movimentação financeira é sincronizada em tempo real. Ao registrar um pagamento via PIX, o sistema atualiza o saldo do cliente, altera o status da OS para "Pago" e recalcula os gráficos de receitas e fluxo de caixa.',
    details: [
      'Contas a Receber com baixa com 1 clique.',
      'Contas a Pagar para repasse dos honorários aos tradutores e custos de cartório.',
      'Demonstrativo do Fluxo de Caixa com Entradas, Saídas e Saldo Líquido.',
    ],
    route: '/financeiro/contas-receber',
    routeLabel: 'Acessar Módulo Financeiro',
  },
  {
    id: 6,
    title: 'Portal do Cliente & Entrega Certificada',
    subtitle: 'Download Seguro de Certidões e Histórico',
    tag: 'Etapa 6: Pós-Venda & Retenção',
    color: 'from-blue-700 to-slate-900',
    description:
      'Seu cliente possui um portal dedicado (/portal) onde acompanha seus pedidos ativos, visualiza orçamentos pendentes e faz o download direto dos arquivos finais certificados digitalmente com fé pública.',
    details: [
      'Acesso seguro sem fricção, fortalecendo a confiança na marca.',
      'Histórico permanente de todas as certidões e recibos.',
      'Canal de recontratação direta para novas traduções.',
    ],
    route: '/portal',
    routeLabel: 'Ver Portal do Cliente',
  },
];

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const active = STEPS[currentStep];

  // Interactive Mini Simulators
  const [laudasInput, setLaudasInput] = useState(10);
  const [discountInput, setDiscountInput] = useState(50);
  const [simulatedApprove, setSimulatedApprove] = useState(false);
  const [osStatusIdx, setOsStatusIdx] = useState(0);
  const osStatuses = ['Em Tradução', 'Em Revisão', 'Finalização', 'Pronto para Entrega', 'Entregue'];

  const calculatedTotal = Math.max(0, laudasInput * 95 - discountInput);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Treinamento & Capacitação Operacional
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tutorial Interativo do TraduzTudo OS
            </h1>
            <p className="text-xs sm:text-sm text-blue-200">
              Aprenda a operar o ciclo completo da empresa em 6 etapas práticas guiadas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white/10 text-emerald-400 border border-white/10">
              Etapa {currentStep + 1} de {STEPS.length} ({Math.round(((currentStep + 1) / STEPS.length) * 100)}%)
            </span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps Pill Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((step, idx) => {
          const isSelected = idx === currentStep;
          const isCompleted = idx < currentStep;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-102 font-bold'
                  : isCompleted
                  ? 'bg-white text-slate-800 border-emerald-300 hover:border-blue-400 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span>0{step.id}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <p className="text-xs truncate">{step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}</p>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Guide Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              {active.tag}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{active.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{active.subtitle}</p>
          </div>

          <Link href={active.route} target="_blank">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
              <span>{active.routeLabel}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Narrative Description */}
        <p className="text-sm text-slate-700 leading-relaxed">{active.description}</p>

        {/* Key Takeaways */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {active.details.map((detail, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{detail}</span>
            </div>
          ))}
        </div>

        {/* Interactive Hands-On Sandbox for specific steps */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Experimente na Prática (Simulador Interativo)
            </span>
            <span className="text-[10px] text-slate-400">Ambiente de teste ao vivo</span>
          </div>

          {currentStep === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Veja como uma solicitação do site entra no sistema com todos os metadados:
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-white">Dra. Camila Drummond — Inventário Internacional</p>
                  <p className="text-slate-400 text-[11px]">Tradução Juramentada + Apostilamento (Português → Espanhol)</p>
                </div>
                <Link href="/operacao/solicitacoes">
                  <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-500">
                    Abrir Fila de Solicitações →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Altere a quantidade de laudas ou o desconto para testar a precificação instantânea:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Laudas (R$ 95/lauda):</label>
                  <input
                    type="number"
                    value={laudasInput}
                    onChange={(e) => setLaudasInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Desconto (R$):</label>
                  <input
                    type="number"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Total Calculado:</label>
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 font-bold text-emerald-400">
                    R$ {calculatedTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Simule o clique do cliente na tela de aprovação digital:
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-white">Proposta ORC-000001 (Dr. Roberto Alencar)</p>
                  <p className="text-slate-400 text-[11px]">Valor: R$ 1.850,00 • Validade 15 dias</p>
                </div>
                {!simulatedApprove ? (
                  <Button
                    size="sm"
                    onClick={() => setSimulatedApprove(true)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500"
                  >
                    Simular Aprovação do Cliente
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> OS-000001 Gerada com Sucesso!
                  </span>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Avançar o status da Ordem de Serviço na esteira de produção:
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">Status Atual da Produção:</p>
                  <p className="font-bold text-purple-400 text-sm">{osStatuses[osStatusIdx]}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setOsStatusIdx((prev) => (prev + 1) % osStatuses.length)}
                  className="text-xs bg-purple-600 hover:bg-purple-500"
                >
                  Avançar Etapa da OS →
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                O módulo financeiro liquida recebimentos de clientes e programa pagamentos para tradutores sem planilhas externas.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Link href="/financeiro/contas-receber">
                  <Button size="sm" variant="outline" className="w-full text-xs text-slate-200 border-slate-700 hover:bg-slate-800">
                    Contas a Receber (PIX) →
                  </Button>
                </Link>
                <Link href="/financeiro/fluxo-caixa">
                  <Button size="sm" variant="outline" className="w-full text-xs text-slate-200 border-slate-700 hover:bg-slate-800">
                    Fluxo de Caixa Consolidado →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-2 text-center py-2">
              <p className="text-xs text-emerald-400 font-bold">
                ✓ Todo o fluxo operacional foi dominado com sucesso!
              </p>
              <p className="text-xs text-slate-400">
                Você pode utilizar este tutorial sempre que novos membros ingressarem na equipe.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Nav Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
            className="text-xs gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Etapa Anterior
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((c) => Math.min(STEPS.length - 1, c + 1))}
              className="text-xs gap-1 bg-blue-600 hover:bg-blue-700"
            >
              Próxima Etapa <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Link href="/">
              <Button className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold">
                <Check className="w-4 h-4" /> Concluir e Ir ao Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
