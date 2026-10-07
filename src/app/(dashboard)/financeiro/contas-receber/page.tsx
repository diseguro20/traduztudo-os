'use client';

import React, { useState } from 'react';
import {
  ArrowDownCircle,
  Plus,
  Search,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { PaymentMethod } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ContasReceberPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  // Form
  const customers = databaseStore.getCustomers();
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('950.00');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentMethod>('pix');

  // Edit Form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecId, setEditRecId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editDueDate, setEditDueDate] = useState('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('pix');
  const [editStatus, setEditStatus] = useState<'pendente' | 'pago' | 'parcial'>('pendente');

  const receivables = databaseStore.getReceivables().filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term) ||
      (r.workOrderCode && r.workOrderCode.toLowerCase().includes(term))
    );
  });

  const totalReceived = receivables
    .filter((r) => r.status === 'pago')
    .reduce((acc, curr) => acc + curr.paidAmount, 0);

  const totalPending = receivables
    .filter((r) => r.status === 'pendente')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleMarkPaid = (id: string, fullAmount: number) => {
    databaseStore.markReceivablePaid(id, fullAmount);
    setRefresh((r) => r + 1);
  };

  const openEditModal = (rec: any) => {
    setEditRecId(rec.id);
    setEditDesc(rec.description);
    setEditAmount(String(rec.amount));
    setEditDueDate(rec.dueDate ? rec.dueDate.split('T')[0] : '');
    setEditMethod(rec.paymentMethod);
    setEditStatus(rec.status);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecId) return;
    const val = parseFloat(editAmount) || 0;
    databaseStore.updateReceivable(editRecId, {
      description: editDesc,
      amount: val,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      paymentMethod: editMethod,
      status: editStatus,
      paidAmount: editStatus === 'pago' ? val : editStatus === 'parcial' ? val * 0.5 : 0,
      paidAt: editStatus === 'pago' ? new Date().toISOString() : undefined,
    });
    setIsEditModalOpen(false);
    setEditRecId(null);
    setRefresh((r) => r + 1);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const tenant = databaseStore.getTenant();

    databaseStore.createReceivable({
      tenantId: tenant.id,
      customerId: cust?.id || 'cli-001',
      customerName: cust?.name || 'Cliente Geral',
      description: desc,
      amount: parseFloat(amount) || 0,
      paidAmount: 0,
      dueDate: new Date(dueDate).toISOString(),
      paymentMethod: method,
      status: 'pendente',
    });

    setIsModalOpen(false);
    setDesc('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 sm:w-6 h-6 text-emerald-600" /> Contas a Receber
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle de cobranças de clientes, entradas via PIX, boletos e conciliação bancária.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs text-xs sm:text-sm self-start sm:self-auto bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Nova Conta a Receber
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Recebido</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Saldo a Receber</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Cobranças Ativas</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{receivables.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 sm:p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, OS, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[850px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cliente / Descrição</th>
                <th className="px-4 py-3">OS Vinculada</th>
                <th className="px-4 py-3">Forma</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receivables.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900">{rec.customerName}</p>
                    <p className="text-xs text-slate-500">{rec.description}</p>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-purple-700">
                    {rec.workOrderCode || '-'}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium uppercase text-slate-700">
                    {rec.paymentMethod}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{formatDate(rec.dueDate)}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {formatCurrency(rec.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rec.status !== 'pago' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPaid(rec.id, rec.amount)}
                          className="text-xs text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Baixar
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar lançamento"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir o recebimento de "${rec.customerName}"?`)) {
                            databaseStore.deleteReceivable(rec.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir recebimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Conta a Receber"
        description="Registre uma cobrança ou título de recebimento para um cliente."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cliente *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Descrição da Cobrança *
            </label>
            <input
              type="text"
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex: Saldo final tradução juramentada"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Data Vencimento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              Salvar Cobrança
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Conta a Receber"
        description="Atualize o valor, vencimento, método de pagamento ou status deste recebimento."
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Descrição da Cobrança *
            </label>
            <input
              type="text"
              required
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Data Vencimento
              </label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={editMethod}
                onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="pago">Quitado / Pago</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
