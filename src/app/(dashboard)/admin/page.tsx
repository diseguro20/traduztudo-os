'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Shield,
  Search,
  Filter,
  Eye,
  Sliders,
  Sparkles,
  Key,
  Lock,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { User, UserRole, UserStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function AdminControlPanelPage() {
  const { user: currentAdmin } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'audit'>('pending');

  const users = databaseStore.getUsers();
  const auditLogs = databaseStore.getAuditLogs();

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const activeUsers = users.filter((u) => u.status === 'ACTIVE' || !u.status);
  const blockedUsers = users.filter((u) => u.status === 'BLOCKED');

  // Modal State for Approving / Assigning Role
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [assignedRole, setAssignedRole] = useState<UserRole>('ATTENDANT');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'crm_read',
    'orders_read',
  ]);

  // Modal for Inviting new user directly
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('TRANSLATOR');

  const handleOpenApprove = (u: User) => {
    setSelectedUser(u);
    // Pre-select role based on requested role
    if (u.requestedRole?.toLowerCase().includes('tradutor')) {
      setAssignedRole('TRANSLATOR');
      setSelectedPermissions(['orders_read', 'orders_edit', 'docs_download']);
    } else if (u.requestedRole?.toLowerCase().includes('revisor')) {
      setAssignedRole('REVIEWER');
      setSelectedPermissions(['orders_read', 'orders_edit']);
    } else if (u.requestedRole?.toLowerCase().includes('financeiro')) {
      setAssignedRole('FINANCE');
      setSelectedPermissions(['financial_read', 'financial_write']);
    } else if (u.requestedRole?.toLowerCase().includes('gerente')) {
      setAssignedRole('MANAGER');
      setSelectedPermissions(['crm_all', 'orders_all', 'quotes_all']);
    } else {
      setAssignedRole('ATTENDANT');
      setSelectedPermissions(['crm_all', 'quotes_create']);
    }
    setIsApproveModalOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedUser) return;
    databaseStore.approveUser(selectedUser.id, assignedRole, selectedPermissions);
    setIsApproveModalOpen(false);
    setSelectedUser(null);
    setRefresh((r) => r + 1);
  };

  const handleReject = (id: string, name: string) => {
    if (confirm(`Deseja realmente recusar o cadastro de ${name}?`)) {
      databaseStore.rejectUser(id);
      setRefresh((r) => r + 1);
    }
  };

  const handleToggleBlock = (u: User) => {
    if (u.status === 'BLOCKED') {
      databaseStore.unblockUser(u.id);
    } else {
      databaseStore.blockUser(u.id);
    }
    setRefresh((r) => r + 1);
  };

  const handleChangeRole = (id: string, newRole: UserRole) => {
    databaseStore.updateUser(id, { role: newRole });
    setRefresh((r) => r + 1);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${name}?`)) {
      databaseStore.deleteUser(id);
      setRefresh((r) => r + 1);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createUser({
      tenantId: tenant.id,
      name: inviteName,
      email: inviteEmail,
      phone: invitePhone,
      role: inviteRole,
      active: true,
      status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Carlos Silva (Admin)',
    });

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePhone('');
    setRefresh((r) => r + 1);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const roleLabelMap: Record<UserRole, { label: string; color: string; desc: string }> = {
    OWNER: { label: '👑 Proprietário (Owner)', color: 'bg-purple-100 text-purple-800 border-purple-300', desc: 'Acesso irrestrito a todos os dados, faturamento e configurações' },
    ADMIN: { label: '🛡️ Administrador Geral', color: 'bg-blue-100 text-blue-800 border-blue-300', desc: 'Gerenciamento completo da equipe, financeiro e operações' },
    MANAGER: { label: '💼 Gerente Operacional', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', desc: 'Supervisão de OS, distribuição de tradutores e aprovação de propostas' },
    FINANCE: { label: '💰 Analista Financeiro', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Contas a receber, contas a pagar, conciliação Pix e fluxo de caixa' },
    ATTENDANT: { label: '🎧 Atendente Comercial', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', desc: 'Triagem de novos leads, elaboração de orçamentos e contato com cliente' },
    TRANSLATOR: { label: '👨‍⚖️ Tradutor Juramentado', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Execução de traduções com fé pública e upload de minutas chanceladas' },
    REVIEWER: { label: '🔍 Revisor de Qualidade', color: 'bg-teal-100 text-teal-800 border-teal-300', desc: 'Dupla checagem terminológica e validação acadêmica' },
    VIEWER: { label: '👁️ Visualizador', color: 'bg-slate-100 text-slate-800 border-slate-300', desc: 'Acesso somente leitura para auditoria externa e conformidade' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              PAINEL ADMINISTRATIVO MASTER
            </span>
            <span className="text-xs text-slate-400 font-mono">RBAC v2.4</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Controle de Acesso, Liberação de Cadastros & Cargos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aprove novos membros, atribua níveis hierárquicos e configure permissões de fé pública.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Convidar Usuário Direto</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Usuários</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{users.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{activeUsers.length} ativos na empresa</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-2xs transition-all ${
          pendingUsers.length > 0
            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Cadastros Pendentes</div>
            {pendingUsers.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{pendingUsers.length}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
            {pendingUsers.length > 0 ? 'Aguardando sua aprovação!' : 'Nenhum pendente'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tradutores & Revisores</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {users.filter((u) => u.role === 'TRANSLATOR' || u.role === 'REVIEWER').length}
          </div>
          <div className="text-[10px] text-indigo-700 mt-0.5">Habilitados para OS</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuários Bloqueados</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{blockedUsers.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Acesso revogado</div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Fila de Cadastros Pendentes</span>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Todos os Usuários & Cargos ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Logs de Acesso & Auditoria em Tempo Real</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FILA DE CADASTROS PENDENTES DE LIBERAÇÃO                           */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h3 className="font-bold text-slate-800 text-base">Nenhum cadastro pendente de aprovação!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todas as solicitações de cadastro foram processadas. Quando novos membros se cadastrarem na página pública (<code className="text-blue-600 font-mono">/cadastro</code>), eles aparecerão aqui instantaneamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <b>Atenção do Administrador:</b> Existem <b>{pendingUsers.length} profissionais</b> aguardando que você atribua o cargo e libere o acesso ao sistema.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-sm">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{u.name}</h4>
                            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">
                              ⏳ Aguarda Liberação
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                            Cargo Pretendido:
                          </span>
                          <span className="font-bold text-blue-700 text-xs">
                            {u.requestedRole || 'Não especificado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                          Solicitado em: {formatDate(u.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenApprove(u)}
                        className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Aprovar & Atribuir Cargo</span>
                      </Button>

                      <button
                        onClick={() => handleReject(u.id, u.name)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-slate-200 text-xs font-bold"
                        title="Recusar Cadastro"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TODOS OS USUÁRIOS E GESTÃO DE CARGOS (RBAC)                        */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Membros Credenciados da Empresa</h3>
              <p className="text-xs text-slate-500">Altere cargos, bloqueie acessos ou edite permissões a qualquer momento</p>
            </div>
            <span className="text-xs text-slate-500">
              Total de <b>{users.length} usuários</b> registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Cargo Atual (RBAC)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Cadastrado em</th>
                  <th className="px-4 py-3 text-right">Ações do Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const roleInfo = roleLabelMap[u.role] || {
                    label: u.role,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    desc: '',
                  };

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {u.role === 'OWNER' ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-purple-50 text-purple-800 border-purple-200">
                            👑 Proprietário (Owner)
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                            className="text-xs font-bold rounded-lg border border-slate-300 py-1 px-2 bg-white text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
                          >
                            <option value="ADMIN">🛡️ Administrador Geral</option>
                            <option value="MANAGER">💼 Gerente Operacional</option>
                            <option value="FINANCE">💰 Analista Financeiro</option>
                            <option value="ATTENDANT">🎧 Atendente Comercial</option>
                            <option value="TRANSLATOR">👨‍⚖️ Tradutor Juramentado</option>
                            <option value="REVIEWER">🔍 Revisor de Qualidade</option>
                            <option value="VIEWER">👁️ Visualizador</option>
                          </select>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {u.status === 'PENDING' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Pendente
                          </span>
                        ) : u.status === 'BLOCKED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Bloqueado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Ativo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {u.phone || '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenApprove(u)}
                              className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              Liberar
                            </Button>
                          )}

                          {u.role !== 'OWNER' && (
                            <>
                              <button
                                onClick={() => handleToggleBlock(u)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                  u.status === 'BLOCKED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                                }`}
                              >
                                {u.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LOGS DE AUDITORIA E ACESSOS EM TEMPO REAL                          */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trilha de Auditoria & Segurança (LGPD)</h3>
              <p className="text-xs text-slate-500">Registro permanente e imutável de todas as ações administrativas</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-bold">
              ● Logs Sincronizados
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Entidade: {log.entity} #{log.entityId}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <div className="text-right shrink-0 text-slate-400 font-mono text-[11px]">
                  {formatDate(log.createdAt)}
                  <span className="block text-[10px] text-slate-400">IP: {log.ipAddress || '187.54.12.98'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APROVAR CADASTRO E ATRIBUIR CARGO                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Aprovar Cadastro & Atribuir Cargo Oficial"
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 text-sm">{selectedUser.name}</div>
              <div className="text-slate-500 font-mono">{selectedUser.email}</div>
              <div className="text-[11px] text-blue-700 pt-1">
                <b>Cargo Solicitado:</b> {selectedUser.requestedRole || 'Não especificado'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 uppercase text-[11px] block">
                Selecione o Cargo Definitivo (RBAC):
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="ADMIN">🛡️ Administrador Geral (Gestão completa)</option>
                <option value="MANAGER">💼 Gerente Operacional (Supervisão e OS)</option>
                <option value="FINANCE">💰 Analista Financeiro (Contas a Pagar/Receber)</option>
                <option value="ATTENDANT">🎧 Atendente Comercial (Atendimento e Leads)</option>
                <option value="TRANSLATOR">👨‍⚖️ Tradutor Juramentado (Oficial com Fé Pública)</option>
                <option value="REVIEWER">🔍 Revisor de Qualidade (Terminologia e Pares)</option>
                <option value="VIEWER">👁️ Visualizador (Acesso somente leitura)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                {roleLabelMap[assignedRole]?.desc}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-800 uppercase text-[11px] block">
                Permissões Granulares:
              </label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { id: 'orders_read', label: 'Visualizar Ordens de Serviço' },
                  { id: 'orders_edit', label: 'Editar e Mudar Fases de OS' },
                  { id: 'quotes_create', label: 'Elaborar Orçamentos Comerciais' },
                  { id: 'financial_read', label: 'Acessar Módulo Financeiro' },
                  { id: 'financial_write', label: 'Dar Baixa em Pagamentos' },
                  { id: 'docs_download', label: 'Baixar Documentos e Minutas' },
                  { id: 'admin_access', label: 'Acesso ao Painel Admin' },
                  { id: 'export_bi', label: 'Exportar Relatórios e BI' },
                ].map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApproveModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmApproval}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Liberar Acesso</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CONVIDAR USUÁRIO DIRETO                                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Convidar Novo Membro da Equipe"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nome Completo:</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Ex: Dra. Camila Rocha"
              className="w-full p-2.5 border rounded-xl"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">E-mail Profissional:</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="camila@traduztudo.com.br"
              className="w-full p-2.5 border rounded-xl"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Telefone / WhatsApp:</label>
            <input
              type="tel"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              placeholder="(11) 98888-7777"
              className="w-full p-2.5 border rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Cargo a Atribuir:</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="w-full p-2.5 border rounded-xl font-bold"
            >
              <option value="TRANSLATOR">👨‍⚖️ Tradutor Juramentado</option>
              <option value="REVIEWER">🔍 Revisor de Qualidade</option>
              <option value="ATTENDANT">🎧 Atendente Comercial</option>
              <option value="FINANCE">💰 Analista Financeiro</option>
              <option value="MANAGER">💼 Gerente Operacional</option>
              <option value="ADMIN">🛡️ Administrador Geral</option>
            </select>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 text-white font-bold"
            >
              Convidar & Liberar Acesso
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
