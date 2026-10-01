'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Search, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { OrderTask, Priority, TaskStatus } from '@/types';
import { formatDate } from '@/lib/utils';

export default function TarefasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | TaskStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  React.useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('Mariana Costa');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<Priority>('normal');

  const tasks = databaseStore.getTasks().filter((t) => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    if (!matchesStatus) return false;
    if (!searchTerm) return true;
    return (
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assignedToName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleToggleStatus = (task: OrderTask) => {
    const nextStatus = task.status === 'concluida' ? 'a_fazer' : 'concluida';
    databaseStore.updateTask(task.id, {
      status: nextStatus,
      completedAt: nextStatus === 'concluida' ? new Date().toISOString() : undefined,
    });
    setRefresh((r) => r + 1);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createTask({
      tenantId: tenant.id,
      workOrderId: 'order-001',
      title,
      assignedToName: assignedTo,
      dueDate: new Date(dueDate).toISOString(),
      priority,
      status: 'a_fazer',
    });

    setIsModalOpen(false);
    setTitle('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" /> Tarefas da Equipe
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Checklist de atividades operacionais, confecção de minutas, revisões e entregas.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar tarefas ou responsáveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium ${
              filterStatus === 'ALL' ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-600'
            }`}
          >
            Todas ({databaseStore.getTasks().length})
          </button>
          <button
            onClick={() => setFilterStatus('a_fazer')}
            className={`px-2.5 py-1 rounded-md font-medium ${
              filterStatus === 'a_fazer' ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-600'
            }`}
          >
            A Fazer
          </button>
          <button
            onClick={() => setFilterStatus('concluida')}
            className={`px-2.5 py-1 rounded-md font-medium ${
              filterStatus === 'concluida' ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-600'
            }`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleToggleStatus(task)}
            className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
              task.status === 'concluida' ? 'bg-slate-50/60 text-slate-400 line-through' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={task.status === 'concluida'}
                onChange={() => {}}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs shrink-0">
              <span className="text-slate-600">
                Resp: <strong>{task.assignedToName}</strong>
              </span>
              <span className="text-slate-500">Venc: {formatDate(task.dueDate)}</span>
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Tarefa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Nova Tarefa Operacional"
        description="Defina uma ação a ser realizada com responsável e data limite."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Título da Tarefa *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Formatar documento conforme padrão juramentado"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Data Limite
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
            <Button type="submit" variant="primary">
              Salvar Tarefa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
