'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  FileCheck2,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  Lock,
  Phone,
  Mail,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { formatCurrency, formatDate, formatDocument } from '@/lib/utils';
import { TraduzTudoLogo } from '@/components/ui/TraduzTudoLogo';

export default function PublicQuoteApprovalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedOrderCode, setApprovedOrderCode] = useState<string | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejected, setIsRejected] = useState(false);

  const quote = databaseStore.getQuoteByToken(token);
  const tenant = databaseStore.getTenant();

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Orçamento não localizado</h1>
          <p className="text-sm text-slate-500">
            Este link de orçamento expirou ou é inválido. Por favor, entre em contato com nossa equipe.
          </p>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch('/api/quotes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        setIsApproved(true);
        setApprovedOrderCode(data.workOrder?.code || 'OS Gerada');
      } else {
        alert(data.error || 'Erro ao processar aprovação.');
      }
    } catch (e) {
      // Fallback direct store call
      const direct = databaseStore.approveQuote(token, '189.40.72.115');
      if (direct) {
        setIsApproved(true);
        setApprovedOrderCode(direct.workOrder.code);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/quotes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'reject', reason: rejectReason }),
      });
      setIsRejected(true);
      setIsRejectModalOpen(false);
    } catch {
      databaseStore.rejectQuote(token, rejectReason);
      setIsRejected(true);
      setIsRejectModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Brand Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:px-6 sm:py-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <TraduzTudoLogo variant="icon" size="md" className="drop-shadow-sm" />
            <div>
              <p className="font-bold text-slate-900 leading-tight">TraduzTudo</p>
              <p className="text-xs text-slate-500">Traduções Juramentadas e Certificadas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Ambiente Seguro de Aprovação Digital</span>
          </div>
        </div>

        {/* Approval Success Banner */}
        {isApproved || quote.status === 'aprovado' ? (
          <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-200 shrink-0" />
              <div>
                <h2 className="text-lg font-bold">Orçamento Aprovado com Sucesso!</h2>
                <p className="text-xs text-emerald-100">
                  Ordem de Serviço <strong>{approvedOrderCode || quote.workOrderId || 'OS Ativa'}</strong> gerada automaticamente.
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed pt-2 border-t border-emerald-500/60">
              Nossa equipe operacional já iniciou os preparativos. Você receberá atualizações em tempo real pelo seu e-mail e WhatsApp cadastrados.
            </p>
          </div>
        ) : isRejected || quote.status === 'recusado' ? (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-rose-900 text-center space-y-2">
            <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold">Proposta Recusada</h2>
            <p className="text-xs text-rose-600">
              Agradecemos sua atenção. Nossa equipe entrará em contato caso necessite de condições especiais.
            </p>
          </div>
        ) : null}

        {/* Main Quote Sheet Document */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                PROPOSTA COMERCIAL {quote.code}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                Orçamento de Serviços de Tradução
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Emitido em: {formatDate(quote.issueDate)} • Validade: {formatDate(quote.expirationDate)}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-900">{tenant.name}</p>
              <p>CNPJ: {tenant.document}</p>
              <p>{tenant.email} • {tenant.phone}</p>
              <p>{tenant.address?.street}, {tenant.address?.number} - {tenant.address?.city}/{tenant.address?.state}</p>
            </div>
          </div>

          {/* Client Details Box */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Dados do Contratante
              </p>
              <p className="text-sm font-bold text-slate-900 mt-1">{quote.customerName}</p>
              {quote.customerDocument && (
                <p className="text-slate-600 mt-0.5">CPF/CNPJ: {formatDocument(quote.customerDocument)}</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Contato Registrado
              </p>
              <p className="text-slate-700 mt-1 break-all">{quote.customerEmail}</p>
              <p className="text-slate-700">{quote.customerPhone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detalhamento dos Serviços
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Serviço / Descrição</th>
                    <th className="px-4 py-3 text-center">Idiomas</th>
                    <th className="px-4 py-3 text-center">Qtd / Unidade</th>
                    <th className="px-4 py-3 text-right">Valor Unit.</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{item.serviceName}</p>
                        <p className="text-slate-500 mt-0.5">{item.description}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-600">
                        {item.sourceLanguage} → {item.targetLanguage}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms, Conditions, Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" /> Prazo de Entrega Estimado:
                </p>
                <p className="mt-1">
                  <strong>{quote.estimatedDeliveryDays} dias úteis</strong> após aprovação e confirmação dos documentos originais legíveis.
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-800">Condições de Faturamento:</p>
                <p className="mt-1">{quote.conditions}</p>
              </div>

              {quote.notes && (
                <div>
                  <p className="font-bold text-slate-800">Observações:</p>
                  <p className="mt-1">{quote.notes}</p>
                </div>
              )}
            </div>

            {/* Total Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto Especial:</span>
                  <span className="font-semibold">-{formatCurrency(quote.discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Valor Total:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {quote.status !== 'aprovado' && !isApproved && quote.status !== 'recusado' && !isRejected && (
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors"
              >
                Não tenho interesse / Recusar Orçamento
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleApprove}
                  isLoading={isApproving}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 text-sm shadow-md gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> APROVAR ORÇAMENTO
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Documento gerado pelo sistema TraduzTudo OS. Dúvidas? Fale conosco pelo telefone {tenant.phone} ou WhatsApp {tenant.whatsapp}.
        </p>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Recusar Orçamento"
        description="Por favor, nos informe o motivo para que possamos melhorar nossos serviços."
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Motivo da Recusa (opcional)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Prazo muito longo, valor acima do orçamento, desisti da viagem..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsRejectModalOpen(false)}>
              Voltar
            </Button>
            <Button type="submit" variant="danger" className="w-full sm:w-auto">
              Confirmar Recusa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
