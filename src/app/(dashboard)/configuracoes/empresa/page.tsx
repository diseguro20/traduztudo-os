'use client';

import React, { useState } from 'react';
import { Building2, Save, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { databaseStore } from '@/lib/db';

export default function EmpresaConfigPage() {
  const tenant = databaseStore.getTenant();
  const [name, setName] = useState(tenant.name);
  const [document, setDocument] = useState(tenant.document);
  const [email, setEmail] = useState(tenant.email);
  const [phone, setPhone] = useState(tenant.phone);
  const [whatsapp, setWhatsapp] = useState(tenant.whatsapp || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    databaseStore.updateTenant({
      name,
      document,
      email,
      phone,
      whatsapp,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" /> Configurações da Empresa
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Dados cadastrais da empresa tradutora, identificação no portal e plano de assinatura SaaS.
        </p>
      </div>

      {/* Plan Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase">
            Plano Contratado
          </span>
          <h2 className="text-xl font-bold mt-2">Plano TraduzTudo {tenant.plan}</h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Usuários ilimitados, multi-tenancy, pipeline de vendas e portal do cliente inclusos.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-blue-200 block">Status da Assinatura</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Assinatura Ativa
          </span>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Dados da empresa atualizados com sucesso!
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Razão Social / Nome Fantasia *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              CNPJ *
            </label>
            <input
              type="text"
              required
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              E-mail Comercial *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Telefone Fixo
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              WhatsApp Comercial
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" className="gap-2 shadow-xs">
            <Save className="w-4 h-4" /> Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
