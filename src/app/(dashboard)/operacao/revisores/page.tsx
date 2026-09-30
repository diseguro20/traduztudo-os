'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Mail,
  Phone,
  DollarSign,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { Reviewer } from '@/types';
import { formatCurrency, formatPhone } from '@/lib/utils';

export default function RevisoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState('Inglês, Espanhol, Italiano');
  const [specialties, setSpecialties] = useState('Revisão Notarial, Terminológica');

  const reviewers = databaseStore.getReviewers().filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.languages.some((l) => l.toLowerCase().includes(term))
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createReviewer({
      tenantId: tenant.id,
      name,
      email,
      phone,
      languages: languages.split(',').map((s) => s.trim()),
      specialties: specialties.split(',').map((s) => s.trim()),
      contractType: 'pj',
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
            <UserCheck className="w-6 h-6 text-blue-600" /> Cadastro de Revisores
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Equipe de revisão de fidelidade, formatação notarial e conferência de certidões.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" /> Novo Revisor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviewers.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {r.contractType.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{r.name}</h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {r.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {formatPhone(r.phone)}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Idiomas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {r.languages.map((l, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Especialidades</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {r.specialties.map((s, i) => (
                    <span key={i} className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Ativas</p>
                <p className="font-bold text-slate-900">{r.assignedOrdersCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Concluídas</p>
                <p className="font-bold text-emerald-600">{r.completedOrdersCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">A Pagar</p>
                <p className="font-bold text-amber-600">
                  {formatCurrency(r.pendingPaymentAmount)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Revisor"
        description="Cadastre um novo revisor linguístico com especialidades."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome do Revisor *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fernando Alvarez"
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
                placeholder="revisor@email.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-8888"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Idiomas que Revisa (separados por vírgula)
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Cadastrar Revisor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
