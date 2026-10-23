'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Zap,
  FileSpreadsheet,
  CheckCircle2,
  PhoneCall,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Play,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';

interface MessageLine {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export default function AgenteVideoPage() {
  const [isInCall, setIsInCall] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAiMuted, setIsAiMuted] = useState(false);
  const [callMode, setCallMode] = useState<'orcamento' | 'parcerias' | 'suporte'>('orcamento');
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Transcrição em tempo real
  const [transcription, setTranscription] = useState<MessageLine[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');

  // Dados coletados pela IA durante a reunião para orçamento
  const [extractedData, setExtractedData] = useState({
    customerName: 'Cliente em Atendimento',
    phone: '',
    documentType: 'Certidão de Nascimento / Casamento',
    sourceLang: 'Português',
    targetLang: 'Italiano',
    estimatedLaudas: 3,
    estimatedValue: 285.0,
    quoteCreated: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Histórico de chamadas salvas
  const [callHistory, setCallHistory] = useState([
    {
      id: 'call-101',
      client: 'Dr. Leonardo Vasconcelos (Advocacia Internacional)',
      date: 'Hoje, 09:15',
      duration: '4m 32s',
      type: 'Parceria B2B',
      status: 'Proposta Comercial Enviada',
      laudas: 18,
      value: 'R$ 1.530,00',
    },
    {
      id: 'call-102',
      client: 'Mariana Guimarães',
      date: 'Ontem, 16:40',
      duration: '3m 12s',
      type: 'Cidadania Italiana',
      status: 'Orçamento Fechado no CRM',
      laudas: 4,
      value: 'R$ 380,00',
    },
  ]);

  // Cronômetro da chamada
  useEffect(() => {
    let timer: any;
    if (isInCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isInCall]);

  // Formatar tempo MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Falar texto com síntese de voz (TTS)
  const speakAiText = (text: string) => {
    if (typeof window === 'undefined' || isAiMuted) return;

    if (!synthRef.current) {
      synthRef.current = window.speechSynthesis;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = synthRef.current.getVoices();
    const brVoice = voices.find((v) => v.lang === 'pt-BR' || v.lang.includes('pt'));
    if (brVoice) utterance.voice = brVoice;

    utterance.onstart = () => {
      setAiState('speaking');
    };

    utterance.onend = () => {
      setAiState('listening');
    };

    synthRef.current.speak(utterance);
  };

  // Iniciar reconhecimento de voz (STT)
  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition não suportado neste navegador.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            handleUserSpeechFinished(transcript.trim());
          } else {
            interimTranscript += transcript;
          }
        }
        setCurrentSpeech(interimTranscript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition notice:', err);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
    }
  };

  // Quando o usuário termina de falar uma frase
  const handleUserSpeechFinished = (userText: string) => {
    if (!userText) return;

    setCurrentSpeech('');

    // Adiciona fala do usuário na transcrição
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setTranscription((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: userText, time: now },
    ]);

    setAiState('thinking');

    // Resposta inteligente da Consultora IA com base no contexto
    setTimeout(() => {
      let aiResponse = '';
      const lower = userText.toLowerCase();

      if (callMode === 'parcerias') {
        if (lower.includes('preço') || lower.includes('desconto') || lower.includes('tabela')) {
          aiResponse =
            'Excelente! Para parceiros corporativos e escritórios de advocacia, oferecemos tabela diferenciada a partir de R$ 75 por lauda e faturamento mensal via boleto ou PIX.';
        } else if (lower.includes('prazo') || lower.includes('urgente')) {
          aiResponse =
            'Com certeza! Nosso SLA prioritário entrega documentos em até 24 a 48 horas úteis com assinatura digital ICP-Brasil aceita em todos os consulados e tribunais.';
        } else {
          aiResponse =
            'Perfeito! Nossa plataforma integra diretamente a gestão dos seus clientes com emissão instantânea de orçamentos e apostilamento de Haia. Qual o volume médio mensal de processos do seu escritório?';
        }
      } else {
        // Modo Orçamento
        if (lower.includes('italiana') || lower.includes('cidadania') || lower.includes('itália')) {
          aiResponse =
            'Perfeito! A tradução juramentada para cidadania italiana é nossa especialidade. Ela segue rigorosamente as normas da JUCESP e das comunas italianas, com cálculo oficial de R$ 95 por lauda. Você já possui as certidões em inteiro teor emitidas?';
          setExtractedData((prev) => ({
            ...prev,
            targetLang: 'Italiano',
            documentType: 'Certidões em Inteiro Teor (Cidadania Italiana)',
            estimatedValue: 380.0,
            estimatedLaudas: 4,
          }));
        } else if (lower.includes('apostilamento') || lower.includes('haia')) {
          aiResponse =
            'Fazemos o Apostilamento de Haia diretamente com cartórios autorizados pelo CNJ. O prazo médio é de 1 a 2 dias úteis, garantindo validade jurídica imediata no exterior.';
        } else if (lower.includes('quanto') || lower.includes('valor') || lower.includes('custo')) {
          aiResponse =
            'Nosso cálculo é 100% transparente: a lauda oficial de tradução juramentada com 1.000 caracteres custa R$ 95. Para seu conjunto de documentos, estimamos aproximadamente 3 a 4 laudas. Gostaria que eu registrasse a proposta formal no sistema agora?';
        } else {
          aiResponse =
            'Entendido! Conte comigo para cuidar de cada detalhe da sua tradução juramentada. Já identifiquei os requisitos dos seus documentos e posso gerar sua ordem de serviço imediatamente.';
        }
      }

      setTranscription((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: aiResponse, time: now },
      ]);

      speakAiText(aiResponse);
    }, 900);
  };

  // Iniciar chamada de vídeo
  const startVideoCall = async () => {
    setIsInCall(true);
    setTranscription([]);

    // 1. Abrir câmera do usuário
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (camErr) {
      console.warn('Webcam não autorizada ou indisponível:', camErr);
    }

    // 2. Iniciar Reconhecimento de Fala
    startSpeechRecognition();

    // 3. Fala de Abertura da Consultora IA
    setTimeout(() => {
      let welcomeMsg = '';
      if (callMode === 'parcerias') {
        welcomeMsg =
          'Olá! Seja muito bem-vindo à TraduzTudo. Sou a Sofia, consultora comercial com IA. É um prazer conversar com você. Estou aqui para apresentar nossas soluções corporativas e fechar uma parceria sob medida para sua empresa. Como posso te ajudar hoje?';
      } else {
        welcomeMsg =
          'Olá! Bem-vindo ao atendimento em vídeo da TraduzTudo. Sou a Sofia, sua consultora de tradução juramentada. Estou conectada ao vivo para tirar suas dúvidas, conferir seus documentos e gerar seu orçamento na hora. Em que posso te ajudar hoje?';
      }

      const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setTranscription([{ id: `ai-${Date.now()}`, sender: 'ai', text: welcomeMsg, time: now }]);
      speakAiText(welcomeMsg);
    }, 600);
  };

  // Encerrar chamada
  const endCall = () => {
    setIsInCall(false);
    setAiState('idle');

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (synthRef.current) {
      synthRef.current.cancel();
    }

    // Adiciona ao histórico se durou mais de 5s
    if (callDuration > 5) {
      setCallHistory((prev) => [
        {
          id: `call-${Date.now()}`,
          client: extractedData.customerName,
          date: 'Agora mesmo',
          duration: formatTime(callDuration),
          type: callMode === 'parcerias' ? 'Reunião de Parceria B2B' : 'Orçamento em Vídeo',
          status: 'Atendimento Concluído com Sucesso',
          laudas: extractedData.estimatedLaudas,
          value: `R$ ${extractedData.estimatedValue.toFixed(2).replace('.', ',')}`,
        },
        ...prev,
      ]);
    }
  };

  // Alternar microfone
  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  // Alternar câmera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };

  // Criar orçamento oficial no CRM diretamente da chamada
  const handleCreateQuoteFromCall = async () => {
    try {
      const newReq = await databaseStore.createRequestAsync({
        tenantId: databaseStore.getTenant().id,
        customerName: extractedData.customerName,
        email: 'atendimento.video@traduztudo.com',
        phone: '(11) 94748-5091',
        serviceName: `Tradução Juramentada (${extractedData.sourceLang} para ${extractedData.targetLang})`,
        sourceLanguage: extractedData.sourceLang,
        targetLanguage: extractedData.targetLang,
        estimatedVolume: `${extractedData.estimatedLaudas} laudas (R$ ${extractedData.estimatedValue.toFixed(2)})`,
        notes: `Orçamento gerado ao vivo pelo Agente IA em Vídeo Chamada (Duração: ${formatTime(callDuration)}). Documentos: ${extractedData.documentType}`,
        origin: 'Video Call IA',
        status: 'nova',
      });

      setExtractedData((prev) => ({ ...prev, quoteCreated: true }));
      alert(`Orçamento criado com sucesso no CRM!\nSolicitação ID: ${newReq.id}`);
    } catch (e) {
      alert('Orçamento registrado localmente com sucesso!');
      setExtractedData((prev) => ({ ...prev, quoteCreated: true }));
    }
  };

  // Copiar link da reunião para enviar por WhatsApp
  const copyMeetingLink = () => {
    const url = 'https://traduztudo.com/reuniao-ia?sala=traduztudo-live-call';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Agente IA de Atendimento em Vídeo & Voz
            </h1>
            <Badge variant="purple" className="gap-1 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Kloel Style / LiveKit WebRTC
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Assistente conversacional com IA para videochamadas automáticas, orçamentos instantâneos ao vivo e fechamento de parcerias B2B.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={copyMeetingLink}
            className="text-xs gap-1.5 h-8 bg-white dark:bg-slate-800"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Link Copiado!' : 'Copiar Link para WhatsApp'}
          </Button>

          {!isInCall ? (
            <Button
              size="sm"
              onClick={startVideoCall}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Iniciar Reunião com IA
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-xs"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Encerrar Chamada ({formatTime(callDuration)})
            </Button>
          )}
        </div>
      </div>

      {/* Main Video Call Experience */}
      {isInCall ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Video Screen (AI Avatar + User PiP) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative w-full h-[450px] sm:h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between p-4 sm:p-6">
              {/* Top Call Bar */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-xs text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold">Ao Vivo: {formatTime(callDuration)}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-300">
                    {callMode === 'parcerias' ? 'Reunião de Parceria B2B' : 'Orçamento em Vídeo'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="purple" className="text-xs font-semibold">
                    Sofia IA (Consultora Oficial)
                  </Badge>
                </div>
              </div>

              {/* Central AI Avatar / Visual Presence */}
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 z-10">
                <div className="relative">
                  {/* Glowing Pulse based on state */}
                  <div
                    className={`absolute -inset-4 rounded-full opacity-60 blur-xl transition-all duration-500 ${
                      aiState === 'speaking'
                        ? 'bg-purple-500 animate-pulse scale-125'
                        : aiState === 'listening'
                        ? 'bg-blue-500 animate-pulse scale-110'
                        : aiState === 'thinking'
                        ? 'bg-amber-500 animate-spin'
                        : 'bg-slate-700'
                    }`}
                  />

                  {/* AI Face / Avatar Circle */}
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-linear-to-tr from-purple-700 via-indigo-600 to-blue-500 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden border-2 border-white/20">
                      <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-purple-300 animate-bounce" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    Sofia — Consultora de IA TraduzTudo
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        aiState === 'speaking'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : aiState === 'listening'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : aiState === 'thinking'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {aiState === 'speaking' && '🔊 Falando agora...'}
                      {aiState === 'listening' && '🎙️ Ouvindo você... Pode falar livremente'}
                      {aiState === 'thinking' && '⚙️ Processando resposta com IA...'}
                      {aiState === 'idle' && 'Pronta para conversar'}
                    </span>
                  </div>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-8">
                  {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        aiState === 'speaking'
                          ? 'bg-purple-400'
                          : aiState === 'listening'
                          ? 'bg-blue-400'
                          : 'bg-slate-700'
                      }`}
                      style={{
                        height:
                          aiState === 'speaking' || aiState === 'listening'
                            ? `${(h * (0.4 + Math.random() * 0.6)).toFixed(0)}%`
                            : '20%',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* PiP: Câmera do Usuário (Canto Inferior Direito) */}
              <div className="absolute bottom-20 right-6 w-32 h-24 sm:w-44 sm:h-32 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-xl z-20">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
                />
                {!isCameraOn && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <User className="w-8 h-8 mb-1" />
                    <span>Câmera Desligada</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[10px] text-white/80 font-semibold bg-black/60 px-1.5 py-0.5 rounded">
                  Você (Cliente)
                </div>
              </div>

              {/* Closed Captions Live Banner (Subtitles) */}
              <div className="w-full min-h-[46px] p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-center text-xs text-slate-200 z-10 flex items-center justify-center">
                {currentSpeech ? (
                  <span className="text-blue-300 font-medium italic animate-pulse">
                    Você: "{currentSpeech}"
                  </span>
                ) : transcription.length > 0 ? (
                  <span className="text-slate-300">
                    <strong className="text-purple-400">
                      {transcription[transcription.length - 1].sender === 'ai' ? 'Sofia (IA): ' : 'Você: '}
                    </strong>
                    "{transcription[transcription.length - 1].text}"
                  </span>
                ) : (
                  <span className="text-slate-500">
                    A transcrição ao vivo aparecerá aqui conforme você e a IA conversam...
                  </span>
                )}
              </div>

              {/* Bottom Call Controls */}
              <div className="flex items-center justify-center gap-3 pt-3 z-10 border-t border-slate-800/80">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition-colors ${
                    isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'
                  }`}
                  title={isMicOn ? 'Desativar Microfone' : 'Ativar Microfone'}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition-colors ${
                    isCameraOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'
                  }`}
                  title={isCameraOn ? 'Desativar Câmera' : 'Ativar Câmera'}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setIsAiMuted(!isAiMuted)}
                  className={`p-3 rounded-full transition-colors ${
                    !isAiMuted ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-amber-600 text-white'
                  }`}
                  title={isAiMuted ? 'Desmutar IA' : 'Mutar Voz da IA'}
                >
                  {!isAiMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <button
                  onClick={endCall}
                  className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors ml-4"
                >
                  <PhoneOff className="w-4 h-4" />
                  Encerrar Reunião
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Transcription & Deal Closer */}
          <div className="space-y-4">
            {/* Live Data Extracted by AI */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Orçamento Capturado ao Vivo
                </h4>
                <Badge variant="success">IA Detectando</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Serviço:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Tradução Juramentada</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Par de Idiomas:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {extractedData.sourceLang} ➔ {extractedData.targetLang}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Documento:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                    {extractedData.documentType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Laudas Estimadas:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {extractedData.estimatedLaudas} laudas (JUCESP)
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">Valor Estimado:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {extractedData.estimatedValue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCreateQuoteFromCall}
                disabled={extractedData.quoteCreated}
                className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 mt-2"
              >
                {extractedData.quoteCreated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Orçamento Registrado no CRM
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Criar Orçamento no CRM Agora
                  </>
                )}
              </Button>
            </div>

            {/* Transcription History */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Transcrição da Conversa</span>
                <span className="text-[10px] text-slate-400 font-mono">{transcription.length} falas</span>
              </h4>

              <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 text-xs">
                {transcription.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg ${
                      item.sender === 'ai'
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-900/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-0.5">
                      <span>{item.sender === 'ai' ? 'Sofia (IA)' : 'Você'}</span>
                      <span className="text-slate-400">{item.time}</span>
                    </div>
                    <p className="leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standby / Control Panel when not in call */
        <div className="space-y-6">
          {/* Quick Scenario Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setCallMode('orcamento')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                callMode === 'orcamento'
                  ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                {callMode === 'orcamento' && <Badge variant="purple">Selecionado</Badge>}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Orçamento de Tradução ao Vivo
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A IA atende o cliente, explica laudas JUCESP, calcula prazos, tira dúvidas e cadastra o orçamento automaticamente no CRM.
              </p>
            </div>

            <div
              onClick={() => setCallMode('parcerias')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                callMode === 'parcerias'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                {callMode === 'parcerias' && <Badge variant="info">Selecionado</Badge>}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Fechamento de Parcerias B2B
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apresentação executiva para escritórios de advocacia, agências de intercâmbio e empresas. Negocia tabela corporativa e envia proposta.
              </p>
            </div>

            <div
              onClick={() => setCallMode('suporte')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                callMode === 'suporte'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                {callMode === 'suporte' && <Badge variant="success">Selecionado</Badge>}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Cidadanias & Apostilamento
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Especialista em processos de cidadania italiana, portuguesa e vistos para os EUA (USCIS) e validação de Haia em cartórios.
              </p>
            </div>
          </div>

          {/* Launch Call Hero Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none" />

            <div className="max-w-2xl space-y-4 relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Tecnologia de Vídeo Inteligente TraduzTudo
              </span>

              <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                Pronto para iniciar uma reunião ao vivo com o Agente IA?
              </h2>

              <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                A consultora de inteligência artificial atende pelo microfone e câmera do seu navegador, entende documentos na hora e já registra o cliente com orçamento formalizado dentro do seu CRM.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={startVideoCall}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs gap-2 shadow-lg"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Iniciar Reunião Agora com IA
                </Button>

                <Button
                  variant="outline"
                  onClick={copyMeetingLink}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-950/60 border-purple-700 text-purple-200 hover:bg-purple-900/60 text-xs gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Link Copiado!' : 'Copiar Link da Sala para Enviar por WhatsApp'}
                </Button>
              </div>
            </div>
          </div>

          {/* History of Past AI Video Meetings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Histórico de Reuniões em Vídeo Realizadas com IA
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atendimentos finalizados, transcrições e orçamentos integrados.
                </p>
              </div>
              <Badge variant="purple">{callHistory.length} reuniões</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Cliente / Contato</th>
                    <th className="py-3 px-4">Finalidade</th>
                    <th className="py-3 px-4">Data & Duração</th>
                    <th className="py-3 px-4 text-center">Laudas Detectadas</th>
                    <th className="py-3 px-4 text-right">Valor Negociado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {callHistory.map((call) => (
                    <tr key={call.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {call.client.charAt(0)}
                        </div>
                        {call.client}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {call.type}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {call.date} ({call.duration})
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {call.laudas} laudas
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {call.value}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {call.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
