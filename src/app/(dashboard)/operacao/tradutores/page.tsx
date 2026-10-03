'use client';

import React, { useState, useEffect } from 'react';
import {
  Languages,
  Plus,
  Search,
  Mail,
  Phone,
  DollarSign,
  FileCheck2,
  CheckCircle2,
  Pencil,
  Trash2,
  CreditCard,
  FileText,
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

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  // Create Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contractType, setContractType] = useState<'freelancer' | 'pj' | 'clt'>('freelancer');
  const [languages, setLanguages] = useState('Inglês -> Português');
  const [specialties, setSpecialties] = useState('Juramentada JUCESP');
  const [ratePerLauda, setRatePerLauda] = useState('48.00');
  const [ratePerWord, setRatePerWord] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Edit Form State
  const [editingTranslator, setEditingTranslator] = useState<Translator | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editContractType, setEditContractType] = useState<'freelancer' | 'pj' | 'clt'>('freelancer');
  const [editLanguages, setEditLanguages] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editRatePerLauda, setEditRatePerLauda] = useState('');
  const [editRatePerWord, setEditRatePerWord] = useState('');
  const [editPixKey, setEditPixKey] = useState('');
  const [editBankInfo, setEditBankInfo] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editActive, setEditActive] = useState(true);

  const translators = databaseStore.getTranslators().filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.email.toLowerCase().includes(term) ||
      t.languages.some((l) => l.toLowerCase().includes(term)) ||
      (t.specialties && t.specialties.some((s) => s.toLowerCase().includes(term)))
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
      languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
      specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
      contractType,
      ratePerLauda: ratePerLauda ? parseFloat(ratePerLauda) : undefined,
      ratePerWord: ratePerWord ? parseFloat(ratePerWord) : undefined,
      pixKey,
      bankInfo,
      notes,
      active: true,
    });

    setIsModalOpen(false);
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setRatePerLauda('48.00');
    setRatePerWord('');
    setPixKey('');
    setBankInfo('');
    setNotes('');
    setRefresh((r) => r + 1);
  };

  const handleOpenEdit = (t: Translator) => {
    setEditingTranslator(t);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditPhone(t.phone || '');
    setEditContractType(t.contractType || 'freelancer');
    setEditLanguages((t.languages || []).join(', '));
    setEditSpecialties((t.specialties || []).join(', '));
    setEditRatePerLauda(t.ratePerLauda !== undefined ? String(t.ratePerLauda) : '');
    setEditRatePerWord(t.ratePerWord !== undefined ? String(t.ratePerWord) : '');
    setEditPixKey(t.pixKey || '');
    setEditBankInfo(t.bankInfo || '');
    setEditNotes(t.notes || '');
    setEditActive(t.active !== undefined ? t.active : true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTranslator || !editName || !editEmail) return;

    databaseStore.updateTranslator(editingTranslator.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      whatsapp: editPhone,
      contractType: editContractType,
      languages: editLanguages.split(',').map((s) => s.trim()).filter(Boolean),
      specialties: editSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      ratePerLauda: editRatePerLauda ? parseFloat(editRatePerLauda) : undefined,
      ratePerWord: editRatePerWord ? parseFloat(editRatePerWord) : undefined,
      pixKey: editPixKey,
      bankInfo: editBankInfo,
      notes: editNotes,
      active: editActive,
    });

    setEditingTranslator(null);
    setRefresh((r) => r + 1);
  };

  const handleDelete = (t: Translator) => {
    if (confirm(`Deseja realmente excluir o cadastro do tradutor "${t.name}"?`)) {
      databaseStore.deleteTranslator(t.id);
      setRefresh((r) => r + 1);
    }
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

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" /> Novo Tradutor
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar tradutores por nome, e-mail, idioma ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          Total: <strong className="text-slate-900">{translators.length}</strong> cadastrados
        </span>
      </div>

      {/* Grid of Translators */}
      {translators.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Languages className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Nenhum tradutor encontrado</p>
          <p className="text-xs text-slate-400">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Clique no botão acima para cadastrar seu primeiro tradutor.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {translators.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header with Type, Status and Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {(t.contractType || 'freelancer').toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                          t.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {t.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{t.name}</h3>
                  </div>

                  {/* Actions: Edit and Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Informações do Tradutor"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir Tradutor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {formatPhone(t.phone)}
                  </p>
                  {t.pixKey && (
                    <p className="flex items-center gap-2 text-[11px] text-slate-500">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" /> PIX: {t.pixKey}
                    </p>
                  )}
                </div>

                {/* Languages and Specialties */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Pares de Idiomas</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.languages && t.languages.length > 0 ? (
                        t.languages.map((l, i) => (
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
                      {t.specialties && t.specialties.length > 0 ? (
                        t.specialties.map((s, i) => (
                          <span key={i} className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Geral</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rates */}
                {(t.ratePerLauda || t.ratePerWord) && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Tarifa:</span>
                    <span className="font-semibold text-slate-800">
                      {t.ratePerLauda ? `${formatCurrency(t.ratePerLauda)}/lauda` : ''}
                      {t.ratePerLauda && t.ratePerWord ? ' • ' : ''}
                      {t.ratePerWord ? `${formatCurrency(t.ratePerWord)}/palavra` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats & Edit Action Button */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400">Ativas</p>
                    <p className="font-bold text-slate-900">{t.assignedOrdersCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Concluídas</p>
                    <p className="font-bold text-emerald-600">{t.completedOrdersCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">A Pagar</p>
                    <p className="font-bold text-amber-600">
                      {formatCurrency(t.pendingPaymentAmount || 0)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(t)}
                  className="w-full text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar Informações
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Tradutor"
        description="Cadastre um novo linguista com pares de idiomas, contatos e dados para repasse."
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
              placeholder="Ex: Carla Strambio"
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
                placeholder="tradutor@email.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <option value="freelancer">Freelancer</option>
              <option value="pj">Pessoa Jurídica (PJ)</option>
              <option value="clt">CLT / Contratado</option>
            </select>
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
              placeholder="Juramentada JUCESP, Técnica, Médica"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="48.00"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Preço por Palavra (R$)
              </label>
              <input
                type="number"
                step="0.001"
                value={ratePerWord}
                onChange={(e) => setRatePerWord(e.target.value)}
                placeholder="0.18"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, celular ou e-mail"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Dados Bancários / Conta
              </label>
              <input
                type="text"
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                placeholder="Banco, Agência, Conta"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Observações Internas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre disponibilidade, credenciamentos, etc."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Cadastrar Tradutor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={!!editingTranslator}
        onClose={() => setEditingTranslator(null)}
        title="Editar Informações do Tradutor"
        description="Atualize dados de contato, pares de idiomas, especialidades e dados de repasse."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome do Tradutor *
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
                Telefone / WhatsApp
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
                <option value="freelancer">Freelancer</option>
                <option value="pj">Pessoa Jurídica (PJ)</option>
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
              Pares de Idiomas (separados por vírgula)
            </label>
            <input
              type="text"
              value={editLanguages}
              onChange={(e) => setEditLanguages(e.target.value)}
              placeholder="Inglês -> Português, Espanhol -> Português"
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
              placeholder="Juramentada JUCESP, Técnica, Médica"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={editRatePerLauda}
                onChange={(e) => setEditRatePerLauda(e.target.value)}
                placeholder="48.00"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Preço por Palavra (R$)
              </label>
              <input
                type="number"
                step="0.001"
                value={editRatePerWord}
                onChange={(e) => setEditRatePerWord(e.target.value)}
                placeholder="0.18"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={editPixKey}
                onChange={(e) => setEditPixKey(e.target.value)}
                placeholder="CPF, celular ou e-mail"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Dados Bancários / Conta
              </label>
              <input
                type="text"
                value={editBankInfo}
                onChange={(e) => setEditBankInfo(e.target.value)}
                placeholder="Banco, Agência, Conta"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Observações Internas
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Anotações sobre disponibilidade, credenciamentos, etc."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (editingTranslator) {
                  handleDelete(editingTranslator);
                  setEditingTranslator(null);
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir Cadastro
            </button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingTranslator(null)}>
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
