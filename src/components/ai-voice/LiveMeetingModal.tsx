'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LiveKitCallSession } from '@/lib/ai-voice/livekitCallClient';
import { AIAgentConfig, TranscriptLine, AICallConversation } from '@/types/ai-voice';
import { getVoiceById } from '@/lib/ai-voice/voices';
import { databaseStore } from '@/lib/db';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface LiveMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AIAgentConfig;
  onCallEnded?: (conversation: AICallConversation) => void;
}

export function LiveMeetingModal({
  isOpen,
  onClose,
  agent,
  onCallEnded,
}: LiveMeetingModalProps) {
  const [callStatus, setCallStatus] = useState<'connecting' | 'live' | 'ended' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [quoteCreated, setQuoteCreated] = useState<string | null>(null);

  // Extracted entities
  const [extractedEntities, setExtractedEntities] = useState({
    docType: 'Certidão / Documento Juramentado',
    sourceLang: 'Português',
    targetLang: 'Inglês',
    laudas: 3,
    estimatedValue: 285.0,
    clientName: 'Visitante da Reunião',
  });

  const sessionRef = useRef<LiveKitCallSession | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Call Session
  useEffect(() => {
    if (!isOpen) {
      if (sessionRef.current) {
        sessionRef.current.hangup();
        sessionRef.current = null;
      }
      return;
    }

    setCallStatus('connecting');
    setElapsedSeconds(0);
    setTranscripts([]);
    setQuoteCreated(null);

    const session = new LiveKitCallSession({
      onStatusChange: (status, error) => {
        setCallStatus(status);
        if (error) setErrorMessage(error);
      },
      onTranscriptLine: line => {
        setTranscripts(prev => [
          ...prev,
          {
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: line.t,
            speaker: line.speaker,
            text: line.text,
          },
        ]);

        // Auto extraction analysis
        const lower = line.text.toLowerCase();
        if (lower.includes('italiano') || lower.includes('itália')) {
          setExtractedEntities(e => ({ ...e, targetLang: 'Italiano', docType: 'Certidão de Nascimento / Casamento' }));
        } else if (lower.includes('inglês') || lower.includes('estados unidos')) {
          setExtractedEntities(e => ({ ...e, targetLang: 'Inglês' }));
        } else if (lower.includes('espanhol') || lower.includes('espanha')) {
          setExtractedEntities(e => ({ ...e, targetLang: 'Espanhol' }));
        }

        if (lower.match(/(\d+)\s*(página|paginas|folha|lauda)/)) {
          const match = lower.match(/(\d+)\s*(página|paginas|folha|lauda)/);
          if (match && match[1]) {
            const count = parseInt(match[1], 10);
            if (count > 0 && count < 200) {
              setExtractedEntities(e => ({
                ...e,
                laudas: count,
                estimatedValue: count * 95.0,
              }));
            }
          }
        }
      },
    });

    sessionRef.current = session;
    session.start(agent.id, { enableCamera: true }).then(() => {
      // Connect camera to local video element
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Webcam permission not granted:', err);
        });
    });

    // Initial greeting transcript
    const timerGreeting = setTimeout(() => {
      setTranscripts(prev => [
        {
          id: 'greeting_initial',
          timestamp: 1,
          speaker: 'assistant',
          text: agent.greeting || `Olá! Sou a ${agent.name} da TraduzTudo. Como posso te ajudar hoje?`,
        },
      ]);
    }, 1500);

    return () => {
      clearTimeout(timerGreeting);
      if (sessionRef.current) {
        sessionRef.current.hangup();
        sessionRef.current = null;
      }
    };
  }, [isOpen, agent.id, agent.greeting, agent.name]);

  // Elapsed timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'live') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    sessionRef.current?.setMicrophoneEnabled(next);
  };

  const toggleCamera = () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    sessionRef.current?.setCameraEnabled(next);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(t => (t.enabled = next));
    }
  };

  const handleEndCall = async () => {
    if (sessionRef.current) {
      const finalDuration = elapsedSeconds;
      const room = sessionRef.current.currentRoomName;
      const convId = sessionRef.current.currentConversationId;
      await sessionRef.current.hangup();

      const conv: AICallConversation = {
        id: convId || `conv_${Date.now()}`,
        room: room || 'kloel-web-session',
        agentId: agent.id,
        direction: 'web_video',
        status: 'completed',
        durationSeconds: finalDuration,
        startedAt: new Date(Date.now() - finalDuration * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        transcripts,
        extractedData: {
          clientName: extractedEntities.clientName,
          documentType: extractedEntities.docType,
          sourceLang: extractedEntities.sourceLang,
          targetLang: extractedEntities.targetLang,
          estimatedLaudas: extractedEntities.laudas,
          estimatedValue: extractedEntities.estimatedValue,
          summary: `Atendimento de vídeo interativo para tradução de ${extractedEntities.docType} (${extractedEntities.sourceLang} -> ${extractedEntities.targetLang}).`,
        },
        createdQuoteId: quoteCreated || undefined,
      };

      if (onCallEnded) {
        onCallEnded(conv);
      }
    }
    onClose();
  };

  const handleCreateQuoteInDb = () => {
    try {
      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const issueDate = new Date().toISOString().split('T')[0];
      const newQuote = databaseStore.createQuote({
        tenantId: 'tenant-traduztudo',
        customerId: 'cust-reuniao-ia',
        customerName: extractedEntities.clientName || 'Cliente em Atendimento (IA)',
        customerEmail: 'cliente@atendimento.com.br',
        customerPhone: '(11) 99999-9999',
        assignedUserId: 'user-ygor',
        assignedUserName: 'Ygor TraduzTudo',
        sourceLanguage: extractedEntities.sourceLang,
        targetLanguage: extractedEntities.targetLang,
        issueDate,
        expirationDate,
        estimatedDeliveryDays: 3,
        items: [
          {
            id: `item-${Date.now()}`,
            serviceId: 'srv-juramentada',
            serviceName: `Tradução Juramentada - ${extractedEntities.docType}`,
            description: `${extractedEntities.docType} (${extractedEntities.sourceLang} para ${extractedEntities.targetLang})`,
            sourceLanguage: extractedEntities.sourceLang,
            targetLanguage: extractedEntities.targetLang,
            quantity: extractedEntities.laudas,
            unit: 'lauda',
            unitPrice: 95.0,
            discount: 0,
            total: extractedEntities.estimatedValue,
          },
        ],
        subtotal: extractedEntities.estimatedValue,
        discount: 0,
        additionalCost: 0,
        total: extractedEntities.estimatedValue,
        conditions: 'Validade de 7 dias corridos. Pagamento via Pix, cartão de crédito ou faturamento em 30 dias para parceiros B2B.',
        notes: `Criado automaticamente durante reunião com a agente de IA (${agent.name}).`,
        status: 'rascunho',
      });

      setQuoteCreated(newQuote.code || newQuote.id);
      setTranscripts(prev => [
        ...prev,
        {
          id: `line_quote_${Date.now()}`,
          timestamp: elapsedSeconds,
          speaker: 'assistant',
          text: `Perfeito! Já registrei o orçamento oficial nº ${newQuote.id} no valor de R$ ${extractedEntities.estimatedValue.toFixed(2)} com 7 dias de validade.`,
        },
      ]);
    } catch (err) {
      console.error('Error creating quote:', err);
    }
  };

  if (!isOpen) return null;

  const voice = getVoiceById(agent.voiceId);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl h-[85vh] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-lg">
              <Bot className="w-4 h-4" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{agent.name}</span>
                <Badge variant="outline" className="border-indigo-500/50 text-indigo-400 text-[10px] py-0">
                  LiveKit WebRTC · Latência ~180ms
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400">
                Voz: {voice.name} ({voice.accent}) · TraduzTudo AI Video Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {callStatus === 'live' ? timeFormatted : 'Conectando...'}
            </div>
            <button
              onClick={handleEndCall}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <PhoneOff className="w-5 h-5 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Video & Interaction Split Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-black">
          {/* Main Stage (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-4 bg-zinc-950 relative border-r border-zinc-800/80">
            {/* AI Avatar / Face Representation */}
            <div className="flex-1 flex flex-col items-center justify-center relative rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 overflow-hidden">
              <div className="relative flex items-center justify-center">
                {/* Visualizer rings */}
                <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-indigo-500/20 animate-pulse" />

                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-indigo-400/40 relative z-10">
                  <Bot className="w-14 h-14 text-white" />
                </div>
              </div>

              <div className="mt-5 text-center z-10">
                <h4 className="font-bold text-base text-white">{agent.name}</h4>
                <p className="text-xs text-indigo-400 flex items-center justify-center gap-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  {callStatus === 'live' ? 'Ouvindo e falando em tempo real' : 'Estabelecendo canais de áudio...'}
                </p>
              </div>

              {/* Local Caller Video PiP in Corner */}
              <div className="absolute bottom-4 right-4 w-36 h-28 rounded-xl bg-zinc-900 border-2 border-zinc-700 shadow-2xl overflow-hidden">
                {isCameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs gap-1">
                    <VideoOff className="w-5 h-5" />
                    <span>Câmera desligada</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-zinc-300">
                  Você (Cliente)
                </div>
              </div>
            </div>

            {/* Bottom In-Call Controls */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-full transition-all shadow-lg ${
                  isMicOn
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
                title={isMicOn ? 'Silenciar microfone' : 'Ativar microfone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-3.5 rounded-full transition-all shadow-lg ${
                  isCameraOn
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
                title={isCameraOn ? 'Desativar câmera' : 'Ativar câmera'}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={handleEndCall}
                className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                Encerrar Reunião
              </button>
            </div>
          </div>

          {/* Real-time Side Sheet: Transcripts & Live CRM Data (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-900 border-l border-zinc-800 p-4 overflow-hidden">
            {/* Live Transcript Stream */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Transcrição ao Vivo (DataChannel)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Stream: lk.transcription</span>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
                {transcripts.map(t => (
                  <div
                    key={t.id}
                    className={`flex flex-col ${t.speaker === 'caller' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                      {t.speaker === 'caller' ? (
                        <>
                          <span>Você</span>
                          <User className="w-2.5 h-2.5" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-2.5 h-2.5 text-indigo-400" />
                          <span className="text-indigo-400">{agent.name}</span>
                        </>
                      )}
                    </div>
                    <div
                      className={`max-w-[88%] p-2.5 rounded-xl leading-relaxed ${
                        t.speaker === 'caller'
                          ? 'bg-zinc-800 text-zinc-100 rounded-tr-none'
                          : 'bg-indigo-950/70 border border-indigo-800/40 text-indigo-100 rounded-tl-none'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* Live Extraction & CRM Quote Card */}
            <div className="mt-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Dados Extraídos em Tempo Real
                </span>
                {quoteCreated && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-400 text-[10px]">
                    Orçamento Salvo: {quoteCreated}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Documento</span>
                  <span className="font-semibold text-zinc-200 truncate block">{extractedEntities.docType}</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Par de Idiomas</span>
                  <span className="font-semibold text-zinc-200 truncate block">
                    {extractedEntities.sourceLang} → {extractedEntities.targetLang}
                  </span>
                </div>
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Volume Estimado</span>
                  <span className="font-semibold text-zinc-200 block">{extractedEntities.laudas} laudas</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Valor Estimado</span>
                  <span className="font-bold text-emerald-400 block">
                    R$ {extractedEntities.estimatedValue.toFixed(2)}
                  </span>
                </div>
              </div>

              {!quoteCreated ? (
                <Button
                  size="sm"
                  className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5"
                  onClick={handleCreateQuoteInDb}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gerar Orçamento Oficial no CRM Agora
                </Button>
              ) : (
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Orçamento salvo com sucesso no banco de dados!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
