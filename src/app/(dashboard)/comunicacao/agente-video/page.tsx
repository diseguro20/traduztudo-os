'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  PhoneCall,
  Sparkles,
  Bot,
  Settings2,
  Sliders,
  Wrench,
  PhoneForwarded,
  History,
  Save,
  Copy,
  Check,
  Play,
  Volume2,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  AIAgentConfig,
  AICallConversation,
  AgentType,
} from '@/types/ai-voice';
import {
  getStoredAgentConfig,
  saveStoredAgentConfig,
  getStoredConversations,
  saveStoredConversation,
} from '@/lib/ai-voice/agentService';
import { getVoiceById } from '@/lib/ai-voice/voices';
import { VoiceSelectorDialog } from '@/components/ai-voice/VoiceSelectorDialog';
import { LiveMeetingModal } from '@/components/ai-voice/LiveMeetingModal';

export default function AgenteVideoKloelPage() {
  const [agent, setAgent] = useState<AIAgentConfig>(getStoredAgentConfig());
  const [activeTab, setActiveTab] = useState<'geral' | 'regras' | 'tecnico' | 'ferramentas' | 'telefonia' | 'historico'>('geral');
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [conversations, setConversations] = useState<AICallConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AICallConversation | null>(null);

  // Load conversations on mount
  useEffect(() => {
    setAgent(getStoredAgentConfig());
    setConversations(getStoredConversations());
  }, []);

  const handleSaveConfig = () => {
    saveStoredAgentConfig(agent);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyMeetingLink = () => {
    const link = `https://traduztudo.com/reuniao-ia/${agent.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCallEnded = (conv: AICallConversation) => {
    saveStoredConversation(conv);
    setConversations(getStoredConversations());
  };

  const selectedVoice = getVoiceById(agent.voiceId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Master Agent Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 border border-zinc-800 shadow-xl text-white">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg border border-indigo-400/30">
            <Bot className="w-8 h-8 text-white" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{agent.name}</h1>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-xs">
                No Ar · LiveKit WebRTC & Twilio SIP
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Atendimento automatizado por voz e vídeo para orçamentos instantâneos e parcerias B2B.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMeetingLink}
            className="bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-700 text-xs flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Link Copiado!' : 'Copiar Link da Reunião'}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsMeetingModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Video className="w-4 h-4" />
            Testar Reunião de Vídeo / Voz
          </Button>

          <Button
            size="sm"
            onClick={handleSaveConfig}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saveSuccess ? 'Salvo!' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation (Kloel AI Architecture) */}
      <div className="flex items-center border-b border-gray-200 overflow-x-auto gap-2 bg-white px-2 rounded-xl shadow-sm">
        {[
          { id: 'geral', label: 'Geral', icon: Settings2 },
          { id: 'regras', label: 'Comportamento & Regras', icon: ShieldCheck },
          { id: 'tecnico', label: 'Técnico & Chamadas', icon: Sliders },
          { id: 'ferramentas', label: 'Ferramentas & Ações', icon: Wrench },
          { id: 'telefonia', label: 'Telefonia Twilio SIP', icon: PhoneForwarded },
          { id: 'historico', label: 'Histórico de Conversas', icon: History, count: conversations.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GERAL */}
      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Identidade do Assistente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome de Apresentação
                  </label>
                  <input
                    type="text"
                    value={agent.name}
                    onChange={e => setAgent({ ...agent, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de Assistente
                  </label>
                  <select
                    value={agent.type}
                    onChange={e => setAgent({ ...agent, type: e.target.value as AgentType })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="omni">Chat + Ligação de Voz e Vídeo (Omnichannel)</option>
                    <option value="voice">Apenas Voz e Vídeo</option>
                    <option value="chat">Apenas Chat Web</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Saudação Inicial (Primeira fala ao atender)
                </label>
                <textarea
                  rows={2}
                  value={agent.greeting}
                  onChange={e => setAgent({ ...agent, greeting: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  A fala emitida assim que a ligação WebRTC ou SIP é atendida pelo cliente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Prompt do Sistema (Persona, Diretrizes e Regras Comerciais)
                </label>
                <textarea
                  rows={10}
                  value={agent.prompt}
                  onChange={e => setAgent({ ...agent, prompt: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Voice Card & Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Voz Neural Ativa
              </h3>

              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm ${selectedVoice.color}`}
                  >
                    {selectedVoice.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{selectedVoice.name}</span>
                      <Badge variant="outline" className="border-indigo-400 text-indigo-700 text-[10px] py-0">
                        {selectedVoice.accent}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedVoice.detail}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVoiceDialogOpen(true)}
                className="w-full text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Trocar Voz ou Clonar Voz Própria
              </Button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Links & Compartilhamento
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Envie o link direto para o cliente entrar na reunião de vídeo com a IA pelo navegador sem instalar nada:
              </p>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-gray-700 truncate">
                https://traduztudo.com/reuniao-ia/{agent.id}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyMeetingLink}
                className="w-full text-xs font-semibold"
              >
                {copiedLink ? 'Link Copiado!' : 'Copiar Link'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPORTAMENTO & REGRAS */}
      {activeTab === 'regras' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Regras de Comportamento em Ligação</h3>
            <p className="text-xs text-gray-500">
              Controle como o assistente reage a perguntas fora de contexto, clientes nervosos ou concorrentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* AI Disclosure */}
            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Aviso de Inteligência Artificial
              </label>
              <select
                value={agent.rules.aiDisclosure}
                onChange={e =>
                  setAgent({
                    ...agent,
                    rules: { ...agent.rules, aiDisclosure: e.target.value as any },
                  })
                }
                className="w-full p-2.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="if_asked">Apenas se o cliente perguntar se é uma IA</option>
                <option value="always">Sempre avisar no início da ligação</option>
                <option value="never">Nunca mencionar ativamente</option>
              </select>
              <p className="text-[11px] text-gray-500">
                Se o cliente perguntar: &quot;Você é um robô?&quot;, responde com transparência e naturalidade.
              </p>
            </div>

            {/* Conversation Style */}
            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Estilo de Conversação
              </label>
              <select
                value={agent.rules.style}
                onChange={e =>
                  setAgent({
                    ...agent,
                    rules: { ...agent.rules, style: e.target.value as any },
                  })
                }
                className="w-full p-2.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="professional">Profissional & Jurídico (Ideal para Tradução Juramentada)</option>
                <option value="friendly">Amigável & Empático (Comercial)</option>
                <option value="direct">Direto ao Ponto & Objetivo</option>
              </select>
            </div>

            {/* Angry callers */}
            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Clientes Nervosos ou com Reclamações
              </label>
              <select
                value={agent.rules.angry.behavior}
                onChange={e =>
                  setAgent({
                    ...agent,
                    rules: {
                      ...agent.rules,
                      angry: { ...agent.rules.angry, behavior: e.target.value as any },
                    },
                  })
                }
                className="w-full p-2.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="STAY_CALM_AND_LISTEN">Manter a calma, escutar com empatia e oferecer transbordo</option>
                <option value="OFFER_MANAGER">Transferir imediatamente para um gerente humano</option>
                <option value="APOLOGIZE">Pedir desculpas formais e registrar protocolo urgente</option>
              </select>
            </div>

            {/* Competitors & Sales */}
            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Tratamento de Concorrentes
              </label>
              <select
                value={agent.rules.sales.competitorBehavior}
                onChange={e =>
                  setAgent({
                    ...agent,
                    rules: {
                      ...agent.rules,
                      sales: { ...agent.rules.sales, competitorBehavior: e.target.value as any },
                    },
                  })
                }
                className="w-full p-2.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="STAY_NEUTRAL">Manter neutralidade e destacar diferenciais da TraduzTudo</option>
                <option value="EMPHASIZE_STRENGTHS">Enfatizar agilidade, certificação ICP-Brasil e preço por lauda</option>
              </select>
            </div>
          </div>

          {/* Pronunciation Dictionary */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Dicionário Fonético de Termos Específicos
            </h4>
            <div className="space-y-2">
              {agent.rules.pronunciation.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={item.word}
                    placeholder="Palavra escrita"
                    onChange={e => {
                      const updated = [...agent.rules.pronunciation];
                      updated[idx].word = e.target.value;
                      setAgent({ ...agent, rules: { ...agent.rules, pronunciation: updated } });
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                  />
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={item.phonetic}
                    placeholder="Como deve soar"
                    onChange={e => {
                      const updated = [...agent.rules.pronunciation];
                      updated[idx].phonetic = e.target.value;
                      setAgent({ ...agent, rules: { ...agent.rules, pronunciation: updated } });
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      const updated = agent.rules.pronunciation.filter((_, i) => i !== idx);
                      setAgent({ ...agent, rules: { ...agent.rules, pronunciation: updated } });
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAgent({
                  ...agent,
                  rules: {
                    ...agent.rules,
                    pronunciation: [...agent.rules.pronunciation, { word: '', phonetic: '' }],
                  },
                });
              }}
              className="text-xs flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Palavra ao Dicionário
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: TÉCNICO & LIGAÇÕES */}
      {activeTab === 'tecnico' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Parâmetros Técnicos do Motor de Voz</h3>
            <p className="text-xs text-gray-500">
              Ajustes de tempo de resposta, sensibilidade VAD (Voice Activity Detection) e som ambiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Duração Máxima da Chamada
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={agent.technical.maxCallDuration}
                  onChange={e =>
                    setAgent({
                      ...agent,
                      technical: {
                        ...agent.technical,
                        maxCallDuration: parseInt(e.target.value, 10) || 20,
                      },
                    })
                  }
                  className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <span className="text-xs text-gray-500">minutos</span>
              </div>
              <p className="text-[11px] text-gray-400">Encerra automaticamente após esse tempo.</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Tempo de Espera por Silêncio
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={agent.technical.silenceTimeout}
                  onChange={e =>
                    setAgent({
                      ...agent,
                      technical: {
                        ...agent.technical,
                        silenceTimeout: parseInt(e.target.value, 10) || 10,
                      },
                    })
                  }
                  className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <span className="text-xs text-gray-500">segundos</span>
              </div>
              <p className="text-[11px] text-gray-400">Tempo sem fala do cliente para retomar contato.</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Som Ambiente de Fundo (Humano)
              </label>
              <select
                value={agent.technical.ambientSound}
                onChange={e =>
                  setAgent({
                    ...agent,
                    technical: { ...agent.technical, ambientSound: e.target.value as any },
                  })
                }
                className="w-full p-2.5 text-xs border border-gray-300 rounded-lg bg-white"
              >
                <option value="office">Escritório Suave (Sensação humana)</option>
                <option value="callcenter">Call Center Suave</option>
                <option value="coffee">Cafeteria / Dinâmico</option>
                <option value="silent">Silencioso (Zero ruído de estúdio)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">
                  Sensibilidade a Interrupção (VAD)
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {Math.round(agent.technical.sensitivity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={agent.technical.sensitivity}
                onChange={e =>
                  setAgent({
                    ...agent,
                    technical: {
                      ...agent.technical,
                      sensitivity: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-600"
              />
              <p className="text-[11px] text-gray-400">
                Permite ao cliente interromper o assistente naturalmente quando falar por cima.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">Velocidade da Voz</label>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {agent.technical.speechSpeed}x
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={agent.technical.speechSpeed}
                onChange={e =>
                  setAgent({
                    ...agent,
                    technical: {
                      ...agent.technical,
                      speechSpeed: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-600"
              />
              <p className="text-[11px] text-gray-400">
                1.25x a 1.35x remove hesitações e soa como um atendente ágil de alta performance.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 space-y-2 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Gravação de Áudio
                </label>
                <p className="text-[11px] text-gray-500">
                  Grava o áudio completo de todas as reuniões e ligações para auditoria e histórico.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={agent.technical.recordAudio}
                  onChange={e =>
                    setAgent({
                      ...agent,
                      technical: { ...agent.technical, recordAudio: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-800">
                  Gravação Habilitada (LGPD compliant)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FERRAMENTAS & AÇÕES */}
      {activeTab === 'ferramentas' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Ferramentas & Integrações em Chamada</h3>
            <p className="text-xs text-gray-500">
              Ações executadas em tempo real pela IA durante a conversa falada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'create_quote',
                name: 'Criação Automática de Orçamentos no CRM',
                desc: 'Calcula o número de laudas e valores e gera o orçamento oficial com número de pedido no banco de dados.',
                enabled: agent.tools.includes('create_quote'),
              },
              {
                id: 'search_knowledge',
                name: 'Consulta à Base de Conhecimento e Prazos',
                desc: 'Acessa regras de laudas juramentadas, apostilamento de Haia e prazos padrão de entrega.',
                enabled: agent.tools.includes('search_knowledge'),
              },
              {
                id: 'lookup_contact',
                name: 'Identificação de Clientes Existentes',
                desc: 'Busca pedidos anteriores e histórico de orçamentos pelo telefone ou e-mail do chamador.',
                enabled: agent.tools.includes('lookup_contact'),
              },
              {
                id: 'schedule_booking',
                name: 'Agendamento de Reuniões com Tradutores',
                desc: 'Marca consultas de alinhamento com tradutores juramentados diretamente na agenda da empresa.',
                enabled: agent.tools.includes('schedule_booking'),
              },
              {
                id: 'transfer_call',
                name: 'Transbordo Telefônico para Equipe Humana',
                desc: 'Transfere a ligação instantaneamente para o telefone ou ramal da gerência.',
                enabled: agent.tools.includes('transfer_call'),
              },
              {
                id: 'send_whatsapp',
                name: 'Disparo de Link via WhatsApp',
                desc: 'Envia o resumo do orçamento ou link de upload de documentos para o WhatsApp do cliente.',
                enabled: agent.tools.includes('send_whatsapp'),
              },
            ].map(tool => (
              <div
                key={tool.id}
                className="p-4 rounded-xl border border-gray-200 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{tool.name}</span>
                    <Badge variant="outline" className="text-[10px] text-gray-500">
                      {tool.id}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{tool.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={tool.enabled}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...agent.tools, tool.id]
                      : agent.tools.filter(t => t !== tool.id);
                    setAgent({ ...agent, tools: next });
                  }}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 mt-1"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TELEFONIA TWILIO SIP */}
      {activeTab === 'telefonia' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Integração de Telefonia Twilio SIP Trunking</h3>
            <p className="text-xs text-gray-500">
              Permite receber ligações de qualquer telefone fixo ou celular diretamente no motor de IA LiveKit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
              <span className="text-xs font-bold text-indigo-900 block">Número Twilio Conectado</span>
              <input
                type="text"
                value={agent.telephony.phoneNumber || ''}
                onChange={e =>
                  setAgent({
                    ...agent,
                    telephony: { ...agent.telephony, phoneNumber: e.target.value },
                  })
                }
                placeholder="+55 11 4003-8822"
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl bg-white outline-none font-mono"
              />
              <p className="text-[11px] text-gray-500">
                Número cadastrado na Twilio configurado com o webhook abaixo.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-800 block">Domínio LiveKit SIP Trunk</span>
              <input
                type="text"
                value={agent.telephony.sipDomain || ''}
                onChange={e =>
                  setAgent({
                    ...agent,
                    telephony: { ...agent.telephony, sipDomain: e.target.value },
                  })
                }
                placeholder="traduztudo.sip.livekit.cloud"
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl bg-white outline-none font-mono"
              />
              <p className="text-[11px] text-gray-500">
                Domínio SIP para onde as ligações PSTN são roteadas em tempo real.
              </p>
            </div>

            <div className="md:col-span-2 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <span className="text-xs font-bold text-gray-800 block">Webhook Inbound Twilio (TwiML)</span>
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs font-mono text-gray-700 flex items-center justify-between">
                <span>https://traduztudo.com/api/ai/telephony/webhook</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText('https://traduztudo.com/api/ai/telephony/webhook');
                    alert('Webhook copiado com sucesso!');
                  }}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-[11px] text-gray-500">
                Cole esta URL na configuração do seu número de telefone na Twilio Console.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: HISTÓRICO REAL DE CONVERSAS */}
      {activeTab === 'historico' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Histórico de Chamadas e Reuniões</h3>
              <p className="text-xs text-gray-500">
                Registro real das conversas realizadas, durações, transcrições e orçamentos gerados.
              </p>
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-gray-200 text-gray-500 space-y-3">
              <History className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-700">Nenhuma chamada gravada ainda</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Assim que você ou um cliente iniciar uma reunião de vídeo ou ligação telefônica, o registro completo com transcrição aparecerá aqui.
              </p>
              <Button
                size="sm"
                onClick={() => setIsMeetingModalOpen(true)}
                className="mt-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Fazer Primeira Chamada de Teste
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">
                          {conv.callerName || 'Cliente Visitante'}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                          {conv.status === 'completed' ? 'Finalizada' : conv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {conv.extractedData.summary || 'Atendimento por vídeo'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {Math.floor(conv.durationSeconds / 60)}m {conv.durationSeconds % 60}s
                    </span>

                    {conv.createdQuoteId && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        Orçamento #{conv.createdQuoteId}
                      </span>
                    )}

                    <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold">
                      Ver Transcrição
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Conversation Drawer Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-gray-900">Detalhes da Chamada</h4>
                <p className="text-xs text-gray-500">
                  Duração: {selectedConversation.durationSeconds}s · Data:{' '}
                  {new Date(selectedConversation.startedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Transcrição Completa da Conversa
              </h5>
              <div className="space-y-2 text-xs">
                {selectedConversation.transcripts.map(t => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl ${
                      t.speaker === 'caller'
                        ? 'bg-gray-100 text-gray-900 ml-8'
                        : 'bg-indigo-50 text-indigo-950 mr-8 border border-indigo-100'
                    }`}
                  >
                    <span className="font-bold block text-[10px] text-gray-500 mb-1">
                      {t.speaker === 'caller' ? 'Cliente' : agent.name}
                    </span>
                    {t.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <Button size="sm" onClick={() => setSelectedConversation(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Selector Dialog */}
      <VoiceSelectorDialog
        isOpen={isVoiceDialogOpen}
        onClose={() => setIsVoiceDialogOpen(false)}
        selectedVoiceId={agent.voiceId}
        onSelectVoice={voiceId => {
          setAgent({ ...agent, voiceId });
          saveStoredAgentConfig({ ...agent, voiceId });
        }}
      />

      {/* Live Video Meeting Modal (LiveKit WebRTC) */}
      <LiveMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        agent={agent}
        onCallEnded={handleCallEnded}
      />
    </div>
  );
}
