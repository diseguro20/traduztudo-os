'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SIMPLE_STEPS, launchSystemTour } from '@/components/tour/SystemTourModal';

export default function TutorialLauncherPage() {
  const handleStartTour = (stepIndex: number = 0) => {
    launchSystemTour(stepIndex);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Direct Pop-Up Tour Trigger */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Guia Prático Passo a Passo</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Tour Guiado: O Que Fazer em Cada Aba
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Um <b>card leve e compacto</b> aparece no canto da tela apontando exatamente o que você deve fazer em cada aba do sistema, sem tampar a visão nem cansar com textos longos.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => handleStartTour(0)}
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg active:scale-95 px-5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Começar Tour pelo Dashboard (Etapa 1)</span>
            </Button>

            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/10"
            >
              Ir Direto para o Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of the 7 Simple Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            As 7 Abas Explicadas
          </h2>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            7 Dicas Rápidas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SIMPLE_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {step.tabName}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {step.id}/7
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>

                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-100">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>O que fazer:</span>
                  </div>
                  <p className="leading-snug pl-5 text-slate-600">
                    {step.actionText}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  onClick={() => handleStartTour(idx)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>Ver Pop-up Nesta Aba</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
