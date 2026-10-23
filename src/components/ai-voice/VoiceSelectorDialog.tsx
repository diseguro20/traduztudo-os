'use client';

import React, { useState, useRef } from 'react';
import { AVAILABLE_VOICES } from '@/lib/ai-voice/voices';
import { AgentVoice, VoiceGender } from '@/types/ai-voice';
import { Play, Pause, Check, Volume2, Mic, Upload, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VoiceSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export function VoiceSelectorDialog({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
}: VoiceSelectorDialogProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'custom'>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [tempSelectedId, setTempSelectedId] = useState<string>(selectedVoiceId);

  // Custom Voice Clone State
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isRecordingConsent, setIsRecordingConsent] = useState(false);
  const [consentBlob, setConsentBlob] = useState<Blob | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const filteredVoices = AVAILABLE_VOICES.filter(v => {
    if (v.id === 'custom') return false;
    if (selectedGender !== 'all' && v.gender !== selectedGender) return false;
    return true;
  });

  const handlePreviewVoice = (voice: AgentVoice) => {
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.id);
    // Real synthesis audio preview
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Olá! Eu sou a ${voice.name}, assistente da TraduzTudo. Esta é a minha voz natural para suas ligações e reuniões de vídeo.`
      );
      utterance.lang = voice.language;
      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  const handleSave = () => {
    if (activeTab === 'custom') {
      onSelectVoice('custom');
    } else {
      onSelectVoice(tempSelectedId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Selecionar Voz do Assistente</h3>
            <p className="text-xs text-gray-500">
              Voz neural hiper-realista com latência ultra-baixa para atendimento por voz e vídeo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-6 border-b border-gray-100 gap-6 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Todas as Vozes
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voz Personalizada (Clonagem)
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'all' ? (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-medium text-gray-500">Filtrar por gênero:</span>
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs">
                  {['all', 'Feminino', 'Masculino'].map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        selectedGender === g
                          ? 'bg-white font-bold text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {g === 'all' ? 'Todos' : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice cards */}
              <div className="space-y-2">
                {filteredVoices.map(voice => {
                  const isSelected = tempSelectedId === voice.id;
                  const isPlaying = playingVoiceId === voice.id;

                  return (
                    <div
                      key={voice.id}
                      onClick={() => setTempSelectedId(voice.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${voice.color}`}
                        >
                          {voice.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{voice.name}</span>
                            {voice.popular && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                                Recomendada
                              </span>
                            )}
                            <span className="text-xs text-gray-400">· {voice.accent}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{voice.detail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handlePreviewVoice(voice);
                          }}
                          className={`p-2 rounded-lg border transition-colors ${
                            isPlaying
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                          title="Ouvir prévia"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Cloned Voice Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Shield className="w-4 h-4 text-amber-700" />
                  Clonagem de Voz com Validação de Consentimento
                </div>
                Clone a voz de um dos fundadores ou tradutores oficiais para que o assistente atenda com a mesma entonação e timbre real.
              </div>

              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".mp3,.wav,.m4a,.ogg,.mp4"
                  className="hidden"
                  onChange={e => setCustomAudioFile(e.target.files?.[0] || null)}
                />
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">
                  {customAudioFile ? customAudioFile.name : 'Envie um áudio de referência (MP3, WAV ou MP4)'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Áudios de 1 a 15 minutos em ambiente silencioso geram fidelidade máxima.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {customAudioFile ? 'Substituir Arquivo' : 'Escolher Arquivo de Áudio'}
                </Button>
              </div>

              <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-800">Frase obrigatória de consentimento do proprietário:</p>
                <blockquote className="text-xs italic bg-white p-2.5 rounded border border-gray-200 text-gray-700">
                  &ldquo;Eu sou o proprietário desta voz e autorizo a TraduzTudo a criar meu modelo de voz neural sintética para atendimento.&rdquo;
                </blockquote>

                <label className="flex items-start gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={e => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-700">
                    Declaro que a voz enviada é minha ou possuo autorização formal documentada.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={activeTab === 'custom' && (!customAudioFile || !consentAccepted)}
          >
            Confirmar Voz
          </Button>
        </div>
      </div>
    </div>
  );
}
