'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CadastroRestritoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="max-w-md w-full text-center mb-6 space-y-2">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/25 mb-2">
          TT
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          TraduzTudo OS
        </h1>
        <p className="text-xs text-slate-400">
          Sistema Operacional SaaS para Gestão de Traduções Juramentadas
        </p>
      </div>

      <div className="max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">
            Cadastros Gerados Exclusivamente pela Administração
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            O TraduzTudo OS opera em ambiente corporativo fechado. O auto-cadastro público não está habilitado.
          </p>
        </div>

        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left text-xs space-y-2 text-slate-400">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Como obter seu acesso:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Se você é tradutor juramentado, revisor ou colaborador da empresa, solicite ao <b>Administrador Master</b> a criação do seu usuário e envio da sua senha inicial.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/login" className="block">
            <Button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 gap-2">
              <span>Voltar para a Tela de Login</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        TraduzTudo OS © 2026 · Certificado Digital ICP-Brasil & Fé Pública
      </div>
    </div>
  );
}
