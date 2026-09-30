'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { databaseStore } from '@/lib/db';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingNotice(false);

    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    // Check if user is pending in database
    const userFound = databaseStore.getUserByEmail(email);
    if (userFound && userFound.status === 'PENDING') {
      setPendingNotice(true);
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Credenciais inválidas.');
      return;
    }

    router.push('/');
  };

  const handleQuick = (id: string, isPendingUser: boolean = false) => {
    quickLogin(id);
    if (isPendingUser) {
      setPendingNotice(true);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="max-w-md w-full text-center mb-6 space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-blue-500/20 mb-2">
          TT
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          TraduzTudo OS
        </h1>
        <p className="text-xs text-slate-400">
          Sistema Operacional SaaS para Gestão de Traduções Juramentadas
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {pendingNotice ? (
          /* Pending Approval Screen */
          <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl animate-pulse">
              ⏳
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Cadastro em Análise pelo Administrador
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Seu cadastro foi recebido com sucesso no sistema! Por questões de segurança e fé pública, o Administrador precisa aprovar seu perfil e atribuir seu cargo no <b>Painel Admin</b>.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Status da Conta: Pendente de Liberação</span>
              </div>
              <p className="text-[11px]">
                Você receberá um e-mail e uma notificação no WhatsApp assim que o cargo for atribuído.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={() => handleQuick('user-carlos')}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                <span>Entrar como Administrador (Carlos Silva) para Liberar</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setPendingNotice(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Voltar para o Login
              </button>
            </div>
          </div>
        ) : (
          /* Standard Login Form */
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Acessar sua Conta</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Digite suas credenciais corporativas para entrar
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">E-mail:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-300 block">Senha:</label>
                  <button
                    type="button"
                    onClick={() => alert('Para redefinir sua senha, solicite ao Administrador no Painel Admin.')}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 gap-2"
              >
                <span>{isSubmitting ? 'Verificando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick Login / Direct Master Access */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                <span>⚡ Acesso Rápido Master:</span>
                <span className="text-[10px] text-emerald-400 font-bold">1-Clique</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  const admin = databaseStore.getUsers().find((u) => u.role === 'OWNER' || u.role === 'ADMIN') || databaseStore.getCurrentUser();
                  handleQuick(admin.id);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>👑 {databaseStore.getCurrentUser().name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      {databaseStore.getCurrentUser().email}
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-400 mt-0.5">Proprietário / Administrador Geral (Acesso Total)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </button>

              {databaseStore.hasMockData() && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuick('user-mariana')}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-[11px] transition-colors"
                  >
                    <div className="font-bold text-white truncate">💼 Mariana</div>
                    <div className="text-[9px] text-indigo-400 truncate">Gerente</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuick('user-rodrigo')}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-[11px] transition-colors"
                  >
                    <div className="font-bold text-white truncate">💰 Rodrigo</div>
                    <div className="text-[9px] text-emerald-400 truncate">Financeiro</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuick('user-pendente-fernanda', true)}
                    className="p-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 text-left text-[11px] transition-colors"
                  >
                    <div className="font-bold text-amber-300 truncate">⏳ Fernanda</div>
                    <div className="text-[9px] text-amber-400 truncate">Pendente</div>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 text-center text-xs text-slate-400">
              Não tem acesso ainda?{' '}
              <Link href="/cadastro" className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
                Solicitar Cadastro na Equipe →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        TraduzTudo OS © 2026 · Certificado Digital ICP-Brasil & Fé Pública
      </div>
    </div>
  );
}
