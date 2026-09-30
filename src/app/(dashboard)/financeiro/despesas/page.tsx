'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { Expense, PaymentMethod } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DespesasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<Expense['category']>('marketing');
  const [amount, setAmount] = useState('450.00');
  const [method, setMethod] = useState<PaymentMethod>('cartao_credito');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const expenses = databaseStore.getExpenses().filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.description.toLowerCase().includes(term) ||
      e.category.toLowerCase().includes(term)
    );
  });

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createExpense({
      tenantId: tenant.id,
      description: desc,
      category,
      amount: parseFloat(amount) || 0,
      date: new Date(date).toISOString(),
      paymentMethod: method,
    });

    setIsModalOpen(false);
    setDesc('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" /> Despesas Operacionais
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Classificação de despesas fixas, variáveis, ferramentas de tradução e marketing.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" /> Nova Despesa
        </Button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Total de Despesas Lançadas
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
          {expenses.length} lançamentos registrados
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por descrição, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Forma de Pagamento</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{exp.description}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 capitalize">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 uppercase font-medium">
                    {exp.paymentMethod}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                    -{formatCurrency(exp.amount)}
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
        title="Lançar Nova Despesa"
        description="Registre uma despesa com categoria e forma de liquidação."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex: Assinatura de software de tradução CAT Tool"
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
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="marketing">Marketing / Ads</option>
                <option value="software">Software / Infra</option>
                <option value="contabilidade">Contabilidade</option>
                <option value="salarios">Salários / Pró-labore</option>
                <option value="impostos">Impostos</option>
                <option value="aluguel">Aluguel / Escritório</option>
                <option value="internet">Internet / Telefonia</option>
                <option value="outros">Outros</option>
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
                Forma de Pagamento
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Data de Pagamento
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Despesa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
