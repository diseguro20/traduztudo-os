'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileSpreadsheet,
  Calculator,
  User,
  Calendar,
  Clock,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { databaseStore } from '@/lib/db';
import { BillingUnit, QuoteItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function NovoOrcamentoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Carregando elaborador de orçamento...</div>}>
      <NovoOrcamentoContent />
    </Suspense>
  );
}

function NovoOrcamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const customers = databaseStore.getCustomers();
  const services = databaseStore.getServices();
  const nextCode = databaseStore.getNextQuoteCode();

  // URL pre-filled params (if coming from a Lead or Inbound Request)
  const preName = searchParams.get('nome') || '';
  const preEmail = searchParams.get('email') || '';
  const prePhone = searchParams.get('telefone') || '';
  const preService = searchParams.get('servico') || 'Tradução Juramentada';
  const preSourceLang = searchParams.get('origem') || 'Português';
  const preTargetLang = searchParams.get('destino') || 'Inglês';
  const preObs = searchParams.get('obs') || '';
  const preCustomerId = searchParams.get('clienteId') || '';

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState(preCustomerId);
  const [customerName, setCustomerName] = useState(preName);
  const [customerEmail, setCustomerEmail] = useState(preEmail);
  const [customerPhone, setCustomerPhone] = useState(prePhone);
  const [customerDocument, setCustomerDocument] = useState('');

  const [assignedUserName, setAssignedUserName] = useState('Juliana Mendes');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState(3);
  const [conditions, setConditions] = useState(
    'Pagamento em 50% de entrada via PIX e 50% na conclusão das traduções.'
  );
  const [notes, setNotes] = useState(preObs);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Dynamic Quote Items
  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: 'item-1',
      serviceId: services[0]?.id || 'srv-juramentada',
      serviceName: preService || services[0]?.name || 'Tradução Juramentada',
      description: 'Tradução oficial juramentada com fé pública e carimbo notarial',
      sourceLanguage: preSourceLang,
      targetLanguage: preTargetLang,
      quantity: 5,
      unit: 'lauda',
      unitPrice: 95.0,
      discount: 0,
      total: 475.0,
    },
  ]);

  // When customer is selected from dropdown, prefill contact info
  const handleSelectCustomer = (cid: string) => {
    setSelectedCustomerId(cid);
    const found = customers.find((c) => c.id === cid);
    if (found) {
      setCustomerName(found.name);
      setCustomerEmail(found.email);
      setCustomerPhone(found.phone);
      setCustomerDocument(found.cpf || found.cnpj || '');
    }
  };

  // Recalculate item total when quantity, unit price, or discount changes
  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...items];
    const itm = { ...updated[index], [field]: value };

    // If service changed, update default unit and unit price
    if (field === 'serviceId') {
      const srv = services.find((s) => s.id === value);
      if (srv) {
        itm.serviceName = srv.name;
        itm.unit = srv.unit;
        itm.unitPrice = srv.defaultPrice;
      }
    }

    const qty = Number(itm.quantity) || 0;
    const price = Number(itm.unitPrice) || 0;
    const disc = Number(itm.discount) || 0;
    itm.total = Math.max(0, qty * price - disc);

    updated[index] = itm;
    setItems(updated);
  };

  const addItem = () => {
    const defaultSrv = services[0];
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      serviceId: defaultSrv ? defaultSrv.id : 'srv-juramentada',
      serviceName: defaultSrv ? defaultSrv.name : 'Tradução Juramentada',
      description: 'Item adicional de serviço documental',
      sourceLanguage: 'Português',
      targetLanguage: 'Inglês',
      quantity: 1,
      unit: defaultSrv ? defaultSrv.unit : 'lauda',
      unitPrice: defaultSrv ? defaultSrv.defaultPrice : 95.0,
      discount: 0,
      total: defaultSrv ? defaultSrv.defaultPrice : 95.0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Totals calculations
  const subtotal = items.reduce((acc, itm) => acc + (Number(itm.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - Number(globalDiscount || 0));

  const handleSaveQuote = (status: 'rascunho' | 'enviado') => {
    if (!customerName || !customerEmail) {
      alert('Por favor, informe ao menos o nome e o e-mail do cliente.');
      return;
    }

    const tenant = databaseStore.getTenant();

    let targetCustomerId = selectedCustomerId;
    // If not existing customer, create new customer automatically
    if (!targetCustomerId) {
      const newCust = databaseStore.createCustomer({
        tenantId: tenant.id,
        type: 'PF',
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        whatsapp: customerPhone,
        notes: 'Criado automaticamente na elaboração de orçamento.',
      });
      targetCustomerId = newCust.id;
    }

    const created = databaseStore.createQuote({
      tenantId: tenant.id,
      customerId: targetCustomerId,
      customerName,
      customerEmail,
      customerPhone,
      customerDocument,
      assignedUserId: 'user-juliana',
      assignedUserName,
      issueDate: new Date(issueDate).toISOString(),
      expirationDate: new Date(expirationDate).toISOString(),
      estimatedDeliveryDays: Number(estimatedDeliveryDays) || 3,
      items,
      subtotal,
      discount: Number(globalDiscount) || 0,
      additionalCost: 0,
      total: grandTotal,
      conditions,
      notes,
      status,
    });

    alert(
      status === 'enviado'
        ? `Orçamento ${created.code} gerado e enviado para ${customerEmail} com sucesso!`
        : `Orçamento ${created.code} salvo como rascunho!`
    );

    router.push('/operacao/orcamentos');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back */}
      <div className="flex items-center justify-between">
        <Link
          href="/operacao/orcamentos"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Orçamentos
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Próximo Código: {nextCode}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Elaborar Novo Orçamento Comercial
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Adicione serviços, cálculo de laudas/palavras, prazos e condições comerciais personalizadas.
          </p>
        </div>

        {/* Section 1: Customer & Header */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" /> Dados do Cliente & Contato
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selecionar Cliente Cadastrado
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Novo Cliente / Não listado --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Cliente / Empresa *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Dr. Roberto Alencar"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CPF / CNPJ
              </label>
              <input
                type="text"
                value={customerDocument}
                onChange={(e) => setCustomerDocument(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-600" /> Itens e Serviços do Orçamento
            </h2>
            <Button size="sm" variant="outline" onClick={addItem} className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Adicionar Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 relative group"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Serviço
                    </label>
                    <select
                      value={item.serviceId}
                      onChange={(e) => updateItem(idx, 'serviceId', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (R$ {s.defaultPrice.toFixed(2)} / {s.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Idioma Origem
                    </label>
                    <input
                      type="text"
                      value={item.sourceLanguage || ''}
                      onChange={(e) => updateItem(idx, 'sourceLanguage', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Idioma Destino
                    </label>
                    <input
                      type="text"
                      value={item.targetLanguage || ''}
                      onChange={(e) => updateItem(idx, 'targetLanguage', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Descrição Detalhada do Documento
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Ex: Tradução Juramentada de Certidão de Nascimento em Inteiro Teor..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Unidade
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value as BillingUnit)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="lauda">lauda</option>
                      <option value="palavra">palavra</option>
                      <option value="pagina">página</option>
                      <option value="caractere">caractere</option>
                      <option value="documento">documento</option>
                      <option value="servico_fechado">serviço fechado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Preço Unit. (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Desconto (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.discount}
                      onChange={(e) => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Total Item
                    </label>
                    <div className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Delivery, Conditions, Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Validade da Proposta
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prazo Estimado de Execução (dias úteis)
              </label>
              <input
                type="number"
                min="1"
                value={estimatedDeliveryDays}
                onChange={(e) => setEstimatedDeliveryDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condições de Pagamento
              </label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Adicionais
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações visíveis na proposta..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Totals Summary Panel */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Resumo Financeiro da Proposta
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal dos Itens:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Desconto Especial (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-1 text-xs border border-slate-300 rounded text-right font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Total da Proposta:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => handleSaveQuote('enviado')}
                className="w-full bg-amber-600 hover:bg-amber-700 gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4" /> Salvar e Enviar Orçamento
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveQuote('rascunho')}
                className="w-full text-xs"
              >
                Salvar como Rascunho
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
