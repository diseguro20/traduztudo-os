'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Mail,
  Phone,
  DollarSign,
  FileCheck2,
  Pencil,
  Trash2,
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

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  // Create Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contractType, setContractType] = useState<'freelancer' | 'pj' | 'clt'>('pj');
  const [languages, setLanguages] = useState('Inglês, Espanhol, Italiano');
  const [specialties, setSpecialties] = useState('Revisão Notarial, Terminológica');
  const [notes, setNotes] = useState('');

  // Edit Form State
  const [editingReviewer, setEditingReviewer] = useState<Reviewer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editContractType, setEditContractType] = useState<'freelancer' | 'pj' | 'clt'>('pj');
  const [editLanguages, setEditLanguages] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editNotes, setEditNotes] = useState('');

  const reviewers = databaseStore.getReviewers().filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.languages && r.languages.some((l) => l.toLowerCase().includes(term))) ||
      (r.specialties && r.specialties.some((s) => s.toLowerCase().includes(term)))
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
      languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
      specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
      contractType,
      active: true,
      notes,
    });

    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setRefresh((r) => r + 1);
  };

  const handleOpenEdit = (r: Reviewer) => {
    setEditingReviewer(r);
    setEditName(r.name);
    setEditEmail(r.email);
    setEditPhone(r.phone || '');
    setEditContractType(r.contractType || 'pj');
    setEditLanguages((r.languages || []).join(', '));
    setEditSpecialties((r.specialties || []).join(', '));
    setEditActive(r.active !== undefined ? r.active : true);
    setEditNotes(r.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewer || !editName || !editEmail) return;

    databaseStore.updateReviewer(editingReviewer.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      contractType: editContractType,
      languages: editLanguages.split(',').map((s) => s.trim()).filter(Boolean),
      specialties: editSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      active: editActive,
      notes: editNotes,
    });

    setEditingReviewer(null);
    setRefresh((r) => r + 1);
  };

  const handleDelete = (r: Reviewer) => {
    if (confirm(`Deseja realmente excluir o cadastro do revisor "${r.name}"?`)) {
      databaseStore.deleteReviewer(r.id);
      setRefresh((r) => r + 1);
    }
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

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar revisores por nome, e-mail, idioma ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          Total: <strong className="text-slate-900">{reviewers.length}</strong> cadastrados
        </span>
      </div>

      {/* Grid */}
      {reviewers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Nenhum revisor encontrado</p>
          <p className="text-xs text-slate-400">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Clique no botão acima para cadastrar seu primeiro revisor.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviewers.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {(r.contractType || 'pj').toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                          r.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {r.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{r.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(r)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Informações do Revisor"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir Revisor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {r.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {formatPhone(r.phone)}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Idiomas</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.languages && r.languages.length > 0 ? (
                        r.languages.map((l, i) => (
                          <span key={i} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {l}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Não informado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Especialidades</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.specialties && r.specialties.length > 0 ? (
                        r.specialties.map((s, i) => (
                          <span key={i} className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Geral</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400">Ativas</p>
                    <p className="font-bold text-slate-900">{r.assignedOrdersCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Concluídas</p>
                    <p className="font-bold text-emerald-600">{r.completedOrdersCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">A Pagar</p>
                    <p className="font-bold text-amber-600">
                      {formatCurrency(r.pendingPaymentAmount || 0)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(r)}
                  className="w-full text-xs gap-1.5 text-purple-700 hover:text-purple-800 hover:bg-purple-50 hover:border-purple-300"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar Informações
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Revisor"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tipo de Contrato
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="pj">Pessoa Jurídica (PJ)</option>
              <option value="freelancer">Freelancer</option>
              <option value="clt">CLT / Contratado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Idiomas (separados por vírgula)
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="Inglês, Espanhol, Italiano"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Especialidades (separadas por vírgula)
            </label>
            <input
              type="text"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="Revisão Notarial, Terminológica, Acadêmica"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Cadastrar Revisor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edição */}
      <Modal
        isOpen={!!editingReviewer}
        onClose={() => setEditingReviewer(null)}
        title="Editar Informações do Revisor"
        description="Atualize os dados de contato, idiomas e especialidades do revisor."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome do Revisor *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tipo de Contrato
              </label>
              <select
                value={editContractType}
                onChange={(e) => setEditContractType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="pj">Pessoa Jurídica (PJ)</option>
                <option value="freelancer">Freelancer</option>
                <option value="clt">CLT / Contratado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Status
              </label>
              <select
                value={editActive ? 'true' : 'false'}
                onChange={(e) => setEditActive(e.target.value === 'true')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Idiomas (separados por vírgula)
            </label>
            <input
              type="text"
              value={editLanguages}
              onChange={(e) => setEditLanguages(e.target.value)}
              placeholder="Inglês, Espanhol, Italiano"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Especialidades (separadas por vírgula)
            </label>
            <input
              type="text"
              value={editSpecialties}
              onChange={(e) => setEditSpecialties(e.target.value)}
              placeholder="Revisão Notarial, Terminológica, Acadêmica"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (editingReviewer) {
                  handleDelete(editingReviewer);
                  setEditingReviewer(null);
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir Cadastro
            </button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingReviewer(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
