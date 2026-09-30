'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  FolderOpen,
  CircleDollarSign,
  Globe,
  Play,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TOUR_STEPS, launchSystemTour } from '@/components/tour/SystemTourModal';

export default function TutorialLauncherPage() {
  const router = useRouter();

  // If user lands on /tutorial, they can immediately start the pop-up tour
  const handleStartTour = (stepIndex: number = 0) => {
    launchSystemTour(stepIndex);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Direct Pop-Up Tour Trigger */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Tour Guiado por Pop-ups Interativos</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Aprenda a Usar o TraduzTudo OS Passo a Passo em Cada Tela
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Cada etapa do sistema possui um <b>pop-up interativo guiado</b> que aparece diretamente sobre as telas reais (Dashboard, CRM, Orçamentos, Dossiê da OS, Financeiro e Portal do Cliente). Você aprende exatamente o que fazer, onde clicar e como o lead é conduzido pelo funil de tradução.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => handleStartTour(0)}
              className="gap-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 active:scale-95 px-6"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar Tour Guiado com Pop-ups Agora</span>
            </Button>

            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/10"
            >
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of the 7 Tour Steps with 1-click Pop-up triggers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              As 7 Etapas Guiadas do Sistema
            </h2>
            <p className="text-xs text-slate-500">
              Clique em qualquer etapa abaixo para abrir o pop-up explicativo diretamente na respectiva tela
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            7 Pop-ups Disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOUR_STEPS.map((step, idx) => {
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow-xs`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      Etapa {step.id}/7
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {step.subtitle}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <span className="font-semibold text-slate-700 block">
                      📍 Tela:{' '}
                      <code className="text-blue-600 font-mono text-[10px]">
                        {step.route}
                      </code>
                    </span>
                    <p className="line-clamp-2">{step.screenDescription}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleStartTour(idx)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>Abrir Pop-up da Etapa {step.id}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
