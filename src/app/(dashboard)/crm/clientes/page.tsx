'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Building,
  User,
  DollarSign,
  FileCheck2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { Customer, CustomerType } from '@/types';
import { formatCurrency, formatDate, formatDocument, formatPhone } from '@/lib/utils';

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PF' | 'PJ'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  // Form State
  const [type, setType] = useState<CustomerType>('PF');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [notes, setNotes] = useState('');

  const customers = databaseStore.getCustomers().filter((c) => {
    const matchesType = filterType === 'ALL' || c.type === filterType;
    if (!matchesType) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.cpf && c.cpf.includes(term)) ||
      (c.cnpj && c.cnpj.includes(term)) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = databaseStore.getTenant();

    databaseStore.createCustomer({
      tenantId: tenant.id,
      type,
      name,
      cpf: type === 'PF' ? cpf : undefined,
      companyName: type === 'PJ' ? name : undefined,
      tradeName: type === 'PJ' ? tradeName : undefined,
      cnpj: type === 'PJ' ? cnpj : undefined,
      contactPerson: type === 'PJ' ? contactPerson : undefined,
      email,
      phone,
      whatsapp: phone,
      city,
      state,
      country: 'Brasil',
      notes,
    });

    setIsModalOpen(false);
    setRefresh((r) => r + 1);
    // Reset
    setName('');
    setCpf('');
    setCnpj('');
    setTradeName('');
    setEmail('');
    setPhone('');
    setNotes('');
  };

  const handleDeleteCustomer = (id: string, customerName: string) => {
    if (confirm(`Tem certeza que deseja arquivar o cliente "${customerName}"?`)) {
      databaseStore.deleteCustomer(id);
      setRefresh((r) => r + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Cadastro de Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie clientes PF e PJ, histórico de pedidos, faturamento e pendências.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome, CPF/CNPJ, e-mail, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Todos ({databaseStore.getCustomers().length})
            </button>
            <button
              onClick={() => setFilterType('PF')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'PF' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pessoa Física
            </button>
            <button
              onClick={() => setFilterType('PJ')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'PJ' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pessoa Jurídica
            </button>
          </div>
        </div>
      </div>

      {/* Table of Customers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Total Faturado</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    Nenhum cliente encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/crm/clientes/${c.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 flex items-center gap-2 group-hover:underline"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.type === 'PF' ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{c.name}</p>
                          {c.tradeName && <p className="text-xs text-slate-500">{c.tradeName}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          c.type === 'PJ'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                      {formatDocument(c.cpf || c.cnpj)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {formatPhone(c.phone)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {c.city ? `${c.city}/${c.state || 'BR'}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">{c.ordersCount}</span> ordens
                      {c.activeOrdersCount > 0 && (
                        <span className="ml-1 text-[11px] text-blue-600 font-semibold">
                          ({c.activeOrdersCount} ativas)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/crm/clientes/${c.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Abrir Dossiê do Cliente"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Arquivar Cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Cliente"
        description="Preencha os dados cadastrais da Pessoa Física ou Jurídica."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={type === 'PF'}
                onChange={() => setType('PF')}
                className="text-blue-600"
              />
              Pessoa Física (PF)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={type === 'PJ'}
                onChange={() => setType('PJ')}
                className="text-blue-600"
              />
              Pessoa Jurídica (PJ)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {type === 'PF' ? 'Nome Completo' : 'Razão Social'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'PF' ? 'Ex: Beatriz Montenegro' : 'Ex: TechNova Soluções Ltda'}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {type === 'PF' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {type === 'PJ' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: TechNova"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pessoa de Contato / Cargo
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ex: Dra. Fernanda Lins"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estado (UF)
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="SP"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Histórico, condições de faturamento acordadas, etc."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Cadastrar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
