'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LiveKitCallSession } from '@/lib/ai-voice/livekitCallClient';
import { TranscriptLine } from '@/types/ai-voice';
import { getStoredAgentConfig } from '@/lib/ai-voice/agentService';
import { getVoiceById } from '@/lib/ai-voice/voices';

export default function ClientMeetingPublicPage() {
  const params = useParams();
  const agentId = (params?.agentId as string) || 'agt-traduztudo-principal';
  const agent = getStoredAgentConfig();
  const voice = getVoiceById(agent.voiceId);

  const [hasStarted, setHasStarted] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'live' | 'ended' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [clientName, setClientName] = useState('');

  const sessionRef = useRef<LiveKitCallSession | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const handleStartMeeting = () => {
    setHasStarted(true);
    setCallStatus('connecting');

    const session = new LiveKitCallSession({
      onStatusChange: (status, err) => {
        setCallStatus(status);
        if (err) setErrorMessage(err);
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
      },
    });

    sessionRef.current = session;
    session.start(agentId, { enableCamera: true }).then(() => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Permissão de vídeo não concedida:', err);
        });
    });

    // Initial greeting transcript
    setTimeout(() => {
      setTranscripts([
        {
          id: 'welcome',
          timestamp: 1,
          speaker: 'assistant',
          text: agent.greeting || `Olá! Sou a ${agent.name} da TraduzTudo. Como posso te ajudar hoje?`,
        },
      ]);
    }, 1200);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'live') {
      interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

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

  const handleEndCall = () => {
    if (sessionRef.current) {
      sessionRef.current.hangup();
      sessionRef.current = null;
    }
    setCallStatus('ended');
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      {!hasStarted ? (
        /* Pre-Meeting Lobby */
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-xl border-2 border-indigo-400/30">
            <Bot className="w-10 h-10 text-white" />
          </div>

          <div>
            <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 mb-2">
              Atendimento Inteligente TraduzTudo
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">Reunião de Vídeo com IA</h1>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Você está prestes a falar com <strong>{agent.name}</strong>, nossa especialista em tradução juramentada e orçamentos em tempo real.
            </p>
          </div>

          <div className="text-left space-y-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-300">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente Seguro & Sem Download</span>
            </div>
            <p className="text-zinc-400">
              A conversa ocorre direto no seu navegador com baixa latência WebRTC. Prepare seu microfone e câmera.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Seu nome (opcional)"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm outline-none focus:border-indigo-500 transition-colors"
            />

            <Button
              size="lg"
              onClick={handleStartMeeting}
              className="w-full py-6 font-bold text-base bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              Entrar na Reunião Agora
            </Button>
          </div>
        </div>
      ) : callStatus === 'ended' ? (
        /* Post Meeting Thank You */
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Reunião Encerrada</h2>
          <p className="text-xs text-zinc-400">
            Obrigado pelo seu tempo! Os dados e especificações foram registrados em nosso sistema. Nossa equipe comercial dará sequência imediata.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = 'https://traduztudo.com'}
            className="w-full border-zinc-700 text-zinc-200"
          >
            Voltar para o site TraduzTudo.com
          </Button>
        </div>
      ) : (
        /* In Meeting Stage */
        <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block">{agent.name}</span>
                <span className="text-[10px] text-zinc-400">TraduzTudo · Consultoria em Tempo Real</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {timeFormatted}
              </span>
              <button
                onClick={handleEndCall}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-zinc-800"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Meeting body */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Visual AI Stage */}
            <div className="md:col-span-7 flex flex-col justify-between p-4 bg-zinc-950 relative border-r border-zinc-800">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 animate-ping" />
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-indigo-400/40 relative z-10">
                    <Bot className="w-16 h-16 text-white" />
                  </div>
                </div>
                <h4 className="mt-4 font-bold text-base text-zinc-200">{agent.name}</h4>
                <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Conectada por voz e vídeo em tempo real
                </p>
              </div>

              {/* Local Video Pip */}
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
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                    <VideoOff className="w-5 h-5" />
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-zinc-300">
                  {clientName || 'Você'}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition-all ${
                    isMicOn ? 'bg-zinc-800 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition-all ${
                    isCameraOn ? 'bg-zinc-800 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleEndCall}
                  className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <PhoneOff className="w-4 h-4" />
                  Sair da Reunião
                </button>
              </div>
            </div>

            {/* Transcript stream */}
            <div className="md:col-span-5 flex flex-col p-4 bg-zinc-900 overflow-hidden">
              <div className="pb-3 border-b border-zinc-800 text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Legendas & Transcrição ao Vivo
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
                {transcripts.map(t => (
                  <div
                    key={t.id}
                    className={`flex flex-col ${t.speaker === 'caller' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-zinc-500 mb-0.5">
                      {t.speaker === 'caller' ? clientName || 'Você' : agent.name}
                    </span>
                    <div
                      className={`max-w-[90%] p-2.5 rounded-xl ${
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
          </div>
        </div>
      )}
    </div>
  );
}
