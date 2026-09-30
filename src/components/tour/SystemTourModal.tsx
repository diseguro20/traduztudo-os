'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  FolderOpen,
  CircleDollarSign,
  Globe,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  RotateCcw,
  Check,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Global Tour Steps traversing our actual system
export interface TourStep {
  id: number;
  route: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  highlightText: string;
  screenDescription: string;
  howToUse: string[];
  businessImpact: string;
  nextLabel: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    route: '/',
    badge: 'Etapa 1 de 7 · Visão Geral',
    title: 'Dashboard Operacional & Indicadores',
    subtitle: 'O centro de comando da sua empresa de traduções em tempo real',
    icon: LayoutDashboard,
    color: 'from-blue-600 to-indigo-600',
    highlightText: 'Painel Central & KPIs',
    screenDescription:
      'Você está na tela inicial do sistema. Aqui você acompanha instantaneamente a performance da empresa através de 6 KPIs estratégicos, o gráfico de evolução de faturamento e a lista de atenção imediata.',
    howToUse: [
      'Observe os 6 cartões no topo: Faturamento Líquido, OS em Andamento, Aguardando Tradutor, Prazos Críticos, Novas Solicitações e Clientes Ativos.',
      'O gráfico central separa as receitas entre Traduções Juramentadas e Traduções Certificadas.',
      'Use o botão "+ Criar" no cabeçalho ou no topo do painel para abrir ações rápidas a qualquer momento.',
    ],
    businessImpact:
      'Garante que nenhum prazo seja perdido e que a diretoria tenha total visibilidade da operação sem depender de reuniões de status.',
    nextLabel: 'Próxima Etapa: Funil de Leads & CRM ➔',
  },
  {
    id: 2,
    route: '/crm/leads',
    badge: 'Etapa 2 de 7 · CRM & Vendas',
    title: 'Pipeline de Leads & Captação pelo Site',
    subtitle: 'Onde chegam os clientes vindos do site público da TraduzTudo',
    icon: Users,
    color: 'from-indigo-600 to-purple-600',
    highlightText: 'Kanban de Leads',
    screenDescription:
      'Esta é a esteira comercial inteligente. Quando um cliente solicita um orçamento no site institucional (traduztudo.vercel.app), os dados e documentos entram automaticamente aqui no status "Novo Lead" via API segura.',
    howToUse: [
      'Visualize o funil com 5 estágios: Novo Lead ➔ Em Contato ➔ Proposta Enviada ➔ Em Negociação ➔ Ganho.',
      'Arraste e solte os cartões para mudar o status de negociação.',
      'Clique em "Gerar Orçamento" no cartão de qualquer lead para transferir automaticamente nome, telefone, idioma e documentos sem redigitação manual!',
    ],
    businessImpact:
      'Reduz o tempo de resposta comercial de 24 horas para menos de 10 minutos, aumentando a taxa de conversão em mais de 40%.',
    nextLabel: 'Próxima Etapa: Elaborador de Orçamento ➔',
  },
  {
    id: 3,
    route: '/operacao/orcamentos/novo',
    badge: 'Etapa 3 de 7 · Comercial & Propostas',
    title: 'Elaborador Rápido de Orçamentos',
    subtitle: 'Cálculo automático por lauda, palavra ou documento com prazos flexíveis',
    icon: FileSpreadsheet,
    color: 'from-amber-500 to-amber-700',
    highlightText: 'Novo Orçamento',
    screenDescription:
      'Chega de planilhas manuais propensas a erros. Aqui você monta orçamentos profissionais em segundos. O sistema aplica tabelas oficiais da Junta Comercial e calcula o valor total automaticamente.',
    howToUse: [
      'Selecione o Cliente (Pessoa Física ou Jurídica). O sistema puxa os dados fiscais na hora.',
      'Adicione os itens do serviço: informe a quantidade de laudas/palavras e o par de idiomas. O valor unitário e subtotal são calculados ao vivo.',
      'Configure prazos normais ou taxa de urgência (Express 24h) e adicione serviços extras como Apostilamento de Haia.',
      'Ao salvar, o sistema gera um código sequencial (ex: ORC-000042) e um link público exclusivo para o cliente aprovar!',
    ],
    businessImpact:
      'Elimina divergências de valores, padroniza a precificação e gera a proposta com apresentação visual de alto padrão.',
    nextLabel: 'Próxima Etapa: Ver Tela de Aprovação do Cliente ➔',
  },
  {
    id: 4,
    route: '/orcamento/token_abc123_roberto_alencar',
    badge: 'Etapa 4 de 7 · Experiência do Cliente',
    title: 'Aprovação Digital do Orçamento (Sem Senha)',
    subtitle: 'Link seguro que o cliente recebe no WhatsApp ou E-mail para dar o aceite',
    icon: CheckCircle2,
    color: 'from-emerald-500 to-teal-700',
    highlightText: 'Página Pública da Proposta',
    screenDescription:
      'Esta é a página real que o seu cliente visualiza ao clicar no link recebido. Não exige senha ou cadastro prévio: é 100% focada em converter e facilitar o fechamento.',
    howToUse: [
      'Observe o visual limpo com logotipo da TraduzTudo, detalhamento dos documentos, prazos de entrega e condições comerciais.',
      'O cliente confere o valor e clica no botão verde "APROVAR ORÇAMENTO".',
      'No momento da aprovação, o sistema grava o endereço IP do cliente, a data e o horário exato, garantindo respaldo jurídico e conformidade legal.',
    ],
    businessImpact:
      'A aprovação pelo cliente cria no mesmo segundo a Ordem de Serviço (OS) na esteira operacional e gera o lançamento financeiro a receber, sem qualquer intervenção humana!',
    nextLabel: 'Próxima Etapa: Dossiê da Ordem de Serviço ➔',
  },
  {
    id: 5,
    route: '/operacao/ordens-servico/order-001',
    badge: 'Etapa 5 de 7 · Produção & Operação',
    title: 'Central Operacional: Dossiê da OS',
    subtitle: 'Linha de progresso com 8 etapas e controle minucioso da confecção da tradução',
    icon: FolderOpen,
    color: 'from-purple-600 to-indigo-700',
    highlightText: 'Dossiê da OS-000001',
    screenDescription:
      'Este é o coração operacional da empresa. Aqui a equipe gerencia cada detalhe da execução da tradução juramentada com fé pública ou certificada.',
    howToUse: [
      'À direita, observe a Linha de Progresso Visual com as 8 fases: Triagem ➔ Alocação ➔ Em Tradução ➔ Revisão ➔ Diagramação ➔ Assinatura Juramentada ➔ Pronto ➔ Entregue.',
      'À esquerda, navegue pelas 8 abas: Visão Geral, Documentos (originais e minutas), Tradutores Designados, Revisores, Tarefas, Financeiro e Auditoria.',
      'Atribua o tradutor juramentado matriculado na Junta Comercial e anexe o certificado digital ICP-Brasil.',
    ],
    businessImpact:
      'Rastreabilidade total: cada documento passa por dupla checagem terminológica antes de receber a chancela oficial, garantindo padrão consular.',
    nextLabel: 'Próxima Etapa: Gestão Financeira ➔',
  },
  {
    id: 6,
    route: '/financeiro/contas-receber',
    badge: 'Etapa 6 de 7 · Financeiro Integrado',
    title: 'Contas a Receber & Conciliação em 1 Clique',
    subtitle: 'Lançamentos gerados automaticamente a partir das OSs aprovadas',
    icon: CircleDollarSign,
    color: 'from-emerald-600 to-emerald-800',
    highlightText: 'Módulo Financeiro',
    screenDescription:
      'Chega de esquecer cobranças ou perder dinheiro. Todas as ordens de serviço aprovadas criam títulos automáticos no Contas a Receber.',
    howToUse: [
      'Acompanhe os títulos classificados por status: A Receber, Recebido, Atrasado ou Cancelado.',
      'Quando o cliente efetua o pagamento via Pix, Boleto ou Cartão, clique no botão "Receber" para dar baixa instantânea.',
      'Ao dar baixa, o status da OS muda automaticamente para "Pago" e o Fluxo de Caixa é recalculado em tempo real.',
      'Acesse também o menu "Contas a Pagar" para controlar os repasses devidos aos tradutores juramentados por lauda.',
    ],
    businessImpact:
      'Conciliação ágil, controle rigoroso de inadimplência e emissão simplificada de notas fiscais com zero retrabalho.',
    nextLabel: 'Próxima Etapa: Portal do Cliente ➔',
  },
  {
    id: 7,
    route: '/portal',
    badge: 'Etapa 7 de 7 · Pós-Venda & Autoatendimento',
    title: 'Portal do Cliente & Download com Fé Pública',
    subtitle: 'Área exclusiva onde o cliente acompanha pedidos e baixa arquivos autenticados',
    icon: Globe,
    color: 'from-blue-700 to-slate-900',
    highlightText: 'Portal do Cliente',
    screenDescription:
      'A experiência do seu cliente não termina no pagamento. Neste portal exclusivo de autoatendimento, ele possui acesso permanente a todos os serviços contratados.',
    howToUse: [
      'O cliente visualiza seus pedidos ativos e o status exato da confecção de cada documento.',
      'Ao término do serviço, ele faz o download direto da certidão juramentada oficial em PDF.',
      'Cada certidão possui carimbo notarial, assinatura digital ICP-Brasil e QR Code escaneável para validação de autenticidade perante consulados e embaixadas.',
      'O cliente pode solicitar novas traduções com 1 clique, gerando recompra contínua para a sua empresa.',
    ],
    businessImpact:
      'Transmite credibilidade de nível internacional, reduz ligações e mensagens de cobrança de prazo no WhatsApp e fideliza o cliente corporativo.',
    nextLabel: 'Concluir Tour com Sucesso 🎉',
  },
];

export function SystemTourModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthetic sound effects
  const playSfx = (type: 'next' | 'complete' | 'open') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'next') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'complete') {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
      }
    } catch {
      // AudioContext failure safety
    }
  };

  // Check URL triggers and localStorage
  useEffect(() => {
    // If URL has ?tour=true or ?step=X
    const tourParam = searchParams.get('tour');
    const stepParam = searchParams.get('step');

    if (tourParam === 'true' || pathname === '/tutorial') {
      const initialStep = stepParam ? Math.max(0, Math.min(TOUR_STEPS.length - 1, parseInt(stepParam) - 1)) : 0;
      setCurrentStepIndex(initialStep);
      setIsOpen(true);
      setIsMinimized(false);
      localStorage.setItem('traduztudo_tour_active', 'true');
      localStorage.setItem('traduztudo_tour_step', initialStep.toString());

      // If user landed directly on /tutorial, redirect to the step's route (e.g. / for step 1)
      if (pathname === '/tutorial') {
        router.replace(TOUR_STEPS[initialStep].route);
      }
      return;
    }

    // Check localStorage if tour was in progress
    const wasActive = localStorage.getItem('traduztudo_tour_active');
    const savedStep = localStorage.getItem('traduztudo_tour_step');
    if (wasActive === 'true' && savedStep !== null) {
      const idx = parseInt(savedStep, 10);
      if (!isNaN(idx) && idx >= 0 && idx < TOUR_STEPS.length) {
        setCurrentStepIndex(idx);
        setIsOpen(true);
      }
    }
  }, [pathname, searchParams, router]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Navigate to Next Step
  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      localStorage.setItem('traduztudo_tour_step', nextIndex.toString());
      playSfx('next');

      // Navigate to the next step's actual screen in our SaaS
      const nextRoute = TOUR_STEPS[nextIndex].route;
      router.push(nextRoute);
    } else {
      // Completed last step!
      playSfx('complete');
      handleFinish();
    }
  };

  // Navigate to Previous Step
  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      localStorage.setItem('traduztudo_tour_step', prevIndex.toString());
      playSfx('next');

      const prevRoute = TOUR_STEPS[prevIndex].route;
      router.push(prevRoute);
    }
  };

  // Close / Skip tour
  const handleClose = () => {
    setIsOpen(false);
    localStorage.removeItem('traduztudo_tour_active');
    localStorage.removeItem('traduztudo_tour_step');
  };

  // Finish tour completely
  const handleFinish = () => {
    setIsOpen(false);
    localStorage.removeItem('traduztudo_tour_active');
    localStorage.removeItem('traduztudo_tour_step');
    router.push('/');
  };

  // Open tour from anywhere
  const startTour = (stepIdx: number = 0) => {
    setCurrentStepIndex(stepIdx);
    setIsOpen(true);
    setIsMinimized(false);
    localStorage.setItem('traduztudo_tour_active', 'true');
    localStorage.setItem('traduztudo_tour_step', stepIdx.toString());
    router.push(TOUR_STEPS[stepIdx].route);
  };

  // Listen to custom window event to trigger tour from buttons
  useEffect(() => {
    const handleTriggerTour = (e: CustomEvent) => {
      const step = e.detail?.step || 0;
      startTour(step);
    };
    window.addEventListener('traduztudo:start-tour' as unknown as keyof WindowEventMap, handleTriggerTour as EventListener);
    return () => {
      window.removeEventListener('traduztudo:start-tour' as unknown as keyof WindowEventMap, handleTriggerTour as EventListener);
    };
  }, []);

  const progressPercent = Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100);
  const StepIcon = currentStep?.icon || Sparkles;

  return (
    <>
      {/* ========================================================================= */}
      {/* FLOATING QUICK LAUNCHER PILL (ALWAYS VISIBLE IN BOTTOM-RIGHT CORNER)       */}
      {/* ========================================================================= */}
      {(!isOpen || isMinimized) && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-2xl shadow-blue-500/40 border border-blue-400/40 transition-all hover:scale-105 active:scale-95 group"
            title="Abrir Tour Guiado por Pop-ups"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
            <span>
              Tour Guiado {isOpen ? `(Etapa ${currentStepIndex + 1}/7)` : 'Passo a Passo'}
            </span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE POP-UP TOUR MODAL OVER OUR REAL SYSTEM                        */}
      {/* ========================================================================= */}
      {isOpen && !isMinimized && currentStep && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 pointer-events-none">
          {/* Subtle Dimmed Backdrop that lets user see the real screen behind */}
          <div
            onClick={() => setIsMinimized(true)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1.5px] pointer-events-auto transition-opacity"
          />

          {/* The Active Pop-up Card */}
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-blue-600/40 overflow-hidden pointer-events-auto flex flex-col z-10 animate-in zoom-in-95 duration-200">
            {/* Top Color Accent Bar & Progress */}
            <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Header of Pop-up */}
            <div className="px-5 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${currentStep.color} flex items-center justify-center text-white shadow-md shadow-blue-500/20`}
                >
                  <StepIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                    {currentStep.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Progresso do Tour: <b className="text-slate-800">{progressPercent}%</b>
                  </span>
                </div>
              </div>

              {/* Utility controls: Sound, Minimize, Close */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  title={soundEnabled ? 'Desativar Som' : 'Ativar Som'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  title="Minimizar Pop-up para Ver a Tela"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Encerrar Tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body of Pop-up */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title & Subtitle */}
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{currentStep.title}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Spotlight / Context box */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-950 space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-800 font-bold text-[11px] uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>O que você está vendo na tela atrás deste pop-up:</span>
                </div>
                <p className="leading-relaxed text-slate-700">
                  {currentStep.screenDescription}
                </p>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Como usar e operar esta etapa passo a passo:
                </span>
                <div className="space-y-1.5">
                  {currentStep.howToUse.map((instruction, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed flex-1">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Impact Box */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900">Impacto para o Negócio e para o Lead: </span>
                  <span className="text-emerald-800">{currentStep.businessImpact}</span>
                </div>
              </div>
            </div>

            {/* Footer Navigation Buttons */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="gap-1.5 text-xs text-slate-700 disabled:opacity-30"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </Button>

                <button
                  onClick={handleClose}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                >
                  Pular Tour
                </button>
              </div>

              {/* Next Step Button (Switches Page & Advances Step) */}
              <Button
                size="sm"
                onClick={handleNext}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95"
              >
                <span>{currentStep.nextLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Global helper to trigger the tour from any component
export function launchSystemTour(stepIndex: number = 0) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('traduztudo:start-tour', {
      detail: { step: stepIndex },
    });
    window.dispatchEvent(event);
  }
}
