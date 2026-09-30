'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function CadastroPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedRole, setRequestedRole] = useState('Tradutor Juramentado (JUCESP)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    const res = await signup({
      name,
      email,
      phone,
      requestedRole,
      password,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Erro ao enviar cadastro.');
      return;
    }

    setIsSuccess(true);
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
          Solicitação de Cadastro e Credenciamento de Novos Membros
        </p>
      </div>

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {isSuccess ? (
          /* Success Screen */
          <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Cadastro Enviado com Sucesso!
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Olá, <b>{name}</b>! Sua solicitação foi registrada no sistema e já está aguardando aprovação na fila de novos usuários do <b>Painel Admin</b>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Cargo Solicitado:</span>
                <span className="font-bold text-blue-400">{requestedRole}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">E-mail:</span>
                <span className="font-mono text-slate-200">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Inicial:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendente de Liberação</span>
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/admin"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <span>Ir para o Painel Admin para Liberar Este Usuário</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login"
                className="py-2 text-xs text-slate-400 hover:text-white"
              >
                Voltar para a Tela de Login
              </Link>
            </div>
          </div>
        ) : (
          /* Signup Form */
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Criar Nova Conta</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Preencha seus dados para solicitar credenciamento na empresa
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Nome Completo:</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">E-mail Profissional:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Telefone / WhatsApp:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Cargo / Função Pretendida:</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="Tradutor Juramentado (JUCESP)">Tradutor Juramentado (Oficial com Fé Pública)</option>
                    <option value="Tradutor Técnico Certificado">Tradutor Técnico Certificado</option>
                    <option value="Revisor Terminológico Sênior">Revisor Terminológico e Qualidade</option>
                    <option value="Atendente Comercial & Triagem">Atendente Comercial & Triagem de Leads</option>
                    <option value="Analista Financeiro">Analista Financeiro / Faturamento</option>
                    <option value="Gerente Operacional">Gerente Operacional / Coordenador de OS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Senha:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Confirmar Senha:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 gap-2"
                >
                  <span>{isSubmitting ? 'Enviando...' : 'Solicitar Cadastro na Equipe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              Já possui uma conta?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
                Fazer Login →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        TraduzTudo OS © 2026 · Controle de Acesso e Liberação por RBAC
      </div>
    </div>
  );
}
