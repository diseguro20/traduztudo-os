'use client';

import React, { useState, useEffect } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { databaseStore } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function FluxoCaixaPage() {
  const [period, setPeriod] = useState<'mes' | 'semana' | 'ano'>('mes');
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const receivables = databaseStore.getReceivables();
  const payables = databaseStore.getPayables();
  const expenses = databaseStore.getExpenses();

  const totalIn = receivables
    .filter((r) => r.status === 'pago')
    .reduce((acc, curr) => acc + curr.paidAmount, 0);

  const totalOut =
    payables.filter((p) => p.status === 'pago').reduce((acc, curr) => acc + curr.amount, 0) +
    expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIn - totalOut;

  // Chart data
  const cashFlowData = [
    { period: 'Sem 1', entradas: 8500, saidas: 3200, saldo: 5300 },
    { period: 'Sem 2', entradas: 12400, saidas: 4800, saldo: 7600 },
    { period: 'Sem 3', entradas: 9800, saidas: 5100, saldo: 4700 },
    { period: 'Sem 4', entradas: 14200, saidas: 6200, saldo: 8000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Fluxo de Caixa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Acompanhe a liquidez da empresa, entradas liquidadas, custos com tradutores e saldo operacional.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center text-xs shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setPeriod('semana')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              period === 'semana' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod('mes')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              period === 'mes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod('ano')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              period === 'ano' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* KPI Cards: Entradas, Saídas, Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Entradas (Receitas)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{formatCurrency(totalIn)}</p>
          <p className="text-xs text-slate-500">Pagamentos confirmados de clientes</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Saídas (Custos/Despesas)</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-600">{formatCurrency(totalOut)}</p>
          <p className="text-xs text-slate-500">Honorários, cartórios e despesas</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Saldo Líquido</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(netBalance)}</p>
          <p className="text-xs text-emerald-600 font-medium">Margem operacional positiva</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Comparativo de Entradas vs. Saídas por Período
          </h3>
          <p className="text-xs text-slate-500">
            Visão consolidada de movimentação financeira no período selecionado.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saldo" name="Saldo Líquido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
