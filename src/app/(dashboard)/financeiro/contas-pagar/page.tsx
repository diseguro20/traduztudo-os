'use client';

import React, { useState } from 'react';
import {
  ArrowUpCircle,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ContasPagarPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const [recipientName, setRecipientName] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('576.00');
  const [category, setCategory] = useState('tradutores');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const payables = databaseStore.getPayables().filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.recipientName.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });

  const totalPaid = payables
    .filter((p) => p.status === 'pago')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPending = payables
    .filter((p) => p.status === 'pendente')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleMarkPaid = (id: string) => {
    databaseStore.markPayablePaid(id);
    setRefresh((r) => r + 1);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !desc) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createPayable({
      tenantId: tenant.id,
      recipientType: category === 'tradutores' ? 'tradutor' : 'fornecedor',
      recipientName,
      description: desc,
      category,
      amount: parseFloat(amount) || 0,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pendente',
    });

    setIsModalOpen(false);
    setRecipientName('');
    setDesc('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-rose-600" /> Contas a Pagar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Controle de honorários de tradutores, taxas cartorárias, infraestrutura e custos operacionais.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs bg-rose-600 hover:bg-rose-700">
          <Plus className="w-4 h-4" /> Nova Conta a Pagar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Quitado</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">A Liquidar</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Títulos Cadastrados</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{payables.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por favorecido, categoria, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Favorecido / Beneficiário</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payables.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">
                    {pay.recipientName}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{pay.description}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      {pay.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{formatDate(pay.dueDate)}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {formatCurrency(pay.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={pay.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {pay.status !== 'pago' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPaid(pay.id)}
                          className="text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Baixar Pagamento
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a conta a pagar para "${pay.recipientName}"?`)) {
                            databaseStore.deletePayable(pay.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir conta a pagar"
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Conta a Pagar"
        description="Lance uma obrigação financeira para pagamento futuro."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Favorecido / Fornecedor *
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ex: Lucas Andrade (Tradutor) ou Cartório do 14º Tabelionato"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Descrição do Custo *
            </label>
            <input
              type="text"
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex: Honorários tradução OS-000001"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="tradutores">Tradutores</option>
                <option value="revisores">Revisores</option>
                <option value="software">Software / Infra</option>
                <option value="marketing">Marketing</option>
                <option value="impostos">Impostos</option>
                <option value="outros">Outros / Cartório</option>
              </select>
            </div>
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700">
              Registrar Conta a Pagar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
