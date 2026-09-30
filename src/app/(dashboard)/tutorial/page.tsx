'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileText,
  UploadCloud,
  Cpu,
  Layers,
  ShieldCheck,
  Award,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Check,
  Star,
  Clock,
  Send,
  UserCheck,
  Building,
  QrCode,
  ExternalLink,
  MessageSquare,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  Globe,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Web Audio API Sound Synthesizer for Immersive Feedback
class AudioEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playScan() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playStamp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
    });
  }

  playStep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
}

const sfx = new AudioEffects();

// Steps definition focusing on the LEAD journey
const LEAD_STAGES = [
  {
    id: 1,
    title: 'Sua Necessidade & Envio do Documento',
    shortTitle: '1. Envio & Scanner',
    subtitle: 'O Lead escolhe o documento e nosso scanner IA quantifica em laudas oficiais',
    guideTip:
      'Olá! Eu sou a Sofia, sua concierge na TraduzTudo. Para começar, selecione qual documento você precisa traduzir e veja nosso scanner inteligente calcular a quantidade exata de laudas oficiais em tempo real!',
    badge: 'Passo 1 de 6',
  },
  {
    id: 2,
    title: 'Seu Pedido Entra no Centro de Comando',
    shortTitle: '2. Triagem no CRM',
    subtitle: 'Veja o que acontece nos bastidores em segundos após o envio',
    guideTip:
      'Fantástico! No momento em que você clica em enviar, seu documento não fica perdido em uma caixa de e-mails. Ele entra instantaneamente no CRM da nossa equipe com prioridade e triagem técnica imediata!',
    badge: 'Passo 2 de 6',
  },
  {
    id: 3,
    title: 'Orçamento Inteligente sob Medida',
    shortTitle: '3. Orçamento ao Vivo',
    subtitle: 'Preço transparente por lauda com cálculo de urgência e prazos flexíveis',
    guideTip:
      'Sem surpresas ou letras miúdas! Aqui você personaliza o tipo de tradução (Juramentada ou Certificada), seleciona o prazo (Normal ou Urgência 24h) e vê o valor final detalhado na hora.',
    badge: 'Passo 3 de 6',
  },
  {
    id: 4,
    title: 'Aprovação Digital & Assinatura Sem Fricção',
    shortTitle: '4. Assinatura Digital',
    subtitle: 'Assine digitalmente na tela e aprove a proposta sem precisar imprimir nada',
    guideTip:
      'Você recebeu seu link seguro! Experimente desenhar sua assinatura digital na tela ou clicar em aprovação rápida. Ao aprovar, nossa Ordem de Serviço de tradução é aberta no mesmo segundo!',
    badge: 'Passo 4 de 6',
  },
  {
    id: 5,
    title: 'Acompanhamento da Produção em Tempo Real',
    shortTitle: '5. Raio-X da OS',
    subtitle: 'Tradutor Juramentado oficial alocado, revisão paritária e carimbo digital',
    guideTip:
      'Transparência absoluta: acompanhe seu documento passando pelo Tradutor Juramentado matriculado na Junta Comercial, revisão ortográfica, diagramação fiel e aposição de Fé Pública!',
    badge: 'Passo 5 de 6',
  },
  {
    id: 6,
    title: 'Download Oficial no Portal do Cliente',
    shortTitle: '6. Entrega & Download',
    subtitle: 'Seu documento pronto, assinado com ICP-Brasil e aceito em embaixadas',
    guideTip:
      'Prontinho! Sua tradução oficial juramentada está finalizada com selo notarial, QR Code de validação internacional e já está disponível para download imediato no seu portal exclusivo!',
    badge: 'Passo 6 de 6',
  },
];

export default function LeadImmersiveTutorialPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);

  // Step 1: Document selection and simulated scanning
  const [docType, setDocType] = useState<'diploma' | 'certidao' | 'contrato'>('diploma');
  const [langPair, setLangPair] = useState('PT-EN');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Step 2: CRM View interaction
  const [crmLeadInteracted, setCrmLeadInteracted] = useState(false);

  // Step 3: Quote customization
  const [serviceType, setServiceType] = useState<'juramentada' | 'certificada'>('juramentada');
  const [urgency, setUrgency] = useState<'normal' | 'express'>('normal');
  const [apostille, setApostille] = useState(false);

  // Step 4: Digital signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Step 5: Production progress
  const [prodStage, setProdStage] = useState(1); // 1: Traducao, 2: Revisao, 3: Diagramacao, 4: Assinatura ICP

  // Step 6: Document download simulation
  const [docDownloaded, setDocDownloaded] = useState(false);

  // Toggle Sound
  const toggleSound = () => {
    sfx.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  // Step Navigation
  const goToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= 6) {
      setCurrentStep(stepNumber);
      sfx.playStep();
    }
  };

  // Autoplay loop timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAuto) {
      timer = setTimeout(() => {
        if (currentStep < 6) {
          setCurrentStep((prev) => prev + 1);
          sfx.playStep();
        } else {
          setIsPlayingAuto(false);
        }
      }, 9000);
    }
    return () => clearTimeout(timer);
  }, [isPlayingAuto, currentStep]);

  // Scan simulation trigger
  const runScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    sfx.playScan();
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      sfx.playSuccess();
    }, 1800);
  };

  // Signature canvas setup
  useEffect(() => {
    if (currentStep === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [currentStep]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const approveProposal = () => {
    setIsApproved(true);
    sfx.playStamp();
    setTimeout(() => {
      sfx.playSuccess();
    }, 300);
  };

  // Pricing calculations
  const laudasMap = { diploma: 3, certidao: 2, contrato: 6 };
  const basePricePerLauda = serviceType === 'juramentada' ? 68 : 45;
  const laudas = laudasMap[docType];
  const subtotal = laudas * basePricePerLauda;
  const urgencyMultiplier = urgency === 'express' ? 1.4 : 1.0;
  const apostilleFee = apostille ? 180 : 0;
  const totalPrice = Math.round(subtotal * urgencyMultiplier + apostilleFee);

  // Advance production in step 5
  const advanceProd = (stageNumber: number) => {
    setProdStage(stageNumber);
    if (stageNumber === 4) {
      sfx.playStamp();
    } else {
      sfx.playStep();
    }
  };

  const currentStageInfo = LEAD_STAGES[currentStep - 1];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header with Progress and Controls */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            TT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                TraduzTudo OS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Simulador Imersivo do Lead
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Experimente a jornada de tradução do seu cliente do início ao fim
            </p>
          </div>
        </div>

        {/* Action controls: Sound, AutoPlay, Back to SaaS */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-blue-950/60 border-blue-700/50 text-blue-300 hover:bg-blue-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title={soundEnabled ? 'Desativar Sons' : 'Ativar Sons Imersivos'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          <button
            onClick={() => setIsPlayingAuto(!isPlayingAuto)}
            className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-medium flex items-center gap-1.5 ${
              isPlayingAuto
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isPlayingAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlayingAuto ? 'Pausar Tour' : 'Modo Automático'}</span>
          </button>

          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
          >
            <span>Voltar ao ERP</span>
          </Link>
        </div>
      </header>

      {/* Stepper Bar (Horizontal Progress) */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {LEAD_STAGES.map((stage) => {
            const isDone = stage.id < currentStep;
            const isCurrent = stage.id === currentStep;

            return (
              <button
                key={stage.id}
                onClick={() => goToStep(stage.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                    : isDone
                    ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-blue-700'
                      : isDone
                      ? 'bg-emerald-500 text-emerald-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : stage.id}
                </div>
                <span>{stage.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Virtual Guide Assistant Balloon (Sofia) */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Sofia Avatar with animated pulse */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg ring-2 ring-blue-400/30 animate-pulse">
              👩‍💼
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" title="Online" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Sofia</span>
                <span className="text-xs text-blue-300 font-medium">· Concierge Oficial TraduzTudo</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {currentStageInfo.badge}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {currentStageInfo.guideTip}
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Stage Body */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header of Stage */}
          <div className="mb-6 pb-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>{currentStageInfo.title}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {currentStageInfo.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                Progresso: <b className="text-blue-400">{Math.round((currentStep / 6) * 100)}%</b>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ETAPA 1: O LEAD ENVIA O DOCUMENTO E O SCANNER IA ANALISA EM TEMPO REAL     */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Interactive choices */}
                <div className="lg:col-span-6 space-y-4">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    1. Escolha o documento para simular:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'diploma', label: 'Diploma & Histórico', icon: '🎓', laudas: 3 },
                      { id: 'certidao', label: 'Certidão Nascimento', icon: '📜', laudas: 2 },
                      { id: 'contrato', label: 'Contrato Social', icon: '🏢', laudas: 6 },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setDocType(item.id as 'diploma' | 'certidao' | 'contrato');
                          setScanComplete(false);
                          sfx.playStep();
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          docType === item.id
                            ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/40 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-2xl mb-2">{item.icon}</span>
                        <span className="text-xs font-semibold block leading-tight">{item.label}</span>
                        <span className="text-[10px] text-blue-400 mt-1">{item.laudas} laudas estimadas</span>
                      </button>
                    ))}
                  </div>

                  {/* Language pair selector */}
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block pt-2">
                    2. Escolha o Par de Idiomas:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'PT-EN', label: 'Português ➔ Inglês', country: '🇺🇸 🇬🇧' },
                      { id: 'PT-IT', label: 'Português ➔ Italiano', country: '🇮🇹' },
                      { id: 'PT-ES', label: 'Português ➔ Espanhol', country: '🇪🇸' },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setLangPair(lang.id);
                          sfx.playStep();
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          langPair === lang.id
                            ? 'bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs">{lang.country}</div>
                        <div className="text-[11px] font-medium mt-0.5">{lang.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Action trigger: Scanner button */}
                  <div className="pt-2">
                    <button
                      onClick={runScan}
                      disabled={isScanning}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <Cpu className="w-4 h-4 animate-spin text-cyan-300" />
                          <span>Escaneando caracteres & laudas oficiais...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                          <span>Escanear Documento com Laser Ótico</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Immersive Document Scanner Graphic */}
                <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between relative overflow-hidden">
                  <div className="text-xs font-semibold text-slate-400 flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                      Visualização do Documento Enviado
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800">
                      OCR ATIVO
                    </span>
                  </div>

                  {/* Simulated Paper Graphic with Laser */}
                  <div className="relative my-4 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 space-y-2 select-none overflow-hidden min-h-[180px]">
                    {/* Animated Scanning Laser Line */}
                    {isScanning && (
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce z-20" />
                    )}

                    <div className="flex items-center justify-between text-slate-500 text-[10px] border-b border-slate-800/80 pb-1">
                      <span>REPÚBLICA FEDERATIVA DO BRASIL</span>
                      <span>ORIGINAL AUTÊNTICO</span>
                    </div>

                    <p className="text-slate-300 font-semibold text-xs">
                      {docType === 'diploma' && 'DIPLOMA UNIVERSITÁRIO — ENGENHARIA DE SOFTWARE'}
                      {docType === 'certidao' && 'CERTIDÃO DE NASCIMENTO — REGISTRO CIVIL DAS PESSOAS NATURAIS'}
                      {docType === 'contrato' && 'CONTRATO SOCIAL E ESTATUTO DE CONSTITUIÇÃO EMPRESARIAL'}
                    </p>

                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                      Certifico que no livro de registros sob o termo número 42.891, folhas 102, consta o assentamento oficial emitido em conformidade com as normas consulares e fé pública atribuída por lei.
                    </p>

                    {/* Result overlay once scan is complete */}
                    {scanComplete && (
                      <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-xl p-3 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in zoom-in-95">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Análise Concluída com Sucesso!</div>
                          <div className="text-[11px] text-emerald-300">
                            Detectadas <b>{laudas} laudas oficiais</b> ({laudas * 1250} caracteres). Padrão JUCESP validado.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer CTA of Step 1 */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">
                      Pronto para ver onde seu pedido vai?
                    </span>
                    <Button
                      onClick={() => goToStep(2)}
                      className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      <span>Avançar para Etapa 2 (CRM)</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: O PEDIDO ENTRA NO CENTRO DE COMANDO (CRM BASTIDORES)             */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-blue-950/40 border border-blue-800/40 rounded-2xl p-4 text-xs space-y-2">
                    <span className="text-blue-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      O Que Acontece Agora?
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Assim que o lead envia seus dados no site público, nossa <b>API Inbound protegida</b> recebe o pacote em formato JSON criptografado e cria automaticamente o cartão no topo da esteira comercial.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Ações do Atendente Humano:
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-slate-300 font-medium">Tempo médio de primeiro contato:</span>
                      </div>
                      <span className="font-bold text-emerald-400">7 minutos</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-400" />
                        <span className="text-slate-300 font-medium">Atendente Designado:</span>
                      </div>
                      <span className="font-bold text-white">Mariana Santos (Comercial)</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setCrmLeadInteracted(true);
                        sfx.playSuccess();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Simular Atendente Clicando em &quot;Criar Orçamento&quot;</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Interactive Kanban Simulation */}
                <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Pipeline do CRM em Tempo Real
                    </span>
                    <span className="text-[10px] text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      Sincronização Ativa
                    </span>
                  </div>

                  {/* 3 Kanban Columns */}
                  <div className="grid grid-cols-3 gap-2.5 my-4">
                    {/* Column 1: Novos Leads */}
                    <div className="bg-slate-950/80 rounded-xl p-2.5 border border-blue-500/40">
                      <div className="text-[11px] font-bold text-blue-400 mb-2 flex items-center justify-between">
                        <span>Novo Lead</span>
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center">
                          1
                        </span>
                      </div>

                      {/* Lead Card with animation */}
                      <div className="bg-slate-900 border border-blue-400/60 rounded-lg p-2.5 shadow-md shadow-blue-500/10 animate-pulse space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white truncate">Você (Lead Ativo)</span>
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded">Agora</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {docType === 'diploma' && 'Diploma • 3 laudas'}
                          {docType === 'certidao' && 'Certidão • 2 laudas'}
                          {docType === 'contrato' && 'Contrato • 6 laudas'}
                        </div>
                        <div className="text-[9px] text-emerald-400 font-mono font-bold">
                          Prioridade Alta ⚡
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Em Contato */}
                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800">
                      <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                        <span>Em Contato</span>
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[9px] flex items-center justify-center">
                          2
                        </span>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 space-y-1 opacity-70">
                        <div className="font-semibold text-slate-300">Beatriz Lima</div>
                        <div>Histórico Escolar • EN</div>
                      </div>
                    </div>

                    {/* Column 3: Proposta Enviada */}
                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800">
                      <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                        <span>Proposta</span>
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[9px] flex items-center justify-center">
                          1
                        </span>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 space-y-1 opacity-70">
                        <div className="font-semibold text-slate-300">Empresa Alpha S/A</div>
                        <div>Balanço 2025 • ES</div>
                      </div>
                    </div>
                  </div>

                  {crmLeadInteracted && (
                    <div className="p-3 bg-indigo-950/70 border border-indigo-500/50 rounded-xl text-xs text-indigo-200 flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>
                        Excelente! O atendente já importou suas laudas e gerou a proposta sob medida.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <Button
                      variant="ghost"
                      onClick={() => goToStep(1)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      onClick={() => goToStep(3)}
                      className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      <span>Ver Orçamento Inteligente</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3: O LEAD CUSTOMIZA SEU ORÇAMENTO E VÊ PREÇOS E PRAZOS AO VIVO      */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Customization switches */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Service Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Tipo de Tradução:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setServiceType('juramentada');
                          sfx.playStep();
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          serviceType === 'juramentada'
                            ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/40 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">Juramentada (Oficial)</span>
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Fé pública reconhecida por lei para consulados, processos e universidades.
                        </p>
                        <div className="text-xs font-semibold text-blue-300 mt-2">R$ 68 / lauda</div>
                      </button>

                      <button
                        onClick={() => {
                          setServiceType('certificada');
                          sfx.playStep();
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          serviceType === 'certificada'
                            ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/40 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">Certificada (Livre)</span>
                          <FileCheck2 className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Ideal para artigos científicos, manuais técnicos e uso corporativo interno.
                        </p>
                        <div className="text-xs font-semibold text-amber-300 mt-2">R$ 45 / lauda</div>
                      </button>
                    </div>
                  </div>

                  {/* Urgency & Addons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Urgency switch */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Prazo de Entrega:
                      </label>
                      <button
                        onClick={() => {
                          setUrgency(urgency === 'normal' ? 'express' : 'normal');
                          sfx.playStep();
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          urgency === 'express'
                            ? 'bg-amber-950/60 border-amber-500 text-white ring-1 ring-amber-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{urgency === 'express' ? '⚡ Urgência 24h Express' : '📅 Prazo Padrão (3 dias)'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {urgency === 'express' ? 'Prioridade máxima na fila' : 'Sem taxa de urgência'}
                        </span>
                      </button>
                    </div>

                    {/* Apostille Addon */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Apostilamento de Haia:
                      </label>
                      <button
                        onClick={() => {
                          setApostille(!apostille);
                          sfx.playStep();
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          apostille
                            ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{apostille ? '✓ Apostilamento Incluso' : '+ Adicionar Haia'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {apostille ? 'Válido em 120+ países (+R$ 180)' : 'Chancela notarial do CNJ'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Live Quote Breakdown Card */}
                <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-300">Resumo da Proposta</span>
                      <span className="text-xs font-mono font-bold text-blue-400">ORC-000042</span>
                    </div>

                    <div className="py-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>{laudas} laudas ({serviceType === 'juramentada' ? 'Juramentada' : 'Certificada'})</span>
                        <span className="font-semibold text-white">R$ {subtotal},00</span>
                      </div>

                      {urgency === 'express' && (
                        <div className="flex items-center justify-between text-amber-300">
                          <span>Taxa de Urgência Express (24h)</span>
                          <span className="font-semibold">+ R$ {Math.round(subtotal * 0.4)},00</span>
                        </div>
                      )}

                      {apostille && (
                        <div className="flex items-center justify-between text-emerald-300">
                          <span>Apostilamento de Haia (CNJ)</span>
                          <span className="font-semibold">+ R$ 180,00</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                        <div>
                          <div className="text-xs text-slate-400">Total Investido</div>
                          <div className="text-[11px] text-emerald-400">À vista com 5% de desconto no Pix</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-white tracking-tight">
                            R$ {totalPrice},00
                          </div>
                          <div className="text-[10px] text-slate-400">ou até 12x de R$ {Math.round((totalPrice * 1.1) / 12)},00</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => goToStep(2)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      onClick={() => goToStep(4)}
                      className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      <span>Avançar para Assinatura</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 4: O LEAD ASSINA DIGITALMENTE NA TELA E APROVA O ORÇAMENTO          */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Proposal conditions */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white">Proposta Digital Oficial</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Link Protegido por Token
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-300">
                      <div><b>Contratante:</b> Você (Lead Simulado)</div>
                      <div><b>Serviço:</b> Tradução Juramentada com Fé Pública</div>
                      <div><b>Prazo Garantido:</b> {urgency === 'express' ? '24 horas úteis' : '3 dias úteis'}</div>
                      <div><b>Valor Total:</b> R$ {totalPrice},00</div>
                    </div>

                    <div className="p-2.5 bg-blue-950/50 border border-blue-800/40 rounded-xl text-[11px] text-blue-200">
                      💡 <b>Como funciona na vida real:</b> O cliente recebe este link diretamente no WhatsApp ou E-mail, clica, confere os dados e aprova sem precisar imprimir ou escanear nada!
                    </div>
                  </div>
                </div>

                {/* Right: Interactive Signature Box */}
                <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-300">
                        Assine com o mouse ou o dedo abaixo:
                      </span>
                      <button
                        onClick={clearSignature}
                        className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        Limpar Assinatura
                      </button>
                    </div>

                    {/* Canvas for live drawing */}
                    <div className="my-3 bg-white rounded-xl border-2 border-dashed border-slate-300 relative overflow-hidden h-36 flex items-center justify-center cursor-crosshair">
                      <canvas
                        ref={canvasRef}
                        width={480}
                        height={144}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full touch-none"
                      />
                      {!hasSignature && (
                        <div className="absolute pointer-events-none text-slate-400 text-xs font-serif italic opacity-70">
                          Desenhe sua assinatura aqui com o mouse...
                        </div>
                      )}
                    </div>

                    {/* Quick Button to approve */}
                    {!isApproved ? (
                      <button
                        onClick={approveProposal}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>Aprovar Orçamento e Iniciar Tradução Agora</span>
                      </button>
                    ) : (
                      <div className="p-4 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center justify-between animate-in zoom-in-95">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <div>
                            <div className="font-bold text-white text-sm">PROPOSTA APROVADA!</div>
                            <div className="text-[11px] text-emerald-300">
                              Ordem de Serviço <b>OS-000001</b> criada instantaneamente.
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-900/60 px-2 py-1 rounded text-emerald-300 font-mono">
                          IP: 187.54.12.98
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <Button
                      variant="ghost"
                      onClick={() => goToStep(3)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      onClick={() => goToStep(5)}
                      className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      <span>Ver Produção em Tempo Real</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 5: O LEAD ACOMPANHA A PRODUÇÃO DA ORDEM DE SERVIÇO EM TEMPO REAL    */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Assigned Translator info */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Tradutor Juramentado Habilitado
                    </span>

                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white text-xl font-bold shadow-md">
                        👨‍⚖️
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">Dr. Carlos Eduardo Mendes</div>
                        <div className="text-[11px] text-amber-400 font-mono">JUCESP Matrícula nº 1.482</div>
                        <div className="text-[10px] text-slate-400">Par: Inglês ⬌ Português (Fé Pública)</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Matrícula ativa e regularizada na Junta Comercial</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Certificado Digital ICP-Brasil A3 Token</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Assinatura com carimbo do tempo oficial</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Production Progression Steps */}
                <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-300">
                        Raio-X de Produção da sua OS
                      </span>
                      <span className="text-[10px] font-mono text-blue-400">
                        Fase {prodStage} de 4
                      </span>
                    </div>

                    {/* Stage Buttons */}
                    <div className="grid grid-cols-4 gap-2 my-4">
                      {[
                        { id: 1, label: '1. Tradução', desc: 'Versão juramentada' },
                        { id: 2, label: '2. Revisão', desc: 'Terminologia & pares' },
                        { id: 3, label: '3. Formatação', desc: 'Diagramação fiel' },
                        { id: 4, label: '4. Carimbo', desc: 'Chancela ICP-Brasil' },
                      ].map((stg) => (
                        <button
                          key={stg.id}
                          onClick={() => advanceProd(stg.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            prodStage === stg.id
                              ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400/50'
                              : prodStage > stg.id
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <div className="text-xs">{stg.label}</div>
                          <div className="text-[9px] opacity-80 mt-0.5">{stg.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Visual Comparison / State Box */}
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs space-y-3">
                      <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800/80">
                        <span>Status Atual da Produção:</span>
                        <span className="font-bold text-blue-400">
                          {prodStage === 1 && 'Tradutor digitando os termos legais...'}
                          {prodStage === 2 && 'Revisor comparando com texto original...'}
                          {prodStage === 3 && 'Ajustando margens e carimbos originais...'}
                          {prodStage === 4 && 'Chancela com Fé Pública aplicada!'}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] leading-relaxed text-slate-300">
                        {prodStage === 1 && (
                          <span className="text-cyan-300">
                            &quot;I, Carlos Eduardo Mendes, Public Sworn Translator, hereby certify that the document presented to me in Portuguese was faithfully translated into English...&quot;
                          </span>
                        )}
                        {prodStage === 2 && (
                          <span className="text-emerald-300">
                            &quot;✓ Revisão terminológica concluída: equivalência de disciplinas acadêmicas validada para avaliação WES / NACES.&quot;
                          </span>
                        )}
                        {prodStage === 3 && (
                          <span className="text-amber-300">
                            &quot;📐 Diagramação concluída: brasão da universidade replicado, selos e chancelas originais devidamente descritos.&quot;
                          </span>
                        )}
                        {prodStage === 4 && (
                          <div className="space-y-1.5 text-emerald-400">
                            <div className="font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              CERTIFICADO ICP-BRASIL ASSINADO DIGITALMENTE
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans">
                              Código Hash: <span className="font-mono text-slate-300">8f2b4c10...9e71a0</span> · Válido perante a Lei Federal nº 14.063/2020.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <Button
                      variant="ghost"
                      onClick={() => goToStep(4)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      onClick={() => goToStep(6)}
                      className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      <span>Acessar Portal & Baixar</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 6: O LEAD RECEBE O DOCUMENTO PRONTO NO PORTAL DO CLIENTE            */}
          {/* ========================================================================= */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Certificate Graphic with Seals and QR Code */}
                <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 rounded-2xl border border-blue-500/30 p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      Certidão de Tradução Juramentada
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                      FÉ PÚBLICA NACIONAL
                    </span>
                  </div>

                  {/* Document Graphic Mockup */}
                  <div className="my-4 bg-white text-slate-900 rounded-xl p-5 shadow-lg border border-slate-200 space-y-3 font-serif select-none">
                    <div className="text-center border-b border-slate-300 pb-2">
                      <div className="text-[10px] font-sans font-bold tracking-widest text-slate-500 uppercase">
                        REPÚBLICA FEDERATIVA DO BRASIL
                      </div>
                      <div className="text-xs font-bold tracking-wide mt-0.5">
                        TRADUÇÃO PÚBLICA JURAMENTADA Nº 1.042/2026
                      </div>
                    </div>

                    <div className="text-[11px] leading-relaxed text-slate-700 italic">
                      &quot;Aos trinta dias do mês de setembro do ano de dois mil e vinte e seis, eu, Tradutor Público Juramentado, certifico e dou fé que me foi apresentado o documento oficial...&quot;
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      {/* Simulated QR Code SVG */}
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-slate-900 p-1 rounded-lg flex items-center justify-center text-white">
                          <QrCode className="w-10 h-10" />
                        </div>
                        <div className="text-[9px] font-sans text-slate-500 leading-tight">
                          Autenticidade Verificável
                          <br />
                          <b>traduztudo.com/v/8f2b4c</b>
                        </div>
                      </div>

                      {/* Golden Stamp Badge */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-sans font-bold shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Selo de Fé Pública</span>
                      </div>
                    </div>
                  </div>

                  {/* Download Action */}
                  <button
                    onClick={() => {
                      setDocDownloaded(true);
                      sfx.playSuccess();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Tradução Oficial em PDF (Simulado)</span>
                  </button>

                  {docDownloaded && (
                    <div className="mt-2 text-center text-xs text-emerald-400 font-semibold animate-in fade-in">
                      ✓ Download concluído! Arquivo assinado digitalmente pronto para entrega.
                    </div>
                  )}
                </div>

                {/* Right: Lead Journey Completion Card & Real Actions */}
                <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 rounded-2xl text-xs space-y-2">
                      <div className="font-extrabold text-white text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Parabéns! Você completou a jornada inteira do Lead!
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Você acabou de vivenciar o ciclo completo que faz a <b>TraduzTudo</b> ser a empresa de traduções mais rápida, transparente e confiável do mercado brasileiro.
                      </p>
                    </div>

                    {/* Comparison table */}
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                        Por que nossos clientes amam a experiência?
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-400">
                          <span className="font-bold text-rose-400 block mb-1">Maneira Tradicional:</span>
                          • Orçamentos demoram 24h a 48h
                          <br />• Sem rastreio de produção
                          <br />• Burocracia com impressões
                        </div>
                        <div className="bg-blue-950/50 p-2.5 rounded-xl border border-blue-800/60 text-slate-200">
                          <span className="font-bold text-emerald-400 block mb-1">Com TraduzTudo OS:</span>
                          • Orçamento em menos de 10 min
                          <br />• Rastreio em tempo real tipo Uber
                          <br />• Assinatura digital com 1 clique
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real Conversion CTA buttons */}
                  <div className="pt-4 border-t border-slate-800 space-y-2.5">
                    <a
                      href="https://traduztudo.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <span>Fazer Pedido Real no Site TraduzTudo</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/portal"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold text-center transition-all border border-slate-700"
                      >
                        Abrir Portal do Cliente
                      </Link>

                      <button
                        onClick={() => {
                          setCurrentStep(1);
                          setScanComplete(false);
                          setIsApproved(false);
                          setProdStage(1);
                          setDocDownloaded(false);
                          sfx.playStep();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
                        title="Reiniciar Simulação"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Recomeçar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
