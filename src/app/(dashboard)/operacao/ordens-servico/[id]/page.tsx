'use client';

import React, { useState, useEffect } from 'react';
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
  Edit3,
  CreditCard,
  Receipt,
  Percent,
  Check,
  RotateCcw,
  FileText,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { DocumentCategory, OrderTask, WorkOrderStatus, PaymentMethod, Priority } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function WorkOrderDossierPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

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

  // --- Entry Payment Modal State ---
  const [isEntryPaymentModalOpen, setIsEntryPaymentModalOpen] = useState(false);
  const [entryPreset, setEntryPreset] = useState<'50' | '30' | '100' | 'custom'>('50');
  const [entryAmount, setEntryAmount] = useState('0');
  const [entryPaymentMethod, setEntryPaymentMethod] = useState<PaymentMethod>('pix');
  const [entryDueDate, setEntryDueDate] = useState('');
  const [isEntryPaid, setIsEntryPaid] = useState(false);
  const [entryPaidAt, setEntryPaidAt] = useState('');
  const [splitRemaining, setSplitRemaining] = useState(true);
  const [remainingDueDate, setRemainingDueDate] = useState('');
  const [remainingMethod, setRemainingMethod] = useState<PaymentMethod>('pix');
  const [paymentNotes, setPaymentNotes] = useState('');

  // --- Edit Order Modal State ---
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [editServiceName, setEditServiceName] = useState('');
  const [editSourceLang, setEditSourceLang] = useState('');
  const [editTargetLang, setEditTargetLang] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('normal');
  const [editDeadline, setEditDeadline] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editStatus, setEditStatus] = useState<WorkOrderStatus>('documentos_recebidos');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pendente' | 'parcial' | 'pago'>('pendente');
  const [editPaidAmount, setEditPaidAmount] = useState('0');
  const [editAssignedUser, setEditAssignedUser] = useState('');
  const [editTranslatorId, setEditTranslatorId] = useState('');
  const [editReviewerId, setEditReviewerId] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // --- Edit Single Receivable Modal State ---
  const [isEditRecModalOpen, setIsEditRecModalOpen] = useState(false);
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('0');
  const [recDueDate, setRecDueDate] = useState('');
  const [recMethod, setRecMethod] = useState<PaymentMethod>('pix');
  const [recStatus, setRecStatus] = useState<'pendente' | 'pago' | 'parcial'>('pendente');

  // --- New Single Receivable Modal State ---
  const [isNewRecModalOpen, setIsNewRecModalOpen] = useState(false);
  const [newRecDesc, setNewRecDesc] = useState('');
  const [newRecAmount, setNewRecAmount] = useState('0');
  const [newRecDueDate, setNewRecDueDate] = useState('');
  const [newRecMethod, setNewRecMethod] = useState<PaymentMethod>('pix');

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

  // --- Handlers for Entry Payment, Order Edit, and Receivables ---
  const openEntryPaymentModal = () => {
    if (!order) return;
    const defaultEntry = order.paidAmount > 0 ? order.paidAmount : order.amount * 0.5;
    setEntryAmount(String(defaultEntry));
    setEntryPreset(defaultEntry === order.amount ? '100' : defaultEntry === order.amount * 0.5 ? '50' : 'custom');
    setEntryPaymentMethod('pix');
    setEntryDueDate(order.deadline ? order.deadline.split('T')[0] : new Date().toISOString().split('T')[0]);
    setIsEntryPaid(order.paymentStatus === 'pago' || order.paidAmount > 0);
    setEntryPaidAt(new Date().toISOString().split('T')[0]);
    setSplitRemaining(defaultEntry < order.amount);
    setRemainingDueDate(order.deadline ? order.deadline.split('T')[0] : new Date().toISOString().split('T')[0]);
    setRemainingMethod('pix');
    setPaymentNotes('');
    setIsEntryPaymentModalOpen(true);
  };

  const handleApplyPreset = (preset: '50' | '30' | '100' | 'custom') => {
    if (!order) return;
    setEntryPreset(preset);
    if (preset === '50') {
      const val = parseFloat((order.amount * 0.5).toFixed(2));
      setEntryAmount(String(val));
      setSplitRemaining(true);
    } else if (preset === '30') {
      const val = parseFloat((order.amount * 0.3).toFixed(2));
      setEntryAmount(String(val));
      setSplitRemaining(true);
    } else if (preset === '100') {
      setEntryAmount(String(order.amount));
      setSplitRemaining(false);
    }
  };

  const openEditOrderModal = () => {
    if (!order) return;
    setEditServiceName(order.serviceName);
    setEditSourceLang(order.sourceLanguage);
    setEditTargetLang(order.targetLanguage);
    setEditPriority(order.priority);
    setEditDeadline(order.deadline ? order.deadline.split('T')[0] : '');
    setEditAmount(String(order.amount));
    setEditStatus(order.status);
    setEditPaymentStatus(order.paymentStatus);
    setEditPaidAmount(String(order.paidAmount || 0));
    setEditAssignedUser(order.assignedUserName);
    setEditTranslatorId(order.translatorId || '');
    setEditReviewerId(order.reviewerId || '');
    setEditNotes(order.notes || '');
    setIsEditOrderModalOpen(true);
  };

  const openEditRecModal = (rec: any) => {
    setSelectedRecId(rec.id);
    setRecDesc(rec.description);
    setRecAmount(String(rec.amount));
    setRecDueDate(rec.dueDate ? rec.dueDate.split('T')[0] : '');
    setRecMethod(rec.paymentMethod);
    setRecStatus(rec.status);
    setIsEditRecModalOpen(true);
  };

  const openNewRecModal = () => {
    setNewRecDesc(`Honorários Adicionais - ${order.code}`);
    setNewRecAmount('300.00');
    setNewRecDueDate(order.deadline ? order.deadline.split('T')[0] : new Date().toISOString().split('T')[0]);
    setNewRecMethod('pix');
    setIsNewRecModalOpen(true);
  };

  const handleSaveEntryPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const entryVal = parseFloat(entryAmount) || 0;

    databaseStore.configureWorkOrderPayment(order.id, {
      entryAmount: entryVal,
      entryDueDate: entryDueDate ? new Date(entryDueDate).toISOString() : undefined,
      entryPaymentMethod,
      isEntryPaid,
      entryPaidAt: isEntryPaid ? (entryPaidAt ? new Date(entryPaidAt).toISOString() : new Date().toISOString()) : undefined,
      splitRemaining,
      remainingDueDate: remainingDueDate ? new Date(remainingDueDate).toISOString() : undefined,
      remainingPaymentMethod: remainingMethod,
      notes: paymentNotes || undefined,
    });

    setIsEntryPaymentModalOpen(false);
    setRefresh((r) => r + 1);
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const trans = translators.find((t) => t.id === editTranslatorId);
    const rev = reviewers.find((r) => r.id === editReviewerId);

    databaseStore.updateWorkOrder(order.id, {
      serviceName: editServiceName,
      sourceLanguage: editSourceLang,
      targetLanguage: editTargetLang,
      priority: editPriority,
      deadline: editDeadline ? new Date(editDeadline).toISOString() : order.deadline,
      amount: parseFloat(editAmount) || order.amount,
      status: editStatus,
      paymentStatus: editPaymentStatus,
      paidAmount: parseFloat(editPaidAmount) || 0,
      assignedUserName: editAssignedUser,
      translatorId: trans?.id,
      translatorName: trans?.name,
      reviewerId: rev?.id,
      reviewerName: rev?.name,
      notes: editNotes,
    });

    databaseStore.logAudit(
      'Mariana Costa',
      'Edição Manual da OS',
      'WorkOrder',
      order.id,
      `Atualizou dados cadastrais e operacionais da OS ${order.code}`
    );

    setIsEditOrderModalOpen(false);
    setRefresh((r) => r + 1);
  };

  const handleSaveEditRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecId) return;
    const amt = parseFloat(recAmount) || 0;

    databaseStore.updateReceivable(selectedRecId, {
      description: recDesc,
      amount: amt,
      dueDate: recDueDate ? new Date(recDueDate).toISOString() : undefined,
      paymentMethod: recMethod,
      status: recStatus,
      paidAmount: recStatus === 'pago' ? amt : recStatus === 'parcial' ? amt * 0.5 : 0,
      paidAt: recStatus === 'pago' ? new Date().toISOString() : undefined,
    });

    setIsEditRecModalOpen(false);
    setSelectedRecId(null);
    setRefresh((r) => r + 1);
  };

  const handleSaveNewRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const amt = parseFloat(newRecAmount) || 0;

    databaseStore.createReceivable({
      tenantId: order.tenantId,
      workOrderId: order.id,
      workOrderCode: order.code,
      customerId: order.customerId,
      customerName: order.customerName,
      description: newRecDesc,
      amount: amt,
      paidAmount: 0,
      dueDate: newRecDueDate ? new Date(newRecDueDate).toISOString() : order.deadline,
      paymentMethod: newRecMethod,
      status: 'pendente',
    });

    setIsNewRecModalOpen(false);
    setRefresh((r) => r + 1);
  };

  const handleDeleteRec = (recId: string) => {
    if (confirm('Tem certeza que deseja remover esta conta a receber?')) {
      databaseStore.deleteReceivable(recId);
      setRefresh((r) => r + 1);
    }
  };

  const handleAssignTranslator = (transId: string) => {
    const trans = translators.find((t) => t.id === transId);
    databaseStore.updateWorkOrder(order.id, {
      translatorId: trans?.id,
      translatorName: trans?.name,
    });
    setRefresh((r) => r + 1);
  };

  const handleAssignReviewer = (revId: string) => {
    const rev = reviewers.find((r) => r.id === revId);
    databaseStore.updateWorkOrder(order.id, {
      reviewerId: rev?.id,
      reviewerName: rev?.name,
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <Link
          href="/operacao/ordens-servico"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Ordens de Serviço
        </Link>

        {/* Change status & action buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            onClick={openEditOrderModal}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 font-bold"
          >
            <Edit3 className="w-3.5 h-3.5" /> Editar Informações da OS
          </Button>

          <Button
            onClick={openEntryPaymentModal}
            size="sm"
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" /> Pagamento de Entrada
          </Button>

          <div className="flex items-center gap-2">
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
      </div>

      {/* Main Dossier Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                {order.code}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
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

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
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
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <StatusBadge status={order.paymentStatus} />
                <span className="text-xs font-bold text-slate-700">
                  {formatCurrency(order.paidAmount || 0)}
                </span>
                <button
                  onClick={openEntryPaymentModal}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800 underline ml-0.5"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Responsible Staff Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-medium">Responsável Interno:</span>{' '}
            <strong className="text-slate-800">{order.assignedUserName}</strong>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">Tradutor Designado:</span>{' '}
              <strong className="text-slate-800">{order.translatorName || 'Aguardando Atribuição'}</strong>
            </div>
            <button
              onClick={() => setActiveTab('traducao')}
              className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 underline ml-1"
            >
              Trocar
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">Revisor Designado:</span>{' '}
              <strong className="text-slate-800">{order.reviewerName || 'Aguardando Atribuição'}</strong>
            </div>
            <button
              onClick={() => setActiveTab('revisao')}
              className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 underline ml-1"
            >
              Trocar
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tabs (2/3) + Right Visual Timeline (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Tabs & Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dossier Tabs Navigation */}
          <div className="border-b border-slate-200 flex gap-3 sm:gap-4 overflow-x-auto touch-scroll text-xs font-semibold pb-px">
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Área de Trabalho e Gestão do Tradutor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atribuição do profissional juramentado, contato direto e controle de fase.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Trocar Tradutor:</span>
                  <select
                    value={order.translatorId || ''}
                    onChange={(e) => handleAssignTranslator(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-900 cursor-pointer shadow-2xs"
                  >
                    <option value="">Aguardando Atribuição</option>
                    {translators.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.languages.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Translator card info */}
              {order.translatorId && (
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-purple-950">
                        {order.translatorName || 'Tradutor Atribuído'}
                      </p>
                      <p className="text-[11px] text-purple-700">
                        Especialidade: Jurídica / Certidões • Habilitação Oficial JUCESP
                      </p>
                    </div>
                    {translators.find((t) => t.id === order.translatorId)?.whatsapp && (
                      <a
                        href={`https://wa.me/55${translators.find((t) => t.id === order.translatorId)?.whatsapp?.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(order.translatorName || '')},%20referente%20%C3%A0%20OS%20${order.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs self-start sm:self-auto"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Falar via WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
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
                  Concluir Tradução & Enviar para Revisão
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: REVISÃO */}
          {activeTab === 'revisao' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fila de Revisão Linguística & Notarial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conferência de terminologia, formatação juramentada e conformidade notarial.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Trocar Revisor:</span>
                  <select
                    value={order.reviewerId || ''}
                    onChange={(e) => handleAssignReviewer(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 cursor-pointer shadow-2xs"
                  >
                    <option value="">Aguardando Atribuição</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.languages.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {order.reviewerId && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
                  <p className="font-bold text-sm text-amber-950">
                    {order.reviewerName || 'Revisor Atribuído'}
                  </p>
                  <p className="text-[11px] text-amber-800">
                    O revisor deve auditar fidelidade do carimbo, nomes próprios, números de certidões e averbações.
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('pronto')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar Revisão (Pronto p/ Entrega)
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Gestão Financeira & Lançamentos da OS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controle de pagamentos de entrada, saldo restante e baixas de recebíveis.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={openEntryPaymentModal}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Configurar Pagamento de Entrada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openNewRecModal}
                    className="gap-1.5 text-xs text-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nova Parcela
                  </Button>
                </div>
              </div>

              {/* Financial KPI Dashboard Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {formatCurrency(order.amount)}
                  </p>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Recebido (Entrada)</span>
                  <p className="text-lg font-black text-emerald-800 mt-0.5">
                    {formatCurrency(order.paidAmount || 0)}
                  </p>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Saldo a Receber</span>
                  <p className="text-lg font-black text-amber-900 mt-0.5">
                    {formatCurrency(Math.max(0, order.amount - (order.paidAmount || 0)))}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              </div>

              {/* Progress Bar of Payment */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Progresso do Pagamento da OS</span>
                  <span className="font-bold text-purple-700">
                    {Math.min(100, Math.round(((order.paidAmount || 0) / (order.amount || 1)) * 100))}% quitado
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round(((order.paidAmount || 0) / (order.amount || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Receivables List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Parcelas e Lançamentos a Receber ({receivables.length})
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {receivables.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Nenhum lançamento financeiro gerado para esta OS.
                    </div>
                  ) : (
                    receivables.map((rec) => (
                      <div key={rec.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{rec.description}</span>
                            <StatusBadge status={rec.status} />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Vencimento: <strong>{formatDate(rec.dueDate)}</strong> • Método: <span className="font-semibold uppercase">{rec.paymentMethod}</span>
                            {rec.paidAt && ` • Pago em: ${formatDate(rec.paidAt)}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">
                              {formatCurrency(rec.amount)}
                            </p>
                          </div>

                          {rec.status !== 'pago' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkPaymentReceived(rec.id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Pagamento
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditRecModal(rec)}
                            className="text-xs text-slate-600 hover:text-slate-900"
                            title="Editar Parcela"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRec(rec.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Remover Parcela"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineSteps.map((step, idx) => {
                const isEntryStep = step.title === 'Pagamento de entrada';
                const isPaid = order.paymentStatus === 'pago' || (order.paidAmount || 0) > 0;

                return (
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

                    <div className="w-full">
                      {isEntryStep ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p
                              className={`text-xs font-bold ${
                                isPaid ? 'text-emerald-800' : 'text-slate-700'
                              }`}
                            >
                              {step.title}
                            </p>
                            {isPaid ? (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                ✓ R$ {formatCurrency(order.paidAmount || 0)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                Pendente
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={openEntryPaymentModal}
                              className="text-[11px] font-bold text-purple-600 hover:text-purple-800 underline ml-1 cursor-pointer"
                            >
                              Editar
                            </button>
                          </div>

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={openEntryPaymentModal}
                              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Configurar / Dar Baixa na Entrada
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
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

                          {step.title === 'Documentos recebidos' && order.status === 'aguardando_documentos' && (
                            <button
                              onClick={() => {
                                handleStatusChange('documentos_recebidos');
                                setActiveTab('documentos');
                              }}
                              className="text-[10px] font-semibold text-purple-600 hover:underline"
                            >
                              Confirmar Recebimento
                            </button>
                          )}

                          {step.title === 'Tradução em andamento' && order.status !== 'em_traducao' && !['em_revisao', 'pronto', 'entregue'].includes(order.status) && (
                            <button
                              onClick={() => {
                                handleStatusChange('em_traducao');
                                setActiveTab('traducao');
                              }}
                              className="text-[10px] font-semibold text-purple-600 hover:underline"
                            >
                              Iniciar Tradução
                            </button>
                          )}

                          {step.title === 'Revisão linguística' && order.status === 'em_traducao' && (
                            <button
                              onClick={() => {
                                handleStatusChange('em_revisao');
                                setActiveTab('revisao');
                              }}
                              className="text-[10px] font-semibold text-purple-600 hover:underline"
                            >
                              Enviar p/ Revisão
                            </button>
                          )}

                          {step.title === 'Entrega final ao cliente' && order.status !== 'entregue' && (
                            <button
                              onClick={() => handleStatusChange('entregue')}
                              className="text-[10px] font-bold text-emerald-600 hover:underline"
                            >
                              Concluir Entrega
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                onClick={openEntryPaymentModal}
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 font-bold gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Configurar Pagamento de Entrada
              </Button>

              <Button
                variant="outline"
                onClick={openEditOrderModal}
                className="w-full text-xs text-slate-200 border-slate-700 hover:bg-slate-800 gap-1.5 font-bold"
              >
                <Edit3 className="w-4 h-4" /> Editar Informações da OS
              </Button>

              <Button
                variant="outline"
                onClick={() => handleStatusChange('entregue')}
                className="w-full text-xs text-slate-200 border-slate-700 hover:bg-slate-800 gap-1.5 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Marcar como Entregue
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsDocModalOpen(true)}
                className="w-full text-xs text-slate-200 border-slate-700 hover:bg-slate-800 gap-1.5 font-medium"
              >
                <Upload className="w-4 h-4 text-blue-400" /> + Anexar Documento Final
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

      {/* Modal 1: Configuração do Pagamento de Entrada */}
      <Modal
        isOpen={isEntryPaymentModalOpen}
        onClose={() => setIsEntryPaymentModalOpen(false)}
        title={`Configurar Pagamento de Entrada - ${order.code}`}
        description="Defina percentuais, valor da entrada, forma de pagamento e registre o recebimento."
      >
        <form onSubmit={handleSaveEntryPayment} className="space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Modelos Rápidos de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('50')}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                  entryPreset === '50'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                50% Entrada / 50% Saldo
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('30')}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                  entryPreset === '30'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                30% Entrada / 70% Saldo
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('100')}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                  entryPreset === '100'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                100% À Vista
              </button>
              <button
                type="button"
                onClick={() => setEntryPreset('custom')}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                  entryPreset === 'custom'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {/* Amount Overview Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Valor Total da OS</span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {formatCurrency(order.amount)}
              </p>
            </div>
            <div>
              <span className="text-emerald-700 font-semibold uppercase text-[10px]">Valor da Entrada</span>
              <p className="text-base font-black text-emerald-700 mt-0.5">
                {formatCurrency(parseFloat(entryAmount) || 0)}
              </p>
            </div>
            <div>
              <span className="text-amber-700 font-semibold uppercase text-[10px]">Saldo Restante</span>
              <p className="text-base font-black text-amber-900 mt-0.5">
                {formatCurrency(Math.max(0, order.amount - (parseFloat(entryAmount) || 0)))}
              </p>
            </div>
          </div>

          {/* Entry Config Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Valor da Entrada (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={order.amount}
                required
                value={entryAmount}
                onChange={(e) => {
                  setEntryAmount(e.target.value);
                  setEntryPreset('custom');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Forma de Pagamento da Entrada
              </label>
              <select
                value={entryPaymentMethod}
                onChange={(e) => setEntryPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="pix">PIX (Chave / QR Code)</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferencia">Transferência Bancária (TED/DOC)</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Vencimento da Entrada
              </label>
              <input
                type="date"
                value={entryDueDate}
                onChange={(e) => setEntryDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Status da Entrada
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="entryPaidCheckbox"
                  checked={isEntryPaid}
                  onChange={(e) => setIsEntryPaid(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="entryPaidCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Entrada já foi Paga / Recebida
                </label>
              </div>
            </div>
          </div>

          {/* If entry is marked as paid */}
          {isEntryPaid && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Dar baixa imediata na entrada e atualizar Linha de Progresso
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 uppercase mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={entryPaidAt}
                    onChange={(e) => setEntryPaidAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 uppercase mb-1">
                    Observação / Comprovante
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ex: Comprovante PIX recebido no WhatsApp"
                    className="w-full px-2.5 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remaining Balance section (if entry < total) */}
          {(parseFloat(entryAmount) || 0) < order.amount && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">
                  Configuração da Parcela de Saldo ({formatCurrency(Math.max(0, order.amount - (parseFloat(entryAmount) || 0)))})
                </span>
                <span className="text-[11px] text-amber-700">Gera cobrança vinculada</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Vencimento do Saldo
                  </label>
                  <input
                    type="date"
                    value={remainingDueDate}
                    onChange={(e) => setRemainingDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Método do Saldo
                  </label>
                  <select
                    value={remainingMethod}
                    onChange={(e) => setRemainingMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="transferencia">Transferência</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsEntryPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-1.5">
              <CreditCard className="w-4 h-4" /> Salvar e Atualizar Financeiro da OS
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Editar Informações Completas da OS */}
      <Modal
        isOpen={isEditOrderModalOpen}
        onClose={() => setIsEditOrderModalOpen(false)}
        title={`Editar Informações da OS - ${order.code}`}
        description="Configure os parâmetros contratuais, idiomas, prazos, valores e equipe designada."
      >
        <form onSubmit={handleSaveEditOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Serviço Contratado *
              </label>
              <input
                type="text"
                required
                value={editServiceName}
                onChange={(e) => setEditServiceName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Idioma de Origem
              </label>
              <input
                type="text"
                value={editSourceLang}
                onChange={(e) => setEditSourceLang(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Idioma de Destino
              </label>
              <input
                type="text"
                value={editTargetLang}
                onChange={(e) => setEditTargetLang(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Prioridade
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Prazo de Entrega
              </label>
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Valor Total do Contrato (R$) *
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
                Valor Já Pago (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={editPaidAmount}
                onChange={(e) => setEditPaidAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Status Operacional
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as WorkOrderStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Status do Pagamento
              </label>
              <select
                value={editPaymentStatus}
                onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial (Entrada)</option>
                <option value="pago">Quitado / Pago</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Responsável Interno
              </label>
              <input
                type="text"
                value={editAssignedUser}
                onChange={(e) => setEditAssignedUser(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tradutor Designado
              </label>
              <select
                value={editTranslatorId}
                onChange={(e) => setEditTranslatorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Aguardando Atribuição</option>
                {translators.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Revisor Designado
              </label>
              <select
                value={editReviewerId}
                onChange={(e) => setEditReviewerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Aguardando Atribuição</option>
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Observações e Instruções Especiais
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsEditOrderModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Alterações da OS
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Editar Lançamento Financeiro Individual */}
      <Modal
        isOpen={isEditRecModalOpen}
        onClose={() => setIsEditRecModalOpen(false)}
        title="Editar Lançamento a Receber"
        description="Atualize o valor, vencimento, método ou status desta parcela."
      >
        <form onSubmit={handleSaveEditRec} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Descrição da Parcela *
            </label>
            <input
              type="text"
              required
              value={recDesc}
              onChange={(e) => setRecDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
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
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={recDueDate}
                onChange={(e) => setRecDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={recMethod}
                onChange={(e) => setRecMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Status
              </label>
              <select
                value={recStatus}
                onChange={(e) => setRecStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="pago">Quitado / Pago</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsEditRecModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Parcela
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Adicionar Novo Lançamento na OS */}
      <Modal
        isOpen={isNewRecModalOpen}
        onClose={() => setIsNewRecModalOpen(false)}
        title="Nova Parcela ou Honorário Adicional"
        description="Cadastre uma nova conta a receber vinculada a esta Ordem de Serviço."
      >
        <form onSubmit={handleSaveNewRec} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Descrição do Lançamento *
            </label>
            <input
              type="text"
              required
              value={newRecDesc}
              onChange={(e) => setNewRecDesc(e.target.value)}
              placeholder="Ex: Taxa extra de cartório / Apostilamento urgente"
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
                value={newRecAmount}
                onChange={(e) => setNewRecAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Vencimento
              </label>
              <input
                type="date"
                value={newRecDueDate}
                onChange={(e) => setNewRecDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={newRecMethod}
                onChange={(e) => setNewRecMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsNewRecModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Cadastrar Lançamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
