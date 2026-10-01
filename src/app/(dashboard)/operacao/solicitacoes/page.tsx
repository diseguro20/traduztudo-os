'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Search,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  Globe,
  Clock,
  CheckCircle2,
  Mail,
  Phone,
  Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { InboundRequest } from '@/types';
import { formatDate } from '@/lib/utils';

export default function SolicitacoesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceName, setServiceName] = useState('Tradução Juramentada');
  const [sourceLang, setSourceLang] = useState('Português');
  const [targetLang, setTargetLang] = useState('Inglês');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [notes, setNotes] = useState('');

  const requests = databaseStore.getRequests().filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.serviceName.toLowerCase().includes(term)
    );
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = databaseStore.getTenant();

    databaseStore.createRequest({
      tenantId: tenant.id,
      customerName,
      email,
      phone,
      whatsapp: phone,
      serviceName,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      estimatedVolume,
      notes,
      origin: 'Entrada Manual',
      status: 'nova',
    });

    setIsModalOpen(false);
    setRefresh((r) => r + 1);
  };

  const handleConvertToQuote = (req: InboundRequest) => {
    // 1-Click Convert to Quote: Redirects to Quote builder with pre-filled state!
    const query = new URLSearchParams({
      nome: req.customerName,
      email: req.email,
      telefone: req.phone,
      servico: req.serviceName,
      origem: req.sourceLanguage,
      destino: req.targetLanguage,
      obs: req.notes || '',
      solicitacaoId: req.id,
    });
    databaseStore.updateRequestStatus(req.id, 'convertida');
    router.push(`/operacao/orcamentos/novo?${query.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-blue-600" /> Solicitações de Orçamento
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Solicitações inbound recebidas pelo site TraduzTudo (https://traduztudo.vercel.app/) ou canais digitais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" /> Simular Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Integration Info Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold">Endpoint de Integração do Site Oficial Ativo:</p>
            <p className="text-blue-700 font-mono text-[11px] mt-0.5">
              POST /api/public/requests (Autenticação via header x-api-key)
            </p>
          </div>
        </div>
        <Link
          href="/configuracoes/integracoes"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
        >
          Ver Documentação da API →
        </Link>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar solicitações por nome, e-mail, serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-slate-500">
            Total: <strong>{requests.length}</strong> solicitações
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Serviço Solicitado</th>
                <th className="px-4 py-3">Par de Idiomas</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    Nenhuma solicitação pendente no momento.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {req.customerName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {req.email}
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {req.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-800">
                      {req.serviceName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {req.sourceLanguage} → {req.targetLanguage}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{req.origin}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {req.status !== 'convertida' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleConvertToQuote(req)}
                          className="text-xs gap-1.5"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Gerar Orçamento
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Orçamento Gerado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Solicitação */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Simular Nova Solicitação de Orçamento"
        description="Simula o envio de um formulário preenchido por um cliente no site."
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: Dra. Juliana Paes"
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
                placeholder="(11) 98888-7777"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Serviço
              </label>
              <select
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Tradução Juramentada">Tradução Juramentada</option>
                <option value="Tradução Certificada">Tradução Certificada</option>
                <option value="Tradução Técnica">Tradução Técnica</option>
                <option value="Apostilamento de Haia">Apostilamento de Haia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Idioma Origem
              </label>
              <input
                type="text"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Idioma Destino
              </label>
              <input
                type="text"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações e Documentos Enviados
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Anexou certidão de nascimento com 2 laudas..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Cadastrar Solicitação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
