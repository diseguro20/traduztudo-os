'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileCheck2,
  Calendar,
  Clock,
  User,
  Languages,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  CheckSquare,
  MessageSquare,
  History,
  Upload,
  Download,
  Trash2,
  Send,
  Plus,
  ShieldCheck,
  Building,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { DocumentCategory, OrderTask, WorkOrderStatus } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function WorkOrderDossierPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [, setRefresh] = useState(0);

  const [activeTab, setActiveTab] = useState<
    'resumo' | 'documentos' | 'tarefas' | 'traducao' | 'revisao' | 'financeiro' | 'comunicacao' | 'historico'
  >('resumo');

  // Document Upload Modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('traducao');

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Mariana Costa');

  // Communication message state
  const [chatMessage, setChatMessage] = useState('');
  const [messageSuccess, setMessageSuccess] = useState(false);

  const order = databaseStore.getWorkOrderById(id);

  if (!order) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Ordem de Serviço não encontrada</h2>
        <p className="text-sm text-slate-500">
          A ordem solicitada não existe ou foi removida.
        </p>
        <Link href="/operacao/ordens-servico">
          <Button variant="outline">Voltar para Ordens de Serviço</Button>
        </Link>
      </div>
    );
  }

  // Linked items
  const documents = databaseStore.getDocuments(order.id);
  const tasks = databaseStore.getTasks(order.id);
  const receivables = databaseStore.getReceivables().filter((r) => r.workOrderId === order.id);
  const translators = databaseStore.getTranslators();
  const reviewers = databaseStore.getReviewers();

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    databaseStore.updateWorkOrder(order.id, { status: newStatus });
    databaseStore.logAudit(
      'Mariana Costa',
      'Alteração de Status da OS',
      'WorkOrder',
      order.id,
      `Alterou o status da OS ${order.code} de "${order.status}" para "${newStatus}"`
    );
    setRefresh((r) => r + 1);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    databaseStore.createDocument({
      tenantId: order.tenantId,
      workOrderId: order.id,
      customerId: order.customerId,
      name: docName.endsWith('.pdf') || docName.endsWith('.docx') ? docName : `${docName}.pdf`,
      category: docCategory,
      fileUrl: `/uploads/${docName.toLowerCase().replace(/\s+/g, '_')}`,
      fileSize: 1024 * 1024 * 2.5,
      fileType: 'application/pdf',
      uploaderUserId: 'user-mariana',
      uploaderName: 'Mariana Costa',
    });

    setIsDocModalOpen(false);
    setDocName('');
    setRefresh((r) => r + 1);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    databaseStore.createTask({
      tenantId: order.tenantId,
      workOrderId: order.id,
      title: taskTitle,
      assignedToName: taskAssignee,
      dueDate: order.deadline,
      priority: order.priority,
      status: 'a_fazer',
    });

    setIsTaskModalOpen(false);
    setTaskTitle('');
    setRefresh((r) => r + 1);
  };

  const handleToggleTaskStatus = (task: OrderTask) => {
    const nextStatus = task.status === 'concluida' ? 'a_fazer' : 'concluida';
    databaseStore.updateTask(task.id, {
      status: nextStatus,
      completedAt: nextStatus === 'concluida' ? new Date().toISOString() : undefined,
    });
    setRefresh((r) => r + 1);
  };

  const handleSendClientMessage = (channel: 'whatsapp' | 'email') => {
    if (!chatMessage) return;
    setMessageSuccess(true);
    setTimeout(() => {
      setMessageSuccess(false);
      setChatMessage('');
    }, 2500);
  };

  const handleMarkPaymentReceived = (recId: string) => {
    databaseStore.markReceivablePaid(recId);
    setRefresh((r) => r + 1);
  };

  // Timeline progression state calculation
  const timelineSteps = [
    { title: 'Solicitação recebida', status: 'completed' },
    { title: 'Orçamento aprovado', status: 'completed' },
    {
      title: 'Pagamento de entrada',
      status: order.paymentStatus === 'pago' || order.paidAmount > 0 ? 'completed' : 'pending',
    },
    {
      title: 'Documentos recebidos',
      status:
        order.status !== 'aguardando_documentos' ? 'completed' : 'pending',
    },
    {
      title: 'Tradução em andamento',
      status:
        order.status === 'em_traducao'
          ? 'active'
          : ['em_revisao', 'correcao', 'finalizacao', 'pronto', 'entregue'].includes(order.status)
          ? 'completed'
          : 'pending',
    },
    {
      title: 'Revisão linguística',
      status:
        order.status === 'em_revisao'
          ? 'active'
          : ['correcao', 'finalizacao', 'pronto', 'entregue'].includes(order.status)
          ? 'completed'
          : 'pending',
    },
    {
      title: 'Finalização & Certificação',
      status:
        order.status === 'finalizacao' || order.status === 'pronto'
          ? 'active'
          : order.status === 'entregue'
          ? 'completed'
          : 'pending',
    },
    {
      title: 'Entrega final ao cliente',
      status: order.status === 'entregue' ? 'completed' : 'pending',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/operacao/ordens-servico"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Ordens de Serviço
        </Link>

        {/* Change status quick dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Status Operacional:</span>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value as WorkOrderStatus)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-900 cursor-pointer shadow-2xs"
          >
            <option value="aguardando_documentos">Aguardando Documentos</option>
            <option value="documentos_recebidos">Documentos Recebidos</option>
            <option value="em_traducao">Em Tradução</option>
            <option value="em_revisao">Em Revisão</option>
            <option value="correcao">Correção Solicitada</option>
            <option value="finalizacao">Finalização</option>
            <option value="pronto">Pronto para Entrega</option>
            <option value="entregue">Entregue / Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                {order.code}
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                {order.serviceName}
              </h1>
              <PriorityBadge priority={order.priority} />
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-500">
              Cliente:{' '}
              <Link
                href={`/crm/clientes/${order.customerId}`}
                className="font-semibold text-blue-600 hover:underline"
              >
                {order.customerName}
              </Link>{' '}
              • Idiomas:{' '}
              <strong className="text-slate-700">
                {order.sourceLanguage} → {order.targetLanguage}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Prazo de Entrega</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                {formatDate(order.deadline)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Valor Total</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {formatCurrency(order.amount)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Financeiro</p>
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </div>

        {/* Responsible Staff Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-medium">Responsável Interno:</span>{' '}
            <strong className="text-slate-800">{order.assignedUserName}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Tradutor Designado:</span>{' '}
            <strong className="text-slate-800">{order.translatorName || 'Aguardando Atribuição'}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Revisor Designado:</span>{' '}
            <strong className="text-slate-800">{order.reviewerName || 'Aguardando Atribuição'}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tabs (2/3) + Right Visual Timeline (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Tabs & Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dossier Tabs Navigation */}
          <div className="border-b border-slate-200 flex gap-4 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'resumo', label: 'Resumo' },
              { id: 'documentos', label: `Documentos (${documents.length})` },
              { id: 'tarefas', label: `Tarefas (${tasks.length})` },
              { id: 'traducao', label: 'Tradução' },
              { id: 'revisao', label: 'Revisão' },
              { id: 'financeiro', label: 'Financeiro' },
              { id: 'comunicacao', label: 'Comunicação' },
              { id: 'historico', label: 'Histórico' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 px-1 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: RESUMO */}
          {activeTab === 'resumo' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Instruções e Observações do Pedido
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {order.notes || 'Nenhuma instrução adicional registrada.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2 text-xs">
                  <p className="font-bold text-slate-800">Contrato / Orçamento Vinculado</p>
                  <p className="text-slate-600">
                    Proposta:{' '}
                    <strong className="text-amber-700">{order.quoteCode || 'ORC-000001'}</strong>
                  </p>
                  <p className="text-slate-600">
                    Data de Abertura: {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2 text-xs">
                  <p className="font-bold text-slate-800">Dados do Cliente</p>
                  <p className="text-slate-600">E-mail: {order.customerEmail}</p>
                  <p className="text-slate-600">Telefone: {order.customerPhone}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Gerenciador de Documentos e Versões
                  </h3>
                  <p className="text-xs text-slate-500">
                    Arquivos originais, de trabalho, revisões e entregas finais certificadas.
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsDocModalOpen(true)} className="gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" /> Enviar Arquivo
                </Button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{doc.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Categoria: <span className="font-medium text-slate-700">{doc.category}</span> • Enviado por {doc.uploaderName} • {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        download
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TAREFAS */}
          {activeTab === 'tarefas' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Checklist & Tarefas da Ordem de Serviço
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controle de etapas obrigatórias antes da entrega ao cliente.
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsTaskModalOpen(true)} className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Nova Tarefa
                </Button>
              </div>

              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTaskStatus(task)}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      task.status === 'concluida'
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'concluida'}
                        onChange={() => {}}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] shrink-0">
                      <span className="text-slate-500">Resp: {task.assignedToName}</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TRADUÇÃO */}
          {activeTab === 'traducao' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Área de Trabalho do Tradutor
              </h3>
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-2">
                <p className="font-bold">Tradutor Responsável: {order.translatorName || 'Não Atribuído'}</p>
                <p>Status: {order.status === 'em_traducao' ? 'Em Produção Ativa' : 'Aguardando / Concluído'}</p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('em_traducao')}
                  className="text-xs bg-purple-600 hover:bg-purple-700"
                >
                  Marcar em Tradução
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('em_revisao')}
                  className="text-xs"
                >
                  Enviar para Revisão
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: REVISÃO */}
          {activeTab === 'revisao' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Fila de Revisão Linguística & Notarial
              </h3>
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 space-y-2">
                <p className="font-bold">Revisor Responsável: {order.reviewerName || 'Não Atribuído'}</p>
                <p>O revisor deve conferir fidelidade, nomes próprios, datas e números carimbados.</p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('pronto')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar Revisão (Pronto)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('correcao')}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Solicitar Correção ao Tradutor
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: FINANCEIRO */}
          {activeTab === 'financeiro' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lançamentos Financeiros da Ordem de Serviço
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {receivables.map((rec) => (
                  <div key={rec.id} className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{rec.description}</p>
                      <p className="text-[11px] text-slate-500">
                        Vencimento: {formatDate(rec.dueDate)} • Método: {rec.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <StatusBadge status={rec.status} />
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {formatCurrency(rec.amount)}
                        </p>
                      </div>
                      {rec.status !== 'pago' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPaymentReceived(rec.id)}
                          className="text-xs text-emerald-600 hover:bg-emerald-50"
                        >
                          Confirmar Pagamento
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: COMUNICAÇÃO */}
          {activeTab === 'comunicacao' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Envio de Mensagens ao Cliente (WhatsApp / E-mail)
              </h3>

              {messageSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mensagem transmitida com sucesso para o cliente!
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={`Olá ${order.customerName}, sua tradução ${order.code} está em fase de revisão...`}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setChatMessage(
                          `Olá ${order.customerName}, confirmamos que sua tradução juramentada ${order.code} está pronta para entrega!`
                        )
                      }
                      className="text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md"
                    >
                      Template: Tradução Pronta
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSendClientMessage('whatsapp')}
                      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Enviar WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendClientMessage('email')}
                      className="gap-1.5 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar E-mail
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: HISTÓRICO */}
          {activeTab === 'historico' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Auditoria e Histórico de Eventos
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Ordem de Serviço criada</p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-purple-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Linguista {order.translatorName || 'Lucas Andrade'} atribuído
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Progression Timeline (1 Col) as requested in Section 17 */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> Linha de Progresso da OS
            </h3>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      step.status === 'completed'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : step.status === 'active'
                        ? 'bg-purple-600 text-white ring-4 ring-purple-100 animate-pulse'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {step.status === 'completed' ? '✓' : step.status === 'active' ? '●' : '○'}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        step.status === 'completed'
                          ? 'text-slate-900'
                          : step.status === 'active'
                          ? 'text-purple-700 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Ações Rápidas do Dossiê
            </h4>
            <div className="space-y-2">
              <Button
                variant="primary"
                onClick={() => handleStatusChange('entregue')}
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Marcar como Entregue
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDocModalOpen(true)}
                className="w-full text-xs text-slate-200 border-slate-700 hover:bg-slate-800"
              >
                + Anexar Documento Final
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Enviar Documento para a OS"
        description="Envie arquivos originais, minutas ou versões finais traduzidas e certificadas."
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome do Documento *
            </label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Ex: Traducao_Juramentada_Diploma_Final.pdf"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Categoria
            </label>
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="original">Original</option>
              <option value="trabalho">Arquivo de Trabalho</option>
              <option value="traducao">Tradução</option>
              <option value="revisao">Revisão</option>
              <option value="final">Final Certificado</option>
              <option value="comprovante">Comprovante</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDocModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Documento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Adicionar Tarefa na OS"
        description="Defina uma ação operacional com prazo e responsável."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Título da Tarefa *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Ex: Assinatura digital ICP-Brasil e carimbo"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Responsável
            </label>
            <input
              type="text"
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Criar Tarefa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
