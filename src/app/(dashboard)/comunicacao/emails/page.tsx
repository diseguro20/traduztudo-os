'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Inbox,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  User,
  FileText,
  Paperclip,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  Building2,
  Globe,
  Trash2,
  Check,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Bot,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { databaseStore } from '@/lib/db';
import { EmailMessage, EmailCategory, EmailMessageStatus } from '@/types/emailCentral';
import { formatDate } from '@/lib/utils';

export default function CentralEmailsPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    awaitingApproval: 0,
    approved: 0,
    sent: 0,
    quotes: 0,
    citizenship: 0,
    rejectedOrManual: 0,
  });
  const [hostingerStatus, setHostingerStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'AWAITING' | 'ALL' | 'ORCAMENTO' | 'CIDADANIA' | 'SENT' | 'MANUAL'>('AWAITING');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  // Draft editing state
  const [draftContent, setDraftContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Lead conversion feedback
  const [convertedLeadId, setConvertedLeadId] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/email/central');
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        setStats(data.stats || {});
        setHostingerStatus(data.hostingerStatus || null);

        // Auto select first message if none selected
        if (data.emails && data.emails.length > 0 && !selectedEmail) {
          const firstPending = data.emails.find((e: EmailMessage) => e.status === 'AWAITING_APPROVAL') || data.emails[0];
          setSelectedEmail(firstPending);
          setDraftContent(firstPending.approval?.editedDraft || firstPending.aiAnalysis?.suggestedDraft || '');
        }
      }
    } catch (err) {
      console.error('Erro ao buscar e-mails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSelectEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setDraftContent(email.approval?.editedDraft || email.aiAnalysis?.suggestedDraft || '');
    setActionSuccess(null);
    setConvertedLeadId(null);
  };

  const handleApproveAndSend = async () => {
    if (!selectedEmail) return;
    try {
      setIsSending(true);
      const res = await fetch('/api/email/central/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          action: 'APPROVE_AND_SEND',
          editedDraft: draftContent,
          userId: user?.id || 'user-admin',
          userName: user?.name || 'Administrador',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message || 'Resposta aprovada e enviada com sucesso!');
        await fetchEmails();
        if (data.email) {
          setSelectedEmail(data.email);
        }
      } else {
        alert(data.error || 'Falha ao despachar e-mail.');
      }
    } catch (err) {
      alert('Erro de comunicação ao enviar resposta.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedEmail) return;
    try {
      const res = await fetch('/api/email/central/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          action: 'SAVE_DRAFT',
          editedDraft: draftContent,
          userId: user?.id,
          userName: user?.name,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess('Rascunho atualizado com sucesso!');
        await fetchEmails();
        if (data.email) setSelectedEmail(data.email);
      }
    } catch {
      alert('Erro ao salvar rascunho.');
    }
  };

  const handleReject = async () => {
    if (!selectedEmail) return;
    try {
      const res = await fetch('/api/email/central/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          action: 'REJECT',
          rejectionReason,
          userId: user?.id,
          userName: user?.name,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsRejectModalOpen(false);
        setActionSuccess('Sugestão rejeitada. Mensagem movida para atendimento manual.');
        await fetchEmails();
        if (data.email) setSelectedEmail(data.email);
      }
    } catch {
      alert('Erro ao rejeitar sugestão.');
    }
  };

  const handleDeleteLGPD = async () => {
    if (!selectedEmail) return;
    if (!confirm('Deseja realmente anonimizar e excluir os dados deste e-mail em conformidade com a LGPD?')) return;
    try {
      const res = await fetch('/api/email/central/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          action: 'DELETE_LGPD',
        }),
      });
      if (res.ok) {
        setSelectedEmail(null);
        await fetchEmails();
      }
    } catch {
      alert('Erro ao excluir dados.');
    }
  };

  const handleConvertToLead = () => {
    if (!selectedEmail) return;
    try {
      const tenant = databaseStore.getTenant();
      const newLead = databaseStore.createLead({
        tenantId: tenant?.id || 'traduztudo-matriz',
        name: selectedEmail.from.name || 'Cliente de E-mail',
        type: 'PF',
        email: selectedEmail.from.email,
        phone: '',
        origin: 'Hostinger Mail (E-mail)',
        interestedServiceName: selectedEmail.classification.serviceType || 'Tradução Juramentada',
        sourceLanguage: selectedEmail.classification.sourceLanguage || 'Português',
        targetLanguage: selectedEmail.classification.targetLanguage || 'Inglês',
        status: 'novo',
        notes: `Importado da Central de E-mails Traduz Tudo.\nAssunto: ${selectedEmail.subject}\nResumo da IA: ${selectedEmail.aiAnalysis.summary}`,
      });

      setConvertedLeadId(newLead.id);
      setActionSuccess(`Lead cadastrado no CRM com sucesso sob o código "${newLead.name}"!`);
    } catch (e: any) {
      alert('Erro ao converter em lead: ' + e?.message);
    }
  };

  // Filtered emails
  const filteredEmails = emails.filter((item) => {
    if (activeTab === 'AWAITING' && item.status !== 'AWAITING_APPROVAL') return false;
    if (activeTab === 'ORCAMENTO' && item.classification.category !== 'ORCAMENTO') return false;
    if (activeTab === 'CIDADANIA' && item.classification.category !== 'CIDADANIA') return false;
    if (activeTab === 'SENT' && item.status !== 'SENT') return false;
    if (activeTab === 'MANUAL' && item.status !== 'MANUAL_REQUIRED' && item.status !== 'REJECTED') return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.subject.toLowerCase().includes(term) ||
      item.from.name.toLowerCase().includes(term) ||
      item.from.email.toLowerCase().includes(term) ||
      item.bodyText.toLowerCase().includes(term)
    );
  });

  const getCategoryBadge = (category: EmailCategory) => {
    switch (category) {
      case 'ORCAMENTO':
        return <Badge variant="warning">💰 Orçamento</Badge>;
      case 'CIDADANIA':
        return <Badge variant="purple">🏛️ Cidadania</Badge>;
      case 'STATUS_PEDIDO':
        return <Badge variant="info">📦 Status do Pedido</Badge>;
      case 'CORPORATIVO':
        return <Badge variant="success">🏢 Corporativo</Badge>;
      case 'DUVIDA':
        return <Badge variant="default">❓ Dúvida Geral</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getStatusBadge = (status: EmailMessageStatus) => {
    switch (status) {
      case 'AWAITING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-600" /> Aguardando Aprovação
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enviado
          </span>
        );
      case 'MANUAL_REQUIRED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700 whitespace-nowrap">
            <XCircle className="w-3 h-3 text-rose-600" /> Atendimento Manual
          </span>
        );
      case 'SENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse whitespace-nowrap">
            <Send className="w-3 h-3 text-blue-600" /> Enviando...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" /> Central de E-mails & Atendimento com IA
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" /> Hostinger Mail Oficial
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recepção inteligente de e-mails em <strong className="text-slate-700 dark:text-slate-200">contato@traduztudo.com</strong> com triagem por IA, análise de documentos e aprovação humana antes do envio.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchEmails}
            disabled={isLoading}
            className="text-xs gap-1.5"
            title="Atualizar caixa de entrada"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Aguardando Aprovação</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.awaitingApproval}</p>
          <span className="text-[11px] text-slate-400">Requer validação do atendente</span>
        </div>

        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Orçamentos Recebidos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.quotes}</p>
          <span className="text-[11px] text-slate-400">Triados pelo agente</span>
        </div>

        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cidadania & Dossiês</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.citizenship}</p>
          <span className="text-[11px] text-slate-400">Italiana, Haia e outras</span>
        </div>

        <div className="card-hover bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Respostas Enviadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.sent}</p>
          <span className="text-[11px] text-slate-400">Aprovadas e disparadas</span>
        </div>
      </div>

      {/* Main Workspace (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Column: Email List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Search & Tabs Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por cliente, e-mail, assunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto touch-scroll text-xs pb-0.5">
              <button
                onClick={() => setActiveTab('AWAITING')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'AWAITING'
                    ? 'bg-amber-500 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Aguardando ({stats.awaitingApproval})
              </button>
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setActiveTab('ORCAMENTO')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'ORCAMENTO'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Orçamentos
              </button>
              <button
                onClick={() => setActiveTab('CIDADANIA')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'CIDADANIA'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Cidadania
              </button>
              <button
                onClick={() => setActiveTab('SENT')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'SENT'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Enviados
              </button>
            </div>
          </div>

          {/* Email Item Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum e-mail encontrado com os filtros atuais.
              </div>
            ) : (
              filteredEmails.map((item) => {
                const isSelected = selectedEmail?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEmail(item)}
                    className={`p-3.5 transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {item.from.name}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDate(item.receivedAt)}
                      </span>
                    </div>

                    <p className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate mb-1">
                      {item.subject}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {item.snippet || item.bodyText}
                    </p>

                    <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getCategoryBadge(item.classification.category)}
                        {item.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            <Paperclip className="w-3 h-3" /> {item.attachments.length}
                          </span>
                        )}
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Email Details & AI Draft Review (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {!selectedEmail ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Mail className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhum e-mail selecionado</p>
              <p className="text-xs text-slate-500 mt-1">Selecione um e-mail na lista lateral para revisar a análise da IA.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Message Header Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmail.from.name}</span>
                      <span>&lt;{selectedEmail.from.email}&gt;</span>
                      <span>•</span>
                      <span>Para: contato@traduztudo.com</span>
                      <span>•</span>
                      <span>{formatDate(selectedEmail.receivedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(selectedEmail.status)}
                    <button
                      onClick={handleDeleteLGPD}
                      title="Excluir ou anonimizar dados (LGPD)"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Attachments List if any */}
                {selectedEmail.attachments.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" /> Anexos do Cliente:
                    </span>
                    {selectedEmail.attachments.map((att) => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {att.name} ({(att.size / 1024).toFixed(0)} KB)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Original Body */}
              <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Mensagem Original do Cliente
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.bodyText}
                </p>
              </div>

              {/* AI Analysis & Intelligence Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Diagnóstico da IA — Traduz Tudo
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Confiança: {Math.round(selectedEmail.classification.confidence * 100)}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Resumo da Demanda:</strong> {selectedEmail.aiAnalysis.summary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Serviço Mapeado</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {selectedEmail.classification.serviceType || 'Geral'}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Idiomas</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {selectedEmail.classification.sourceLanguage || 'POR'} → {selectedEmail.classification.targetLanguage || 'Pendente'}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Sentimento</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {selectedEmail.aiAnalysis.sentiment}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Ação Recomendada</span>
                    <span className="font-semibold text-blue-600 dark:text-cyan-400 truncate block">
                      {selectedEmail.aiAnalysis.recommendedAction}
                    </span>
                  </div>
                </div>

                {selectedEmail.classification.missingInformation.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                    <strong>Informações Pendentes a Solicitar:</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {selectedEmail.classification.missingInformation.map((info, idx) => (
                        <li key={idx}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedEmail.aiAnalysis.jailbreakAttemptDetected && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Atenção: Foi detectada tentativa de manipulação de prompt no corpo do e-mail. Ação automatizada desativada.</span>
                  </div>
                )}
              </div>

              {/* Response Draft Editor */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                      Rascunho de Resposta
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Revise ou edite livremente antes de enviar)
                    </span>
                  </div>
                  <button
                    onClick={() => setDraftContent(selectedEmail.aiAnalysis.suggestedDraft)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    title="Restaurar sugestão original da IA"
                  >
                    Restaurar da IA
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  disabled={selectedEmail.status === 'SENT'}
                  placeholder="Escreva ou edite a resposta aqui..."
                  className="w-full p-3.5 text-xs sm:text-sm font-sans rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
                />

                {actionSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {/* Action Buttons Bar */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleConvertToLead}
                      className="text-xs gap-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      title="Salvar remetente como Lead no CRM"
                    >
                      <User className="w-3.5 h-3.5" /> Criar Lead no CRM
                    </Button>

                    {selectedEmail.status !== 'SENT' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveDraft}
                        className="text-xs"
                      >
                        Salvar Rascunho
                      </Button>
                    )}
                  </div>

                  {selectedEmail.status !== 'SENT' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsRejectModalOpen(true)}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        Rejeitar IA
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleApproveAndSend}
                        disabled={isSending}
                        className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 font-semibold"
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Aprovar e Enviar Resposta
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Enviado por {selectedEmail.approval?.approvedByUserName || 'Equipe'} em {formatDate(selectedEmail.approval?.sentAt)}
                    </div>
                  )}
                </div>

                {/* Audit Trail Accordion / Info */}
                {selectedEmail.auditTrail.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 block">
                      Trilha de Auditoria da Mensagem:
                    </span>
                    {selectedEmail.auditTrail.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px]">
                        <span>• {log.action} ({log.details})</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsRejectModalOpen(false)}
          title="Rejeitar Sugestão da IA"
          description="Informe o motivo da rejeição para registrar na auditoria e mover o e-mail para atendimento manual."
        >
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Motivo / Justificativa
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Demanda complexa com múltiplos idiomas, necessária análise prévia de tradutor juramentado específico..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsRejectModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={handleReject}>
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
