'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface SimpleTourStep {
  id: number;
  route: string;
  tabName: string;
  title: string;
  actionText: string;
  tipText: string;
  nextLabel: string;
}

export const SIMPLE_STEPS: SimpleTourStep[] = [
  {
    id: 1,
    route: '/',
    tabName: 'Aba: Dashboard / Visão Geral',
    title: 'Acompanhe Indicadores e Faturamento',
    actionText: 'Confira nos 6 cartões do topo o faturamento do mês e as 24 ordens ativas.',
    tipText: 'Use o botão "+ Criar" no cabeçalho sempre que quiser iniciar uma nova ação rápida.',
    nextLabel: 'Ir para Aba de Leads ➔',
  },
  {
    id: 2,
    route: '/crm/leads',
    tabName: 'Aba: CRM & Vendas ➔ Leads',
    title: 'Receba Clientes Vindos do Site',
    actionText: 'Quem pede orçamento no site entra direto na coluna "Novo Lead" com prioridade.',
    tipText: 'Clique em "Gerar Orçamento" no cartão para abrir a proposta sem redigitar nada!',
    nextLabel: 'Ir para Elaborar Orçamento ➔',
  },
  {
    id: 3,
    route: '/operacao/orcamentos/novo',
    tabName: 'Aba: Operação ➔ Novo Orçamento',
    title: 'Calcule o Preço das Laudas em Segundos',
    actionText: 'Selecione o cliente e informe a quantidade de laudas. O valor total é calculado na hora.',
    tipText: 'Ao salvar, o sistema gera um link seguro para o cliente aprovar direto pelo WhatsApp.',
    nextLabel: 'Ver Aprovação do Cliente ➔',
  },
  {
    id: 4,
    route: '/orcamento/token_abc123_roberto_alencar',
    tabName: 'Aba: Tela de Aceite do Cliente',
    title: 'Aprovação Digital com 1 Clique (Sem Senha)',
    actionText: 'O cliente confere a proposta e clica no botão verde "Aprovar Orçamento".',
    tipText: 'A aprovação registra o IP do cliente e cria a Ordem de Serviço na mesma hora.',
    nextLabel: 'Ir para Dossiê da OS ➔',
  },
  {
    id: 5,
    route: '/operacao/ordens-servico/order-001',
    tabName: 'Aba: Operação ➔ Dossiê da OS',
    title: 'Produção da Tradução em 8 Fases',
    actionText: 'Acompanhe o avanço na barra à direita (Tradução ➔ Revisão ➔ Diagramação ➔ Assinatura).',
    tipText: 'Na aba Tradutores, designe o profissional que assinará digitalmente com Fé Pública.',
    nextLabel: 'Ir para Financeiro ➔',
  },
  {
    id: 6,
    route: '/financeiro/contas-receber',
    tabName: 'Aba: Financeiro ➔ Contas a Receber',
    title: 'Cobrança Automática e Baixa em 1 Clique',
    actionText: 'O valor da OS aprovada aparece aqui. Quando o cliente pagar via Pix, clique em "Receber".',
    tipText: 'Ao dar baixa, o status da OS muda para "Pago" e o fluxo de caixa atualiza sozinho.',
    nextLabel: 'Ir para Portal do Cliente ➔',
  },
  {
    id: 7,
    route: '/portal',
    tabName: 'Aba: Portal do Cliente',
    title: 'Download Oficial com Selo e QR Code',
    actionText: 'O cliente acessa este portal para baixar o PDF traduzido com fé pública e validade consular.',
    tipText: 'Ele também pode solicitar novas traduções a qualquer momento com apenas 1 clique.',
    nextLabel: 'Concluir Tour 🎉',
  },
];

export function SystemTourModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('traduztudo_tour_pill_dismissed') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const playSfx = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'suspended') ctx.resume();
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(560, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // Ignore audio failure
    }
  };

  useEffect(() => {
    const tourParam = searchParams.get('tour');
    const stepParam = searchParams.get('step');

    if (tourParam === 'true' || pathname === '/tutorial') {
      const idx = stepParam ? Math.max(0, Math.min(SIMPLE_STEPS.length - 1, parseInt(stepParam) - 1)) : 0;
      setCurrentStepIndex(idx);
      setIsOpen(true);
      localStorage.setItem('traduztudo_tour_active', 'true');
      localStorage.setItem('traduztudo_tour_step', idx.toString());

      if (pathname === '/tutorial') {
        router.replace(SIMPLE_STEPS[idx].route);
      }
      return;
    }

    const wasActive = localStorage.getItem('traduztudo_tour_active');
    const savedStep = localStorage.getItem('traduztudo_tour_step');
    if (wasActive === 'true' && savedStep !== null) {
      const idx = parseInt(savedStep, 10);
      if (!isNaN(idx) && idx >= 0 && idx < SIMPLE_STEPS.length) {
        setCurrentStepIndex(idx);
        setIsOpen(true);
      }
    }
  }, [pathname, searchParams, router]);

  const currentStep = SIMPLE_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < SIMPLE_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      localStorage.setItem('traduztudo_tour_step', nextIdx.toString());
      playSfx();
      router.push(SIMPLE_STEPS[nextIdx].route);
    } else {
      handleClose();
      router.push('/');
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      localStorage.setItem('traduztudo_tour_step', prevIdx.toString());
      playSfx();
      router.push(SIMPLE_STEPS[prevIdx].route);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.removeItem('traduztudo_tour_active');
    localStorage.removeItem('traduztudo_tour_step');
  };

  const startTour = (stepIdx: number = 0) => {
    setCurrentStepIndex(stepIdx);
    setIsOpen(true);
    localStorage.setItem('traduztudo_tour_active', 'true');
    localStorage.setItem('traduztudo_tour_step', stepIdx.toString());
    router.push(SIMPLE_STEPS[stepIdx].route);
  };

  useEffect(() => {
    const handleTrigger = (e: CustomEvent) => {
      startTour(e.detail?.step || 0);
    };
    window.addEventListener('traduztudo:start-tour' as unknown as keyof WindowEventMap, handleTrigger as EventListener);
    return () => {
      window.removeEventListener('traduztudo:start-tour' as unknown as keyof WindowEventMap, handleTrigger as EventListener);
    };
  }, []);

  return (
    <>
      {/* Small Floating Reopen Button (if closed) */}
      {!isOpen && !isDismissed && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-4 lg:right-6 z-50 flex items-center">
          <button
            onClick={() => startTour(0)}
            className="flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xl transition-all hover:scale-105 active:scale-95 border border-blue-400/40 group"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 shrink-0" />
            <span>Ver Passo a Passo</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
                sessionStorage.setItem('traduztudo_tour_pill_dismissed', 'true');
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Ocultar botão"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      )}

      {/* COMPACT & FOCUSED POP-UP CARD (ANCHORED AT BOTTOM-RIGHT, NOT BLOCKING SCREEN) */}
      {isOpen && currentStep && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-3 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-24px)] sm:w-full animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 overflow-hidden flex flex-col">
            
            {/* Top Minimal Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / SIMPLE_STEPS.length) * 100}%` }}
              />
            </div>

            {/* Header: Pointer Badge & Controls */}
            <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
                  👉 {currentStep.tabName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  {currentStep.id}/7
                </span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Alternar Som"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body: Direct & Simple Instructions */}
            <div className="p-4 space-y-2.5">
              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                {currentStep.id}. {currentStep.title}
              </h4>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>O que fazer nesta tela:</span>
                </div>
                <p className="leading-relaxed pl-5 text-slate-600 font-medium">
                  {currentStep.actionText}
                </p>
              </div>

              <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2 leading-relaxed">
                💡 <b>Dica rápida:</b> {currentStep.tipText}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium disabled:opacity-30 disabled:pointer-events-none"
                >
                  ⬅ Voltar
                </button>
                <button
                  onClick={handleClose}
                  className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
                >
                  Pular
                </button>
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 shadow-sm"
              >
                <span>{currentStep.nextLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export function launchSystemTour(stepIndex: number = 0) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('traduztudo:start-tour', {
      detail: { step: stepIndex },
    });
    window.dispatchEvent(event);
  }
}
