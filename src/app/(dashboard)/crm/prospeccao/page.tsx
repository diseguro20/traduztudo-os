'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Send,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Ban,
  ArrowRight,
  TrendingUp,
  Download,
  Eye,
  X,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  ProspectCompany,
  ProspectSegment,
  ProspectStage,
  PROSPECT_SEGMENT_LABELS,
  PROSPECT_STAGE_LABELS,
  ProspectingDashboardStats,
  OutreachCampaign,
  InboundProspectReply,
  ProspectingSettings,
} from '@/types/prospecting';

type ActiveTab = 'VISAO_GERAL' | 'EMPRESAS' | 'CONTATOS' | 'CAMPANHAS' | 'RESPOSTAS' | 'OPORTUNIDADES' | 'CONFIGURACOES';

export default function ProspeccaoInteligentePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('VISAO_GERAL');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ProspectingDashboardStats>({
    totalCompanies: 0,
    newCompaniesToday: 0,
    validContactsCount: 0,
    eligibleCount: 0,
    emailsSent: 0,
    deliveredCount: 0,
    repliesReceived: 0,
    interestedCount: 0,
    quotesRequested: 0,
    proposalsApproved: 0,
    convertedClients: 0,
    sendFailures: 0,
    optOutCount: 0,
    conversionRate: 0,
    responseRate: 0,
    hostingerSmtpOnline: true,
    autoSendActive: false,
  });

  const [companies, setCompanies] = useState<ProspectCompany[]>([]);
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [replies, setReplies] = useState<InboundProspectReply[]>([]);
  const [settings, setSettings] = useState<ProspectingSettings | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  // Modals
  const [selectedCompany, setSelectedCompany] = useState<ProspectCompany | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Discovery & Dispatch loading states
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // New company form state
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    tradeName: '',
    cnpj: '',
    segment: 'CIDADANIA_ITALIANA' as ProspectSegment,
    city: 'São Paulo',
    state: 'SP',
    website: '',
    contactEmail: '',
    phone: '',
    whatsapp: '',
  });

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resStats, resCompanies, resCampaigns, resSettings] = await Promise.all([
        fetch('/api/prospecting/dashboard').then((r) => r.json()),
        fetch('/api/prospecting/companies').then((r) => r.json()),
        fetch('/api/prospecting/campaigns').then((r) => r.json()),
        fetch('/api/prospecting/settings').then((r) => r.json()),
      ]);

      if (resStats.success && resStats.stats) setStats(resStats.stats);
      if (resCompanies.success && resCompanies.items) setCompanies(resCompanies.items);
      if (resCampaigns.success && resCampaigns.campaigns) setCampaigns(resCampaigns.campaigns);
      if (resSettings.success && resSettings.settings) setSettings(resSettings.settings);
    } catch (err) {
      console.error('Erro ao carregar dados de prospecção:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run autonomous discovery batch
  const handleRunDiscovery = async () => {
    try {
      setIsDiscovering(true);
      setActionSuccess(null);
      const res = await fetch('/api/prospecting/cron/discover', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message);
        await fetchData();
      } else {
        alert(data.error || 'Falha ao executar rotina de busca de empresas.');
      }
    } catch {
      alert('Erro de conexão ao executar busca de empresas.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Run campaign dispatch batch
  const handleRunDispatch = async () => {
    if (!confirm('Deseja disparar e-mails comerciais para todos os contatos elegíveis da fila via Hostinger SMTP?')) {
      return;
    }
    try {
      setIsDispatching(true);
      setActionSuccess(null);
      const res = await fetch('/api/prospecting/cron/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-manual-trigger': 'true',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message);
        await fetchData();
      } else {
        alert(data.error || 'Falha ao despachar campanha.');
      }
    } catch {
      alert('Erro de conexão ao despachar campanha.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Handle convert to CRM lead
  const handleConvertToLead = async (companyId: string) => {
    try {
      const res = await fetch(`/api/prospecting/companies/${companyId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_to_lead' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message);
        await fetchData();
        if (selectedCompany && selectedCompany.id === companyId) {
          setSelectedCompany({ ...selectedCompany, status: 'LEAD_QUALIFICADO' });
        }
      } else {
        alert(data.error || 'Erro ao converter em lead.');
      }
    } catch {
      alert('Erro de comunicação.');
    }
  };

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Handle save operational settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    try {
      setIsSavingSettings(true);
      const res = await fetch('/api/prospecting/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess('Configurações operacionais salvas com sucesso!');
        await fetchData();
      } else {
        alert(data.error || 'Erro ao salvar configurações.');
      }
    } catch {
      alert('Erro de conexão ao salvar configurações.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle send email manually for a company
  const handleSendEmail = async (companyId: string) => {
    try {
      setIsSendingEmail(true);
      setActionSuccess(null);
      const res = await fetch(`/api/prospecting/companies/${companyId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_email' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message);
        await fetchData();
        const updated = await fetch(`/api/prospecting/companies`).then((r) => r.json());
        const comp = updated.items?.find((c: ProspectCompany) => c.id === companyId);
        if (comp) setSelectedCompany(comp);
      } else {
        alert(data.error || 'Falha ao enviar e-mail.');
      }
    } catch {
      alert('Erro de comunicação ao enviar e-mail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle opt-out toggle (LGPD)
  const handleToggleOptOut = async (companyId: string) => {
    if (!confirm('Deseja adicionar esta empresa à lista de supressão (LGPD)? Ela não receberá mais contatos.')) {
      return;
    }
    try {
      const res = await fetch(`/api/prospecting/companies/${companyId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_opt_out' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message);
        await fetchData();
        setIsCompanyModalOpen(false);
      } else {
        alert(data.error || 'Erro ao alterar opt-out.');
      }
    } catch {
      alert('Erro de comunicação.');
    }
  };

  // Handle save note
  const handleAddNote = async (companyId: string) => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/prospecting/companies/${companyId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', note: newNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewNote('');
        setActionSuccess('Observação registrada!');
        await fetchData();
        const updated = await fetch(`/api/prospecting/companies`).then((r) => r.json());
        const comp = updated.items?.find((c: ProspectCompany) => c.id === companyId);
        if (comp) setSelectedCompany(comp);
      }
    } catch {
      alert('Erro ao salvar nota.');
    }
  };

  // Handle create company manually
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/prospecting/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompanyForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsNewCompanyModalOpen(false);
        setActionSuccess('Empresa cadastrada com sucesso!');
        await fetchData();
      } else {
        alert(data.error || 'Erro ao cadastrar empresa.');
      }
    } catch {
      alert('Erro de conexão ao cadastrar empresa.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (companies.length === 0) {
      alert('Nenhuma empresa para exportar.');
      return;
    }
    const headers = ['Nome', 'Nome Fantasia', 'CNPJ', 'Segmento', 'Cidade', 'UF', 'E-mail', 'Telefone', 'Status', 'Fit Score'];
    const rows = filteredCompanies.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.tradeName || '').replace(/"/g, '""')}"`,
      `"${c.cnpj || ''}"`,
      `"${c.segment}"`,
      `"${c.city}"`,
      `"${c.state}"`,
      `"${c.contactEmail}"`,
      `"${c.phone || ''}"`,
      `"${c.status}"`,
      c.fitScore,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prospeccao_traduztudo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered companies list
  const filteredCompanies = companies.filter((c) => {
    if (segmentFilter !== 'ALL' && c.segment !== segmentFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (stateFilter !== 'ALL' && c.state !== stateFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        (c.tradeName && c.tradeName.toLowerCase().includes(term)) ||
        c.contactEmail.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        (c.cnpj && c.cnpj.includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Prospecção Inteligente & Agente B2B
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-3.5 h-3.5" /> IA Ativa
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hostinger SMTP Conectado
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Descoberta diária de empresas brasileiras, qualificação por IA, enriquecimento de contatos e campanhas de prospecção via{' '}
            <strong className="text-slate-700 dark:text-slate-200">contato@traduztudo.com</strong>.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs gap-1.5"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs gap-1.5"
            title="Exportar base para planilha CSV"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunDiscovery}
            disabled={isDiscovering}
            className="text-xs gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
          >
            <Search className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
            {isDiscovering ? 'Buscando Empresas...' : 'Buscar Empresas Hoje'}
          </Button>

          <Button
            size="sm"
            onClick={handleRunDispatch}
            disabled={isDispatching}
            className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
            {isDispatching ? 'Disparando Fila...' : 'Disparar Fila Elegível'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNewCompanyModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Empresa
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Empresas</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalCompanies}</p>
          <span className="text-[11px] text-slate-400">+{stats.newCompaniesToday} encontradas hoje</span>
        </div>

        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Elegíveis para Envio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.eligibleCount}</p>
          <span className="text-[11px] text-slate-400">Contato verificado e sem opt-out</span>
        </div>

        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">E-mails Enviados</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.emailsSent}</p>
          <span className="text-[11px] text-slate-400">Taxa de resposta: {stats.responseRate}%</span>
        </div>

        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Interessadas / Leads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.interestedCount}</p>
          <span className="text-[11px] text-slate-400">{stats.quotesRequested} orçamentos solicitados</span>
        </div>
      </div>

      {/* Commercial Sales Funnel Progression */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Funil de Conversão Comercial B2B
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
          {[
            { label: '1. Descoberta', count: stats.totalCompanies, color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
            { label: '2. Contato Ok', count: stats.validContactsCount, color: 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
            { label: '3. Elegível', count: stats.eligibleCount, color: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
            { label: '4. Enviado', count: stats.emailsSent, color: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' },
            { label: '5. Resposta', count: stats.repliesReceived, color: 'bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
            { label: '6. Lead Qualif.', count: stats.interestedCount, color: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
            { label: '7. Orçamento', count: stats.quotesRequested, color: 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
            { label: '8. Cliente', count: stats.convertedClients, color: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
          ].map((step, idx) => (
            <div key={idx} className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 ${step.color}`}>
              <div className="font-bold text-base">{step.count}</div>
              <div className="text-[11px] font-medium opacity-90 mt-0.5">{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto pb-px">
        {[
          { id: 'VISAO_GERAL', label: 'Visão Geral' },
          { id: 'EMPRESAS', label: `Empresas (${filteredCompanies.length})` },
          { id: 'CONTATOS', label: 'Contatos Comerciais' },
          { id: 'CAMPANHAS', label: `Campanhas (${campaigns.length})` },
          { id: 'RESPOSTAS', label: `Respostas (${stats.repliesReceived})` },
          { id: 'OPORTUNIDADES', label: `Oportunidades (${stats.interestedCount})` },
          { id: 'CONFIGURACOES', label: 'Configurações do Agente' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'VISAO_GERAL' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Run Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Motor de Prospecção Diária
                </span>
                <span className="text-xs bg-indigo-500/30 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Meta: {settings?.dailyDiscoveryTarget || 50} empresas/dia
                </span>
              </div>
              <h2 className="text-lg font-bold">Buscar Novas Empresas Brasileiras</h2>
              <p className="text-xs text-indigo-200 mt-1 mb-5">
                Executa a varredura autônoma nos 12 segmentos prioritários (Cidadania Italiana, Comex, Intercâmbio, Advocacia) extraindo dados e qualificando por IA.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRunDiscovery}
                  disabled={isDiscovering}
                  className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-xs"
                >
                  <Search className={`w-3.5 h-3.5 mr-1.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                  {isDiscovering ? 'Buscando na Web...' : 'Executar Busca Agora'}
                </Button>
                <span className="text-xs text-indigo-300">
                  Última execução: {settings?.lastCronRunAt ? new Date(settings.lastCronRunAt).toLocaleString('pt-BR') : 'Hoje'}
                </span>
              </div>
            </div>

            {/* Campaign Dispatch Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> Despacho de E-mails Hostinger
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {stats.eligibleCount} empresas na fila
                </span>
              </div>
              <h2 className="text-lg font-bold">Disparar Apresentações Comerciais</h2>
              <p className="text-xs text-slate-300 mt-1 mb-5">
                Envia e-mails personalizados e individuais com remetente oficial <strong>contato@traduztudo.com</strong> com verificação de supressão e link de descadastro (LGPD).
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRunDispatch}
                  disabled={isDispatching || stats.eligibleCount === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  <Send className={`w-3.5 h-3.5 mr-1.5 ${isDispatching ? 'animate-spin' : ''}`} />
                  {isDispatching ? 'Enviando...' : 'Disparar Contatos Elegíveis'}
                </Button>
                <span className="text-xs text-slate-400">Limite: {settings?.dailySendLimit || 30}/dia</span>
              </div>
            </div>
          </div>

          {/* Quick List Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Últimas Empresas Descobertas
              </h3>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('EMPRESAS')} className="text-xs">
                Ver Todas ({companies.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {companies.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                Nenhuma empresa prospectada ainda. Clique no botão <strong>"Buscar Empresas Hoje"</strong> acima para iniciar a descoberta autônoma.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {companies.slice(0, 5).map((comp) => (
                  <div key={comp.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {comp.tradeName || comp.name}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {PROSPECT_SEGMENT_LABELS[comp.segment] || comp.segment}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {comp.city}/{comp.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {comp.contactEmail}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        Fit {comp.fitScore}%
                      </span>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedCompany(comp); setIsCompanyModalOpen(true); }} className="text-xs">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMPRESAS ENCONTRADAS */}
      {activeTab === 'EMPRESAS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap gap-2.5 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, CNPJ ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">Todos os Segmentos</option>
              {Object.entries(PROSPECT_SEGMENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">Todos os Estágios</option>
              {Object.entries(PROSPECT_STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Companies Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Segmento</th>
                    <th className="px-4 py-3 font-semibold">Fit Score</th>
                    <th className="px-4 py-3 font-semibold">Localização</th>
                    <th className="px-4 py-3 font-semibold">Contato Comercial</th>
                    <th className="px-4 py-3 font-semibold">Estágio Comercial</th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        Nenhuma empresa encontrada com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => {
                      const stageInfo = PROSPECT_STAGE_LABELS[c.status] || { label: c.status, color: 'slate' };
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {c.tradeName || c.name}
                            </div>
                            {c.tradeName && c.tradeName !== c.name && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{c.name}</div>
                            )}
                            {c.cnpj && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.cnpj}</div>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {PROSPECT_SEGMENT_LABELS[c.segment] || c.segment}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">{c.fitScore}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    c.fitScore >= 80 ? 'bg-emerald-500' : c.fitScore >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${c.fitScore}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                            {c.city}/{c.state}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[180px]">
                              {c.contactEmail}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              {c.phone && <span>{c.phone}</span>}
                              {c.whatsapp && (
                                <a
                                  href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:underline flex items-center gap-0.5"
                                  title="Chamar no WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" /> WhatsApp
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                c.status === 'LEAD_QUALIFICADO' || c.status === 'CLIENTE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : c.status === 'EMAIL_ENVIADO'
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                                  : c.status === 'DESCADASTRO'
                                  ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}
                            >
                              {stageInfo.label}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCompany(c);
                                setIsCompanyModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              Ver Dossiê
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTATOS COMERCIAIS */}
      {activeTab === 'CONTATOS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Diretório de Contatos Verificados ({companies.filter((c) => !!c.contactEmail).length})
            </h3>
            <span className="text-xs text-slate-400">Comunicações baseadas no Art. 7º, IX da LGPD</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {companies
              .filter((c) => !!c.contactEmail)
              .map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {c.tradeName || c.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${c.contactEmail}`} className="hover:underline truncate text-indigo-600 dark:text-indigo-400">
                      {c.contactEmail}
                    </a>
                  </div>
                  {c.phone && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Abrir WhatsApp Web
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: CAMPANHAS DE E-MAIL */}
      {activeTab === 'CAMPANHAS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Campanhas Comerciais Ativas</h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hostinger Mail Oficial Ativo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {camp.status}
                  </span>
                  <span className="text-xs text-slate-400">Limite: {camp.dailyLimit} e-mails/dia</span>
                </div>

                <h4 className="font-bold text-base text-slate-900 dark:text-white">{camp.name}</h4>

                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Assunto:</div>
                  <div className="truncate">{camp.subjectTemplate}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{camp.sentCount}</div>
                    <div className="text-[11px] text-slate-400">Enviados</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-bold text-sm text-purple-600">{camp.replyCount}</div>
                    <div className="text-[11px] text-slate-400">Respostas</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-bold text-sm text-emerald-600">{camp.interestedCount}</div>
                    <div className="text-[11px] text-slate-400">Leads</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleRunDispatch}
                  disabled={isDispatching}
                  className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Disparar para Contatos Desta Campanha
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CAIXA DE RESPOSTAS */}
      {activeTab === 'RESPOSTAS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Respostas de E-mail de Prospecção</h3>
            <span className="text-xs text-slate-400">Triagem inteligente por IA via Webhook Hostinger</span>
          </div>

          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            <Mail className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            Nenhuma resposta de prospecção pendente. Quando um prospect responder a um e-mail de contato, a mensagem será categorizada aqui automaticamente.
          </div>
        </div>
      )}

      {/* TAB 6: OPORTUNIDADES */}
      {activeTab === 'OPORTUNIDADES' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leads Qualificados & Oportunidades</h3>
            <Button size="sm" onClick={() => (window.location.href = '/crm/leads')} className="text-xs gap-1.5">
              Ver Funil Oficial do CRM <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {companies.filter((c) => ['LEAD_QUALIFICADO', 'ORCAMENTO', 'CLIENTE'].includes(c.status)).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
              <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              Nenhum prospect qualificado ainda. Você pode qualificar diretamente qualquer empresa na aba <strong>Empresas</strong> clicando em "Ver Dossiê" &rarr; "Converter em Lead no CRM".
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {companies
                .filter((c) => ['LEAD_QUALIFICADO', 'ORCAMENTO', 'CLIENTE'].includes(c.status))
                .map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">{c.tradeName || c.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {c.contactEmail} &bull; {c.city}/{c.state} &bull; Fit Score: {c.fitScore}%
                      </div>
                    </div>
                    <Badge variant="success">Oportunidade Ativa</Badge>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: CONFIGURAÇÕES DO AGENTE */}
      {activeTab === 'CONFIGURACOES' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Políticas Operacionais do Agente B2B</h3>
              <p className="text-xs text-slate-400 mt-0.5">Controle de limites diários, automação de envio e conformidade LGPD.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              Servidor SMTP Hostinger 100% Ativo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Meta Diária de Novas Empresas
              </label>
              <input
                type="number"
                value={settings?.dailyDiscoveryTarget ?? 20}
                onChange={(e) => settings && setSettings({ ...settings, dailyDiscoveryTarget: Number(e.target.value) })}
                className="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Quantidade máxima de empresas prospectadas por dia.</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Limite Diário de Disparos de E-mail (Opção B: 15 e-mails/dia)
              </label>
              <input
                type="number"
                value={settings?.dailySendLimit ?? 15}
                onChange={(e) => settings && setSettings({ ...settings, dailySendLimit: Number(e.target.value) })}
                className="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Proteção rígida contra SPAM. Recomendado manter em 15/dia.</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                  Envio Automático Sem Aprovação Individual (Opção B - Ativo)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Quando ativado, os e-mails elegíveis são despachados automaticamente pelo cron diário da Vercel (dias úteis às 11h).
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings?.autoSendEligible ?? true}
                onChange={(e) => settings && setSettings({ ...settings, autoSendEligible: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSaveSettings()}
              disabled={isSavingSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              {isSavingSettings ? 'Salvando...' : 'Salvar Alterações de Configuração'}
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Lista de Supressão e Opt-Out (LGPD)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Garante que nenhum e-mail de empresa ou pessoa que solicitou descadastro receba novos contatos.
            </p>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
              Total de contatos suprimidos: {stats.optOutCount}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPANY DOSSIER & AI ANALYSIS */}
      {isCompanyModalOpen && selectedCompany && (
        <Modal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          title={selectedCompany.tradeName || selectedCompany.name}
          description={`${selectedCompany.city}/${selectedCompany.state} &bull; ${PROSPECT_SEGMENT_LABELS[selectedCompany.segment] || selectedCompany.segment}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Fit Score & Status */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs text-slate-400 block">Afinidade Comercial (Fit Score)</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedCompany.fitScore}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Estágio Comercial</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs">
                  {PROSPECT_STAGE_LABELS[selectedCompany.status]?.label || selectedCompany.status}
                </span>
              </div>
            </div>

            {/* AI Diagnosis */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Diagnóstico do Agente de IA Comercial
              </span>
              <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                {selectedCompany.aiAnalysis?.reasoning || selectedCompany.aiAnalysis?.summary}
              </p>
              <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60">
                <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 block mb-1">
                  Serviços Recomendados para Oferecer:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCompany.relevantServices.map((srv, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-indigo-200 dark:border-slate-700">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">E-mail Comercial:</span>
                <a href={`mailto:${selectedCompany.contactEmail}`} className="font-semibold text-indigo-600 hover:underline">
                  {selectedCompany.contactEmail}
                </a>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Telefone / WhatsApp:</span>
                <span className="font-semibold">{selectedCompany.phone || selectedCompany.whatsapp || 'Não informado'}</span>
              </div>
              {selectedCompany.website && (
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Website Oficial:</span>
                  <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                    {selectedCompany.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Activity History */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">Histórico de Ações</span>
              <div className="max-h-36 overflow-y-auto space-y-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                {selectedCompany.activities.map((act) => (
                  <div key={act.id} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>{act.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Note Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar nota comercial..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
              />
              <Button size="sm" variant="outline" onClick={() => handleAddNote(selectedCompany.id)}>
                Salvar Nota
              </Button>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleOptOut(selectedCompany.id)}
                className="text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <Ban className="w-3.5 h-3.5 mr-1" /> {selectedCompany.optOut ? 'Remover Opt-out' : 'Opt-Out (LGPD)'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSendEmail(selectedCompany.id)}
                  disabled={isSendingEmail || !selectedCompany.contactEmail || selectedCompany.optOut}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  <Send className={`w-3.5 h-3.5 mr-1.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                  {isSendingEmail ? 'Enviando...' : 'Enviar E-mail (com PDF e Cartão)'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConvertToLead(selectedCompany.id)}
                  disabled={selectedCompany.status === 'LEAD_QUALIFICADO'}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Converter em Lead no CRM
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: NEW COMPANY */}
      {isNewCompanyModalOpen && (
        <Modal
          isOpen={isNewCompanyModalOpen}
          onClose={() => setIsNewCompanyModalOpen(false)}
          title="Cadastrar Nova Empresa para Prospecção"
          description="Adiciona uma nova empresa ao motor de qualificação e campanhas comerciais."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCompany} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="font-semibold block mb-1">Razão Social / Nome da Empresa *</label>
              <input
                type="text"
                required
                value={newCompanyForm.name}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                placeholder="Ex: Cidadania Italiana Assessoria Ltda"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={newCompanyForm.tradeName}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, tradeName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">CNPJ</label>
                <input
                  type="text"
                  value={newCompanyForm.cnpj}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, cnpj: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Segmento Prioritário *</label>
              <select
                value={newCompanyForm.segment}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, segment: e.target.value as ProspectSegment })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              >
                {Object.entries(PROSPECT_SEGMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Cidade</label>
                <input
                  type="text"
                  value={newCompanyForm.city}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, city: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={newCompanyForm.state}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">E-mail Comercial de Contato *</label>
              <input
                type="email"
                required
                value={newCompanyForm.contactEmail}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, contactEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Telefone</label>
                <input
                  type="text"
                  value={newCompanyForm.phone}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={newCompanyForm.whatsapp}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, whatsapp: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="outline" onClick={() => setIsNewCompanyModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Cadastrar Empresa
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
