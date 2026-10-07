'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Send,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { whatsAppService } from '@/lib/services/whatsapp';

export default function WhatsAppIntegrationPage() {
  const [phone, setPhone] = useState('(11) 98765-4321');
  const [message, setMessage] = useState(
    'Olá! Seu orçamento de Tradução Juramentada está pronto para análise e aprovação. Acesse o link seguro: https://traduztudo.vercel.app/orcamento/demo'
  );
  const [sentSuccess, setSentSuccess] = useState(false);
  const status = whatsAppService.getStatus();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await whatsAppService.sendMessage(phone, message);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-5 h-5 sm:w-6 h-6 text-emerald-600" /> WhatsApp Business API
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Disparo automatizado de avisos de orçamento, link de pagamento PIX e aviso de documentos prontos.
        </p>
      </div>

      {/* Integration Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Camada WhatsAppService</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Ativo (Pronto para Produção)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Provedor: {status.provider}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Credenciais isoladas no servidor</span>
        </div>
      </div>

      {/* Simulation / Testing Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Testar Disparo de Mensagem WhatsApp
        </h2>

        {sentSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Mensagem enviada com sucesso para a fila de transmissão!
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Número com DDD *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Texto da Mensagem *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs shadow-xs">
              <Send className="w-3.5 h-3.5" /> Enviar Mensagem de Teste
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
