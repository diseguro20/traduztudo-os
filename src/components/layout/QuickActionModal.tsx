'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { databaseStore } from '@/lib/db';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  FileCheck2,
  DollarSign,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickActionModal({ isOpen, onClose, onSuccess }: QuickActionModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'menu' | 'customer' | 'lead' | 'payment'>('menu');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Customer State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custType, setCustType] = useState<'PF' | 'PJ'>('PF');

  // Quick Lead State
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadService, setLeadService] = useState('Tradução Juramentada');

  // Quick Payment State
  const [payDesc, setPayDesc] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payCustomer, setPayCustomer] = useState('');

  const resetForm = () => {
    setActiveTab('menu');
    setSuccessMessage(null);
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
    setPayDesc('');
    setPayAmount('');
    setPayCustomer('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail) return;

    const tenant = databaseStore.getTenant();
    databaseStore.createCustomer({
      tenantId: tenant.id,
      type: custType,
      name: custName,
      email: custEmail,
      phone: custPhone,
      whatsapp: custPhone,
    });

    setSuccessMessage(`Cliente "${custName}" cadastrado com sucesso!`);
    onSuccess?.();
    setTimeout(() => {
      handleClose();
      router.push('/crm/clientes');
    }, 1200);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;

    const tenant = databaseStore.getTenant();
    databaseStore.createLead({
      tenantId: tenant.id,
      name: leadName,
      type: 'PF',
      email: leadEmail,
      phone: leadPhone,
      origin: 'Atendimento Direto',
      interestedServiceName: leadService,
      status: 'novo',
    });

    setSuccessMessage(`Lead "${leadName}" registrado no pipeline!`);
    onSuccess?.();
    setTimeout(() => {
      handleClose();
      router.push('/crm/leads');
    }, 1200);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDesc || !payAmount) return;

    const tenant = databaseStore.getTenant();
    databaseStore.createReceivable({
      tenantId: tenant.id,
      customerId: 'cli-001',
      customerName: payCustomer || 'Cliente Diversos',
      description: payDesc,
      amount: parseFloat(payAmount) || 0,
      paidAmount: parseFloat(payAmount) || 0,
      dueDate: new Date().toISOString(),
      paymentMethod: 'pix',
      status: 'pago',
      paidAt: new Date().toISOString(),
    });

    setSuccessMessage(`Recebimento de R$ ${payAmount} registrado com sucesso!`);
    onSuccess?.();
    setTimeout(() => {
      handleClose();
      router.push('/financeiro/contas-receber');
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        activeTab === 'menu'
          ? 'Novo Registro Rápido'
          : activeTab === 'customer'
          ? 'Cadastrar Novo Cliente'
          : activeTab === 'lead'
          ? 'Cadastrar Novo Lead'
          : 'Registrar Novo Pagamento'
      }
      description={
        activeTab === 'menu'
          ? 'Selecione uma das opções abaixo para criar diretamente no sistema:'
          : undefined
      }
    >
      {successMessage ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <p className="text-base font-medium text-slate-800">{successMessage}</p>
        </div>
      ) : activeTab === 'menu' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <button
            onClick={() => setActiveTab('customer')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                Novo Cliente
              </p>
              <p className="text-xs text-slate-500">Pessoa física ou jurídica</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('lead')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600">
                Novo Lead
              </p>
              <p className="text-xs text-slate-500">Entrada no pipeline CRM</p>
            </div>
          </button>

          <button
            onClick={() => {
              handleClose();
              router.push('/operacao/orcamentos/novo');
            }}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600">
                Novo Orçamento
              </p>
              <p className="text-xs text-slate-500">Com cálculo automático</p>
            </div>
          </button>

          <button
            onClick={() => {
              handleClose();
              router.push('/operacao/ordens-servico');
            }}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-purple-600">
                Nova Ordem de Serviço
              </p>
              <p className="text-xs text-slate-500">Atribuir linguistas e prazos</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group sm:col-span-2"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600">
                Registrar Pagamento / Recebimento
              </p>
              <p className="text-xs text-slate-500">Baixa no contas a receber e fluxo de caixa</p>
            </div>
          </button>
        </div>
      ) : activeTab === 'customer' ? (
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={custType === 'PF'}
                onChange={() => setCustType('PF')}
                className="text-blue-600 focus:ring-blue-500"
              />
              Pessoa Física (PF)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={custType === 'PJ'}
                onChange={() => setCustType('PJ')}
                className="text-blue-600 focus:ring-blue-500"
              />
              Pessoa Jurídica (PJ)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {custType === 'PF' ? 'Nome Completo' : 'Razão Social / Nome da Empresa'} *
            </label>
            <input
              type="text"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Ex: Carlos Albuquerque"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="ghost" onClick={() => setActiveTab('menu')}>
              Voltar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Cliente
            </Button>
          </div>
        </form>
      ) : activeTab === 'lead' ? (
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Contato / Lead *
            </label>
            <input
              type="text"
              required
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Ex: Ana Clara Martins"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="ana@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="(11) 98888-7777"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Serviço de Interesse
            </label>
            <select
              value={leadService}
              onChange={(e) => setLeadService(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Tradução Juramentada">Tradução Juramentada</option>
              <option value="Tradução Certificada">Tradução Certificada</option>
              <option value="Tradução Técnica">Tradução Técnica</option>
              <option value="Apostilamento de Haia">Apostilamento de Haia</option>
              <option value="Revisão de Tradução">Revisão de Tradução</option>
            </select>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="ghost" onClick={() => setActiveTab('menu')}>
              Voltar
            </Button>
            <Button type="submit" variant="success">
              Adicionar ao Pipeline
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição do Recebimento *
            </label>
            <input
              type="text"
              required
              value={payDesc}
              onChange={(e) => setPayDesc(e.target.value)}
              placeholder="Ex: Pagamento 50% entrada tradução juramentada"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Ex: 950.00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={payCustomer}
                onChange={(e) => setPayCustomer(e.target.value)}
                placeholder="Ex: Dr. Roberto Alencar"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="ghost" onClick={() => setActiveTab('menu')}>
              Voltar
            </Button>
            <Button type="submit" variant="success">
              Confirmar Pagamento
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
