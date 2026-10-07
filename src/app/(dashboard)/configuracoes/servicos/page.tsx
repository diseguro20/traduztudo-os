'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Languages, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { BillingUnit } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ServicosIdiomasPage() {
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const services = databaseStore.getServices();
  const languages = databaseStore.getLanguages();

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Service form
  const [srvName, setSrvName] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvUnit, setSrvUnit] = useState<BillingUnit>('lauda');
  const [srvPrice, setSrvPrice] = useState('95.00');
  const [srvTurnaround, setSrvTurnaround] = useState('3');

  // Lang form
  const [langCode, setLangCode] = useState('');
  const [langName, setLangName] = useState('');

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvName) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createService({
      tenantId: tenant.id,
      name: srvName,
      code: srvName.toLowerCase().replace(/\s+/g, '_'),
      description: srvDesc,
      unit: srvUnit,
      defaultPrice: parseFloat(srvPrice) || 0,
      defaultTurnaroundDays: parseInt(srvTurnaround) || 2,
      active: true,
    });

    setIsServiceModalOpen(false);
    setSrvName('');
    setSrvDesc('');
    setRefresh((r) => r + 1);
  };

  const handleCreateLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!langName || !langCode) return;
    databaseStore.createLanguage(langCode.toLowerCase(), langName);
    setIsLangModalOpen(false);
    setLangCode('');
    setLangName('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Serviços & Idiomas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tabela de preços base, prazos médios de entrega e pares de idiomas atendidos pela TraduzTudo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={() => setIsLangModalOpen(true)} variant="outline" className="gap-1.5 text-xs">
            <Languages className="w-3.5 h-3.5" /> + Idioma
          </Button>
          <Button onClick={() => setIsServiceModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> + Serviço
          </Button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Catálogo de Serviços Ativos ({services.length})
          </h3>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[700px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Unidade de Cobrança</th>
              <th className="px-4 py-3">Preço Padrão</th>
              <th className="px-4 py-3">Prazo Estimado</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((srv) => (
              <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-bold text-slate-900">{srv.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{srv.description}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                    {srv.unit}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900">
                  {formatCurrency(srv.defaultPrice)}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-700">
                  {srv.defaultTurnaroundDays} dias úteis
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Languages Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-600" /> Idiomas Homologados no Sistema ({languages.length})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {languages.map((l) => (
            <div
              key={l.id}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">{l.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">Código: {l.code}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title="Cadastrar Novo Serviço de Tradução"
        description="Configure nome, unidade de precificação e prazo padrão."
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome do Serviço *
            </label>
            <input
              type="text"
              required
              value={srvName}
              onChange={(e) => setSrvName(e.target.value)}
              placeholder="Ex: Tradução Simultânea / Interpretação"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={srvDesc}
              onChange={(e) => setSrvDesc(e.target.value)}
              placeholder="Finalidade e especificações..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Unidade
              </label>
              <select
                value={srvUnit}
                onChange={(e) => setSrvUnit(e.target.value as BillingUnit)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="lauda">lauda</option>
                <option value="palavra">palavra</option>
                <option value="pagina">página</option>
                <option value="documento">documento</option>
                <option value="hora">hora</option>
                <option value="servico_fechado">serviço fechado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Preço Base (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={srvPrice}
                onChange={(e) => setSrvPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Prazo (Dias)
              </label>
              <input
                type="number"
                value={srvTurnaround}
                onChange={(e) => setSrvTurnaround(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsServiceModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Serviço
            </Button>
          </div>
        </form>
      </Modal>

      {/* Language Modal */}
      <Modal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        title="Adicionar Idioma"
        description="Cadastre um novo idioma para atender em propostas e ordens."
      >
        <form onSubmit={handleCreateLanguage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nome do Idioma *
              </label>
              <input
                type="text"
                required
                value={langName}
                onChange={(e) => setLangName(e.target.value)}
                placeholder="Ex: Russo"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Código ISO (2 letras) *
              </label>
              <input
                type="text"
                required
                maxLength={3}
                value={langCode}
                onChange={(e) => setLangCode(e.target.value)}
                placeholder="Ex: ru"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsLangModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Adicionar Idioma
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
