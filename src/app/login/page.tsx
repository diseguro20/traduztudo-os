'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { databaseStore } from '@/lib/db';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filledSuccess, setFilledSuccess] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!password) {
      setError('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Credenciais inválidas. Verifique os dados digitados.');
      return;
    }

    router.push('/');
  };

  const fillAdminCredentials = () => {
    const admin = databaseStore.getUsers().find((u) => u.role === 'OWNER' || u.role === 'ADMIN');
    const adminEmail = admin?.email || 'admin@traduztudo.com.br';
    const adminPass = admin?.password || 'admin';

    setEmail(adminEmail);
    setPassword(adminPass);
    setError(null);
    setFilledSuccess(true);
    setTimeout(() => setFilledSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="max-w-md w-full text-center mb-6 space-y-2">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/25 mb-2">
          TT
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          TraduzTudo OS
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Sistema Operacional SaaS para Gestão de Traduções Juramentadas
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-500" />
              Acessar sua Conta
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Informe suas credenciais corporativas autorizadas
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">E-mail Corporativo:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@traduztudo.com.br"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Senha de Acesso:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Lembrar meu acesso</span>
              </label>

              <span className="text-slate-500">Acesso seguro SSL</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Master Admin Credentials Card */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5 overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Acesso do Administrador Master</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  admin@traduztudo.com.br · senha: admin
                </div>
              </div>

              <button
                type="button"
                onClick={fillAdminCredentials}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-bold text-[11px] border border-blue-500/30 transition-all shrink-0 flex items-center gap-1"
              >
                {filledSuccess ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Preenchido!</span>
                  </>
                ) : (
                  <span>Preencher Dados</span>
                )}
              </button>
            </div>
          </div>

          {/* Exclusive Admin Notice */}
          <div className="pt-2 text-center text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/60">
            🔒 <b>Acesso Corporativo Restrito.</b> Os cadastros de membros, tradutores e equipe são gerados exclusivamente pelo Administrador no Painel Admin.
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        TraduzTudo OS © 2026 · Certificado Digital ICP-Brasil & Fé Pública
      </div>
    </div>
  );
}
