'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  X,
  Sliders,
  Key,
  Globe,
  Loader2,
  Phone,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ProspectCompany,
  ProspectSegment,
  PROSPECT_SEGMENT_LABELS,
} from '@/types/prospecting';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialSegment?: string;
  onSuccess: (newCompanies: ProspectCompany[]) => void;
}

const BRAZILIAN_STATES = [
  'ALL',
  'SP',
  'RJ',
  'MG',
  'PR',
  'SC',
  'RS',
  'DF',
  'BA',
  'GO',
  'PE',
  'CE',
  'ES',
];

const SUGGESTION_PILLS = [
  { label: 'Cidadania Italiana (SP / PR)', segment: 'CIDADANIA_ITALIANA', state: 'SP', query: 'Assessorias de cidadania italiana e busca de certidões' },
  { label: 'Comércio Exterior & Tradings (Santos / SC)', segment: 'COMERCIO_EXTERIOR', state: 'SP', query: 'Empresas de comércio exterior, despachantes aduaneiros e trading' },
  { label: 'Advocacia Internacional & Migratória', segment: 'ADVOCACIA_INTERNACIONAL', state: 'ALL', query: 'Escritórios de advocacia internacional com foco em imigração e empresas' },
  { label: 'Vistos & Imigração (EUA / Europa)', segment: 'VISTOS_IMIGRACAO', state: 'ALL', query: 'Consultorias de vistos consulares, vistos de trabalho e mobilidade global' },
  { label: 'Agências de Intercâmbio Cultural', segment: 'INTERCAMBIO', state: 'ALL', query: 'Agências de intercâmbio estudantil e cursos no exterior' },
];

export function AISearchModal({
  isOpen,
  onClose,
  initialQuery = '',
  initialSegment = 'ALL',
  onSuccess,
}: AISearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [segment, setSegment] = useState<string>(initialSegment);
  const [targetState, setTargetState] = useState<string>('ALL');
  const [targetCount, setTargetCount] = useState<number>(10);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [discoveredCompanies, setDiscoveredCompanies] = useState<ProspectCompany[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSegment(initialSegment);
      setDiscoveredCompanies([]);
      setSearchDone(false);
      setErrorMessage(null);
      const savedKey = localStorage.getItem('traduztudo_gemini_api_key') || '';
      if (savedKey) setApiKey(savedKey);
    }
  }, [isOpen, initialQuery, initialSegment]);

  const handleStartSearch = async () => {
    setIsSearching(true);
    setErrorMessage(null);
    setDiscoveredCompanies([]);
    setSearchDone(false);

    // Save API key if provided
    if (apiKey.trim()) {
      localStorage.setItem('traduztudo_gemini_api_key', apiKey.trim());
    }

    // Step sequence simulation for smooth UX while backend processes
    setCurrentStep('1. Agente IA analisando nicho de mercado e segmentação...');
    const step2Timer = setTimeout(() => {
      setCurrentStep('2. Consultando registros corporativos, diretórios públicos e geolocalização...');
    }, 1500);

    const step3Timer = setTimeout(() => {
      setCurrentStep('3. Validando servidores de e-mail (MX DNS) e domínios corporativos em tempo real...');
    }, 3500);

    const step4Timer = setTimeout(() => {
      setCurrentStep('4. Qualificando Fit Score e adequação para serviços da TraduzTudo...');
    }, 5500);

    try {
      const res = await fetch('/api/prospecting/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          segment: segment === 'ALL' ? undefined : segment,
          targetState: targetState === 'ALL' ? undefined : targetState,
          targetCount,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao buscar empresas com o Agente IA.');
      }

      setCurrentStep(`5. Concluído! ${data.count} empresas reais validadas e adicionadas ao CRM.`);
      setDiscoveredCompanies(data.companies || []);
      setSearchDone(true);
      onSuccess(data.companies || []);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado na busca.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Busca de Empresas com Agente IA
                <Badge variant="outline" className="border-indigo-400 text-indigo-700 dark:text-indigo-300 text-[10px]">
                  Gemini & Web Registries
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Encontre empresas brasileiras ativas com websites e e-mails corporativos válidos via MX.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!searchDone ? (
            <>
              {/* Query Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  O que você deseja buscar? (Palavras-chave ou nicho)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: Escritórios de advocacia internacional, assessorias de cidadania e vistos em SP..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Sugestões Rápidas de Nicho:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTION_PILLS.map((pill, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuery(pill.query);
                        setSegment(pill.segment);
                        setTargetState(pill.state);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Segment & State Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Segmento de Mercado
                  </label>
                  <select
                    value={segment}
                    onChange={e => setSegment(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="ALL">Todos os Segmentos</option>
                    {Object.entries(PROSPECT_SEGMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Estado (UF) de Foco
                  </label>
                  <select
                    value={targetState}
                    onChange={e => setTargetState(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st} value={st}>
                        {st === 'ALL' ? 'Todo o Brasil' : st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Target */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Quantidade de Novas Empresas a Descobrir</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {targetCount} empresas
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={targetCount}
                  onChange={e => setTargetCount(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>5 empresas</span>
                  <span>15 empresas</span>
                  <span>30 empresas</span>
                </div>
              </div>

              {/* Optional Gemini Key Toggle */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Key className="w-3.5 h-3.5" />
                  {showApiKeyInput ? 'Ocultar Chave Gemini API' : 'Personalizar Chave do Google Gemini (Opcional)'}
                </button>

                {showApiKeyInput && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Chave da API do Google Gemini (Google AI Studio)
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                    />
                    <p className="text-[11px] text-slate-500">
                      Se você possuir uma chave do Gemini, ela será salva localmente para buscas ilimitadas. Caso deixe em branco, o sistema utilizará o motor integrado de varredura pública.
                    </p>
                  </div>
                )}
              </div>

              {/* Live Search Status during execution */}
              {isSearching && (
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Executando busca inteligente...</span>
                  </div>
                  <p className="text-xs text-indigo-900 dark:text-indigo-200 font-mono">
                    {currentStep}
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          ) : (
            /* Results View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Busca Concluída com Sucesso!</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {discoveredCompanies.length} novas empresas reais foram validadas e inseridas no CRM.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {discoveredCompanies.map(c => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {c.tradeName || c.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 border-indigo-300 text-indigo-700 dark:text-indigo-300">
                            Fit: {c.fitScore}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {c.contactEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {c.city}/{c.state}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      title="Visitar site oficial"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {!searchDone ? (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verificação de MX DNS ativa</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={isSearching}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartSearch}
                  disabled={isSearching}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Iniciar Busca com Agente IA
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchDone(false);
                  setDiscoveredCompanies([]);
                }}
              >
                Fazer Nova Busca
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Ver Empresas no CRM
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
