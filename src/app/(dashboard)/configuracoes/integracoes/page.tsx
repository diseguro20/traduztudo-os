'use client';

import React, { useState } from 'react';
import {
  Webhook,
  Key,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe,
  MessageSquare,
  Mail,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { databaseStore } from '@/lib/db';

export default function IntegracoesConfigPage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const [clicksignEnv, setClicksignEnv] = useState<'sandbox' | 'production'>(
    () => databaseStore.getClicksignConfig().environment
  );
  const [clicksignToken, setClicksignToken] = useState<string>(
    () => databaseStore.getClicksignConfig().accessToken || ''
  );
  const [clicksignSecret, setClicksignSecret] = useState<string>(
    () => databaseStore.getClicksignConfig().webhookSecret || ''
  );
  const [savedClicksign, setSavedClicksign] = useState(false);

  const handleSaveClicksign = () => {
    databaseStore.updateClicksignConfig({
      environment: clicksignEnv,
      accessToken: clicksignToken,
      webhookSecret: clicksignSecret,
    });
    setSavedClicksign(true);
    setTimeout(() => setSavedClicksign(false), 3000);
  };

  const apiKey = 'traduztudo-saas-api-secret-key-2026';
  const endpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/public/requests`
    : 'https://traduztudo-os.vercel.app/api/public/requests';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Webhook className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Integrações & APIs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Conecte o site público da TraduzTudo, WhatsApp Business API, serviços de e-mail e meios de pagamento.
        </p>
      </div>

      {/* Clicksign Integration Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                clicksignEnv === 'production'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Clicksign — Assinatura Digital Oficial
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    clicksignEnv === 'production'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {clicksignEnv === 'production' ? 'Produção Oficial Ativa' : 'Ambiente de Teste (Sandbox)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Provedor oficial homologado para assinatura automática (Carla Strambio), assinaturas eletrônicas e certificados digitais ICP-Brasil.
              </p>
            </div>
          </div>

          <a
            href="https://app.clicksign.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0 font-semibold self-start sm:self-auto"
          >
            Painel Clicksign <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Environment Selector and Credentials */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-2">
              Modo de Operação da Assinatura:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setClicksignEnv('sandbox')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  clicksignEnv === 'sandbox'
                    ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Ambiente de Teste (Sandbox)</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                    RECOMENDADO P/ TESTES
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Permite simular e homologar todo o fluxo sem custos por assinatura e sem consumir créditos da sua conta Clicksign.
                </p>
              </div>

              <div
                onClick={() => setClicksignEnv('production')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  clicksignEnv === 'production'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Produção Oficial</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900">
                    JURIDICAMENTE VÁLIDO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Envia envelopes diretamente para o ambiente oficial (app.clicksign.com) com validade jurídica final e consome créditos reais.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Token de Acesso da API (Access Token)
              </label>
              <input
                type="password"
                placeholder="Ex: c1a2b3... (Configurações > API no painel Clicksign)"
                value={clicksignToken}
                onChange={(e) => setClicksignToken(e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Segredo de Validação Webhook (HMAC Secret)
              </label>
              <input
                type="password"
                placeholder="Ex: whsec_..."
                value={clicksignSecret}
                onChange={(e) => setClicksignSecret(e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
            <span className="text-[11px] text-slate-500">
              {savedClicksign ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configurações Clicksign salvas com sucesso!
                </span>
              ) : (
                'As alterações entram em vigor imediatamente para todos os documentos.'
              )}
            </span>

            <Button
              size="sm"
              onClick={handleSaveClicksign}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-4"
            >
              Salvar Configuração Clicksign
            </Button>
          </div>
        </div>
      </div>

      {/* Website Integration Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Integração com o Site TraduzTudo Oficial
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  API Ativa
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Permite que o formulário de orçamento do site (https://traduztudo.com/) envie solicitações diretamente para este sistema.
              </p>
            </div>
          </div>

          <a
            href="https://traduztudo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0 font-semibold self-start sm:self-auto"
          >
            Abrir Site <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* API Endpoint & Key details */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Endpoint Público (POST)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={endpointUrl}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 select-all"
              />
              <Button size="sm" variant="outline" onClick={handleCopyEndpoint} className="shrink-0 gap-1 text-xs">
                {copiedEndpoint ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEndpoint ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Chave Secreta de Integração (Header: x-api-key)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 select-all"
              />
              <Button size="sm" variant="outline" onClick={handleCopyKey} className="shrink-0 gap-1 text-xs">
                {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Other Service Providers Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Operacional
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">WhatsApp API</h4>
          <p className="text-xs text-slate-500">
            Disparos automáticos de links de aprovação e avisos de pedidos.
          </p>
        </div>

        {/* Email */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <Mail className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Operacional
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">E-mail Transacional</h4>
          <p className="text-xs text-slate-500">
            Resend / SMTP corporativo com templates de propostas formatadas.
          </p>
        </div>

        {/* Payments Gateway */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              PIX Instantâneo
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Pagamentos & PIX</h4>
          <p className="text-xs text-slate-500">
            Geração de cobranças PIX, boleto e conciliação bancária imediata.
          </p>
        </div>
      </div>
    </div>
  );
}
