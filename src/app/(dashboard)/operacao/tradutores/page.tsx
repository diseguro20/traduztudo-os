'use client';

import React, { useState } from 'react';
import {
  Languages,
  Plus,
  Search,
  Mail,
  Phone,
  DollarSign,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { Translator } from '@/types';
import { formatCurrency, formatPhone } from '@/lib/utils';

export default function TradutoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState('Inglês -> Português');
  const [specialties, setSpecialties] = useState('Juramentada JUCESP');
  const [ratePerLauda, setRatePerLauda] = useState('48.00');
  const [pixKey, setPixKey] = useState('');

  const translators = databaseStore.getTranslators().filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.email.toLowerCase().includes(term) ||
      t.languages.some((l) => l.toLowerCase().includes(term))
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createTranslator({
      tenantId: tenant.id,
      name,
      email,
      phone,
      whatsapp: phone,
      languages: languages.split(',').map((s) => s.trim()),
      specialties: specialties.split(',').map((s) => s.trim()),
      contractType: 'freelancer',
      ratePerLauda: parseFloat(ratePerLauda) || 0,
      pixKey,
      active: true,
    });

    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Languages className="w-6 h-6 text-blue-600" /> Cadastro de Tradutores
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestão de tradutores públicos juramentados, técnicos e freelancers credenciados.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" /> Novo Tradutor
        </Button>
      </div>

      {/* Grid of Translators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {translators.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {t.contractType.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{t.name}</h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {t.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {formatPhone(t.phone)}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Pares de Idiomas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {t.languages.map((l, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Especialidades</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {t.specialties.map((s, i) => (
                    <span key={i} className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Ativas</p>
                <p className="font-bold text-slate-900">{t.assignedOrdersCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Concluídas</p>
                <p className="font-bold text-emerald-600">{t.completedOrdersCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">A Pagar</p>
                <p className="font-bold text-amber-600">
                  {formatCurrency(t.pendingPaymentAmount)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Tradutor"
        description="Cadastre um novo linguista com pares de idiomas e dados para repasse."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome do Tradutor *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lucas Andrade"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tradutor@email.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Pares de Idiomas (separados por vírgula)
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="Inglês -> Português, Espanhol -> Português"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Preço por Lauda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={ratePerLauda}
                onChange={(e) => setRatePerLauda(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF ou e-mail"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Cadastrar Tradutor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
