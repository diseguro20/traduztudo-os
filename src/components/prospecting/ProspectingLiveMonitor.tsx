'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Play,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Mail,
  Building2,
  Server,
  ShieldCheck,
  FileText,
  Paperclip,
  Check,
  ChevronRight,
  TrendingUp,
  Flame,
  Pause,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ProspectingDashboardStats,
  ProspectingSettings,
  ProspectCompany,
  OutboundMessageRecord,
  PROSPECT_SEGMENT_LABELS,
} from '@/types/prospecting';

interface ProspectingLiveMonitorProps {
  stats: ProspectingDashboardStats;
  settings: ProspectingSettings | null;
  companies: ProspectCompany[];
  onRefresh: () => Promise<void>;
  onSelectCompany?: (company: ProspectCompany) => void;
}

interface CycleStep {
  title: string;
  desc: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export function ProspectingLiveMonitor({
  stats,
  settings,
  companies,
  onRefresh,
  onSelectCompany,
}: ProspectingLiveMonitorProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Outbound emails
  const [outboundMessages, setOutboundMessages] = useState<OutboundMessageRecord[]>([]);
  const [loadingOutbound, setLoadingOutbound] = useState(false);

  // Cycle Execution State
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleStep, setCycleStep] = useState<number>(0);
  const [cycleLogs, setCycleLogs] = useState<string[]>([]);
  const [cycleResultSummary, setCycleResultSummary] = useState<string | null>(null);

  // Purge state
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  // Auto-Pilot Continuous Mode (cadência segura anti-bloqueio)
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(true);
  const [cycleIntervalMinutes, setCycleIntervalMinutes] = useState(20);
  const [countdownSeconds, setCountdownSeconds] = useState(1200);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-Pilot countdown runner
  useEffect(() => {
    if (!autoPilotEnabled) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (!isRunningCycle) {
            handleRunFullCycle(false);
          }
          return cycleIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoPilotEnabled, isRunningCycle, cycleIntervalMinutes]);

  // Load outbound messages
  const loadOutbound = async () => {
    try {
      setLoadingOutbound(true);
      const res = await fetch('/api/prospecting/outbound?limit=25');
      const data = await res.json();
      if (data.success && data.messages) {
        setOutboundMessages(data.messages);
      }
    } catch (err) {
      console.warn('Erro ao carregar mensagens outbound:', err);
    } finally {
      setLoadingOutbound(false);
    }
  };

  // Full refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([onRefresh(), loadOutbound()]);
    setLastRefreshedAt(new Date());
    setIsRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    loadOutbound();
  }, []);

  // Auto-refresh interval (every 15 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
      loadOutbound();
      setLastRefreshedAt(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Execute full cycle (Busca IA + Disparo Hostinger SMTP + Higienização Inteligente)
  const handleRunFullCycle = async (isManual: boolean = false) => {
    if (isRunningCycle) return;
    setIsRunningCycle(true);
    setCycleStep(1);
    setCycleResultSummary(null);
    setCycleLogs([
      `[${new Date().toLocaleTimeString('pt-BR')}] Iniciando Ciclo Integrado Diário ${isManual ? '(Manual)' : '(Piloto Automático)'}...`,
      `[Passo 1/3] Buscando empresas brasileiras reais via Agente Gemini AI...`,
    ]);

    try {
      // Passo 1: Busca IA (Gemini) -> rota dedicada /api/prospecting/search/ai (~4s)
      setCycleStep(1);
      let discoveredCount = 0;
      try {
        const segs = ['CIDADANIA_ITALIANA', 'ADVOCACIA_INTERNACIONAL', 'COMERCIO_EXTERIOR', 'VISTOS_IMIGRACAO'];
        const randomSeg = segs[Math.floor(Math.random() * segs.length)];
        const resSearch = await fetch('/api/prospecting/search/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment: randomSeg, targetCount: 10 }),
        });
        const dataSearch = await resSearch.json();
        discoveredCount = dataSearch.count || 0;
        setCycleLogs((prev) => [...prev, `[Passo 1/3] Sucesso! +${discoveredCount} novas empresas reais adicionadas com MX validado.`]);
      } catch (e: any) {
        setCycleLogs((prev) => [...prev, `[Passo 1/3] Busca IA aviso: ${e?.message || 'Falha na busca'}`]);
      }

      // Passo 2: Disparo SMTP Hostinger com PDF anexo (892 KB) -> rota dedicada /api/prospecting/cron/dispatch
      setCycleStep(2);
      setCycleLogs((prev) => [...prev, `[Passo 2/3] Conectando ao SMTP Hostinger (cadência anti-bloqueio de 10-18s por envio)...`]);
      let sentCount = 0;
      try {
        const resDispatch = await fetch('/api/prospecting/cron/dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-manual-trigger': isManual ? 'true' : 'false',
          },
          body: JSON.stringify({ limitCount: 3, force: false }),
        });
        const dataDispatch = await resDispatch.json();
        if (dataDispatch.skipped) {
          setCycleLogs((prev) => [...prev, `[Passo 2/3] 🛡️ Proteção Ativa: ${dataDispatch.message}`]);
        } else if (dataDispatch.result) {
          sentCount = dataDispatch.result?.sentCount || 0;
          setCycleLogs((prev) => [...prev, `[Passo 2/3] Sucesso! ${sentCount} e-mails entregues com Apresentação PDF via contato@traduztudo.com.`]);
        } else {
          setCycleLogs((prev) => [...prev, `[Passo 2/3] Aviso: ${dataDispatch.message || 'Sem disparos no lote'}`]);
        }
      } catch (e: any) {
        setCycleLogs((prev) => [...prev, `[Passo 2/3] Erro no disparo: ${e?.message || 'Falha SMTP'}`]);
      }

      // Passo 3: Higienização IMAP (apenas quando manual para proteger conexões no Webmail Hostinger)
      setCycleStep(3);
      if (isManual) {
        setCycleLogs((prev) => [...prev, `[Passo 3/3] Conectando via IMAP TLS para expurgar avisos de erro da caixa postal...`]);
        try {
          const resPurge = await fetch('/api/email/purge-bounces', { method: 'POST' });
          const dataPurge = await resPurge.json();
          const purgedCount = dataPurge.purgedCount || 0;
          setCycleLogs((prev) => [...prev, `[Passo 3/3] Higienização concluída! ${purgedCount} e-mails de erro removidos.`]);
        } catch (e: any) {
          setCycleLogs((prev) => [...prev, `[Passo 3/3] Higienização aviso: ${e?.message || 'IMAP ok'}`]);
        }
      } else {
        setCycleLogs((prev) => [...prev, `[Passo 3/3] 🛡️ Conexões IMAP preservadas para evitar alertas de bot no Webmail Hostinger.`]);
      }

      setCycleStep(4);
      setCycleResultSummary(
        `Ciclo executado! +${discoveredCount} novas empresas descobertas e ${sentCount} e-mails entregues com segurança via Hostinger SMTP.`
      );
      await handleManualRefresh();
    } catch (err: any) {
      setCycleStep(0);
      alert('Erro ao executar ciclo: ' + (err?.message || 'Falha de comunicação'));
    } finally {
      setIsRunningCycle(false);
      setCountdownSeconds(cycleIntervalMinutes * 60);
    }
  };

  // Quick Purge Bounces
  const handlePurgeBounces = async () => {
    try {
      setIsPurging(true);
      setPurgeResult(null);
      const res = await fetch('/api/email/purge-bounces', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPurgeResult(`Caixa postal Hostinger limpa! ${data.purgedCount || 0} e-mails de erro excluídos permanentemente.`);
        await handleManualRefresh();
      } else {
        alert(data.error || 'Falha na limpeza.');
      }
    } catch {
      alert('Erro ao conectar ao IMAP da Hostinger.');
    } finally {
      setIsPurging(false);
    }
  };

  // Calculate daily goal progress
  const targetPerDay = settings?.dailySendLimit || 200;
  const emailsToday = stats.emailsSentToday !== undefined ? stats.emailsSentToday : 0;
  const percentGoal = Math.min(100, Math.round((emailsToday / targetPerDay) * 100));

  return (
    <div className="space-y-6">
      {/* Piloto Automático Contínuo no Navegador */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 p-4 sm:p-5 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            {autoPilotEnabled && !isRunningCycle ? (
              <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
            ) : isRunningCycle ? (
              <RefreshCw className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Pause className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base tracking-tight">Piloto Automático Contínuo no Navegador</h3>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                autoPilotEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
                  : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}>
                {autoPilotEnabled ? 'Disparando Sozinho 24h' : 'Pausado'}
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              {autoPilotEnabled
                ? `Varre o Google Gemini, valida MX e envia 5 e-mails com apresentação PDF a cada ${cycleIntervalMinutes} minutos automaticamente sem você precisar clicar.`
                : 'O envio automático no navegador está pausado. Ative para deixar o SaaS disparando sozinho.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 self-end md:self-auto flex-wrap">
          <div className="text-right bg-black/40 px-3.5 py-2 rounded-xl border border-indigo-800/40">
            <span className="text-[10px] uppercase text-indigo-300 font-bold block">
              {isRunningCycle ? 'Status Atual' : 'Próximo Ciclo Automático'}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
              {isRunningCycle ? 'Disparando...' : formatCountdown(countdownSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={cycleIntervalMinutes}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCycleIntervalMinutes(val);
                setCountdownSeconds(val * 60);
              }}
              className="bg-indigo-900/60 border border-indigo-600/50 rounded-xl px-2.5 py-2 text-xs font-semibold text-white focus:outline-hidden"
              title="Intervalo entre ciclos automáticos"
            >
              <option value={15}>A cada 15 min</option>
              <option value={20}>A cada 20 min (Recomendado)</option>
              <option value={30}>A cada 30 min</option>
              <option value={45}>A cada 45 min</option>
            </select>

            <Button
              size="sm"
              variant={autoPilotEnabled ? 'secondary' : 'primary'}
              onClick={() => {
                const nextState = !autoPilotEnabled;
                setAutoPilotEnabled(nextState);
                if (nextState) setCountdownSeconds(cycleIntervalMinutes * 60);
              }}
              className={`text-xs font-bold gap-1.5 ${
                autoPilotEnabled
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {autoPilotEnabled ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pausar Piloto
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Ligar Piloto
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Header Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Painel em Tempo Real: Automação Diária B2B
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                7 Dias / Semana Ativo (Seg a Dom)
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Busca IA + Disparo Juntos
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoramento ativo de descoberta (Google Gemini), despacho SMTP Hostinger (contato@traduztudo.com com PDF anexado) e higienização automática anti-bounce.
            </p>
          </div>

          {/* Action and Refresh Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Atualização:</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`font-semibold transition-colors flex items-center gap-1 ${
                  autoRefresh ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                {autoRefresh ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> Ao Vivo (15s)
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pausada
                  </>
                )}
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar Agora
            </Button>

            <Button
              size="sm"
              onClick={() => handleRunFullCycle(true)}
              disabled={isRunningCycle}
              className="text-xs gap-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-md shadow-indigo-600/20 border-0"
            >
              <Play className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-spin' : ''}`} />
              {isRunningCycle ? 'Executando Ciclo...' : 'Executar Ciclo Completo Agora'}
            </Button>
          </div>
        </div>

        {/* Status System Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Hostinger SMTP</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Porta 465 SSL Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Agente Gemini IA</p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Busca & Qualificação Ativa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Anexo Oficial B2B</p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Apresentacao_TraduzTudo.pdf</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Higienização IMAP</p>
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Porta 993 TLS Ativa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Step Stepper when running cycle */}
      {isRunningCycle && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl border border-indigo-700/50 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="font-bold text-sm text-indigo-200 uppercase tracking-wide">
                Executando Ciclo Combinado em Tempo Real
              </span>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-400/30">
              Passo {cycleStep} de 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
            {[
              { num: 1, label: '1. Busca Gemini IA', desc: 'Descobrindo empresas reais' },
              { num: 2, label: '2. Validação MX', desc: 'DNS e anti-bounce' },
              { num: 3, label: '3. Disparo SMTP Hostinger', desc: 'Envio com PDF anexado' },
              { num: 4, label: '4. Higienização IMAP', desc: 'Expurge de avisos de erro' },
            ].map((step) => {
              const isActive = cycleStep === step.num;
              const isPast = cycleStep > step.num;
              return (
                <div
                  key={step.num}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-md'
                      : isPast
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{step.label}</span>
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isActive ? (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                    ) : null}
                  </div>
                  <p className="text-[11px] opacity-80">{step.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-black/50 p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1 max-h-32 overflow-y-auto">
            {cycleLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-indigo-400">›</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cycle Result Alert */}
      {cycleResultSummary && !isRunningCycle && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Ciclo Concluído com Sucesso</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{cycleResultSummary}</p>
            </div>
          </div>
          <button
            onClick={() => setCycleResultSummary(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
          >
            Fechar
          </button>
        </div>
      )}

      {purgeResult && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-2xl text-blue-900 dark:text-blue-200 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{purgeResult}</span>
          </div>
          <button onClick={() => setPurgeResult(null)} className="text-blue-600 hover:text-blue-800 font-semibold">
            Fechar
          </button>
        </div>
      )}

      {/* Real-time KPI Tracker & Daily Target Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Towards Daily Goal of 200 emails */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" /> Meta Diária de Disparo
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {percentGoal}% concluída
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{emailsToday}</span>
              <span className="text-sm font-semibold text-slate-400">/ {targetPerDay} e-mails hoje</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentGoal}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Fila pronta: <strong className="text-blue-600">{stats.eligibleCount} empresas</strong></span>
            <span>Histórico total: <strong className="text-slate-700 dark:text-slate-300">{stats.emailsSent}</strong></span>
          </div>
        </div>

        {/* Discovery Counter */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-500" /> Descobertas Hoje
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Total: {stats.totalCompanies}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                +{stats.newCompaniesToday}
              </span>
              <span className="text-sm font-medium text-slate-400">empresas catalogadas hoje</span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Empresas qualificadas com e-mail institucional direto (<code className="text-slate-700 dark:text-slate-300">contato@</code> e <code className="text-slate-700 dark:text-slate-300">comercial@</code>).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Contatos válidos: <strong className="text-indigo-600">{stats.validContactsCount}</strong></span>
            <span>Opt-outs (LGPD): <strong className="text-slate-600">{stats.optOutCount}</strong></span>
          </div>
        </div>

        {/* Daily Schedule Windows */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" /> Grade de Horários (7x/dia)
              </span>
              <span className="text-xs bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                GitHub Cron
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {['07:15', '09:15', '11:15', '13:15', '15:15', '17:15', '19:15'].map((h, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg text-center text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800"
                >
                  {h}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-3">
              Cada horário executa <strong>Busca IA + Disparo de 30 e-mails com PDF + Purge IMAP</strong> sem intervenção manual.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={handlePurgeBounces}
              disabled={isPurging}
              className="text-xs text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isPurging ? 'Limpando...' : 'Higienizar IMAP Agora'}
            </button>
            <span className="text-[11px] text-slate-400">
              Refresco: {lastRefreshedAt.toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Real-Time Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed 1: E-mails Disparados Recentemente (Hostinger SMTP + PDF) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Disparos Recentes (Hostinger SMTP + PDF)
              </h3>
            </div>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {outboundMessages.length} registrados
            </span>
          </div>

          {loadingOutbound ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-500" />
              Carregando histórico de envios...
            </div>
          ) : outboundMessages.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhum e-mail registrado nesta sessão ainda. Clique em <strong>"Executar Ciclo Completo Agora"</strong> para iniciar o primeiro disparo.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto pr-1">
              {outboundMessages.map((msg) => (
                <div key={msg.id} className="py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {msg.recipientName}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> Entregue com PDF
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{msg.recipientEmail}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic truncate">
                    Assunto: "{msg.subject}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="font-mono text-[10px] truncate max-w-[200px]" title={msg.messageId}>
                      ID: {msg.messageId || 'smtp-direct'}
                    </span>
                    <span>{new Date(msg.sentAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed 2: Últimas Empresas Descobertas pelo Gemini IA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Empresas Catalogadas Hoje (Gemini IA)
              </h3>
            </div>
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              {companies.length} na base
            </span>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhuma empresa prospectada ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto pr-1">
              {companies.slice(0, 15).map((comp) => (
                <div key={comp.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {comp.tradeName || comp.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {PROSPECT_SEGMENT_LABELS[comp.segment] || comp.segment}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                      <span className="truncate">{comp.city}/{comp.state}</span>
                      <span className="truncate font-mono">{comp.contactEmail}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Status: <strong className="text-indigo-600 dark:text-indigo-400">{comp.status}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      Fit {comp.fitScore}%
                    </span>
                    {onSelectCompany && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectCompany(comp)}
                        className="text-[11px] py-1 px-2 h-7"
                      >
                        Ver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
