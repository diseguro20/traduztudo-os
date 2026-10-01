'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  FileCheck2,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { databaseStore } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function RelatoriosPage() {
  const [reportType, setReportType] = useState<'faturamento' | 'servicos' | 'tradutores'>('faturamento');
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const receivables = databaseStore.getReceivables();
  const payables = databaseStore.getPayables();
  const expenses = databaseStore.getExpenses();
  const workOrders = databaseStore.getWorkOrders();
  const translators = databaseStore.getTranslators();

  const totalRevenue = receivables
    .filter((r) => r.status === 'pago')
    .reduce((acc, curr) => acc + curr.paidAmount, 0);

  const totalCosts =
    payables.filter((p) => p.status === 'pago').reduce((acc, curr) => acc + curr.amount, 0) +
    expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const estimatedProfit = totalRevenue - totalCosts;

  // Revenue by service report data
  const servicesReportData = [
    { name: 'Tradução Juramentada', total: 18900, pedidos: 14 },
    { name: 'Tradução Técnica', total: 12400, pedidos: 8 },
    { name: 'Tradução Certificada', total: 7600, pedidos: 6 },
    { name: 'Apostilamento de Haia', total: 4500, pedidos: 9 },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Servico,Faturamento,Pedidos', ...servicesReportData.map((s) => `"${s.name}",${s.total},${s.pedidos}`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_traduztudo_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Relatórios & Inteligência Operacional
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Métricas de faturamento, rentabilidade estimada, produtividade e volumes por idioma.
          </p>
        </div>

        <Button onClick={handleExportCSV} variant="outline" className="gap-2 shadow-xs">
          <Download className="w-4 h-4" /> Exportar Relatório (CSV)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Receita Bruta Liquidada</span>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-emerald-600 font-medium">+14.2% comparado ao trimestre anterior</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Custos & Honorários</span>
          <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalCosts)}</p>
          <p className="text-xs text-slate-500">Linguistas, ferramentas e fornecedores</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Lucro Operacional Estimado</span>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(estimatedProfit)}</p>
          <p className="text-xs text-emerald-600 font-medium">Margem líquida de ~65%</p>
        </div>
      </div>

      {/* Report Switcher & Visuals */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('faturamento')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                reportType === 'faturamento'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Faturamento por Serviço
            </button>
            <button
              onClick={() => setReportType('tradutores')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                reportType === 'tradutores'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Produtividade Linguistas
            </button>
          </div>
        </div>

        {reportType === 'faturamento' ? (
          <div className="space-y-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesReportData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Faturamento']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" name="Faturamento" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Linha de Serviço</th>
                    <th className="px-4 py-3 text-center">Quantidade de Ordens</th>
                    <th className="px-4 py-3 text-right">Faturamento Consolidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {servicesReportData.map((s) => (
                    <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 text-center font-medium">{s.pedidos} pedidos</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(s.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Linguista</th>
                  <th className="px-4 py-3">Contratação</th>
                  <th className="px-4 py-3 text-center">Ordens Ativas</th>
                  <th className="px-4 py-3 text-center">Ordens Entregues</th>
                  <th className="px-4 py-3 text-right">Honorários Pagos / Pendentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {translators.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{t.name}</td>
                    <td className="px-4 py-3 text-xs uppercase font-medium">{t.contractType}</td>
                    <td className="px-4 py-3 text-center font-bold text-purple-700">
                      {t.assignedOrdersCount}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">
                      {t.completedOrdersCount}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(t.pendingPaymentAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
