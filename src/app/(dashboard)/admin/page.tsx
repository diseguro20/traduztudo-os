'use client';

import React, { useState, useEffect } from 'react';
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
  EyeOff,
  Sliders,
  Key,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Trash2,
  Copy,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { User, UserRole, UserStatus } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminControlPanelPage() {
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const users = databaseStore.getUsers();
  const auditLogs = databaseStore.getAuditLogs();

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const activeUsers = users.filter((u) => u.status === 'ACTIVE' || !u.status);
  const blockedUsers = users.filter((u) => u.status === 'BLOCKED');

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  // Modal State for Approving / Assigning Role (if any pending exists)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [assignedRole, setAssignedRole] = useState<UserRole>('ATTENDANT');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'crm_read',
    'orders_read',
  ]);

  // Modal for Generating New User Directly
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('TRANSLATOR');
  const [createPassword, setCreatePassword] = useState('');
  const [createShowPassword, setCreateShowPassword] = useState(false);

  // Success Modal with Generated Credentials
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Modal for Resetting Password
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const generateSecurePassword = () => {
    const prefixes = ['Traduz', 'Oficial', 'Jucesp', 'Global', 'Juridico', 'Certifica'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(100 + Math.random() * 900);
    const symbols = ['@', '#', '$', '!'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    return `${prefix}${symbol}${number}`;
  };

  const handleOpenCreateModal = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePhone('');
    setCreateRole('TRANSLATOR');
    setCreatePassword(generateSecurePassword());
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim()) return;

    const tenant = databaseStore.getTenant();
    const finalPassword = createPassword.trim() || generateSecurePassword();

    const newUser = databaseStore.createUser({
      tenantId: tenant.id,
      name: createName.trim(),
      email: createEmail.trim(),
      phone: createPhone.trim(),
      role: createRole,
      password: finalPassword,
      active: true,
      status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
      approvedBy: `${databaseStore.getCurrentUser().name} (Admin)`,
    });

    setIsCreateModalOpen(false);
    setCreatedCredentials({
      name: newUser.name,
      email: newUser.email,
      password: finalPassword,
      role: roleLabelMap[newUser.role]?.label || newUser.role,
      phone: newUser.phone || '',
    });
    setRefresh((r) => r + 1);
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `*TRADUZTUDO OS — SEUS DADOS DE ACESSO*\n\n` +
      `Olá ${createdCredentials.name}, seu acesso ao sistema operacional foi gerado com sucesso:\n\n` +
      `🌐 *Link de Acesso:* https://traduztudo-os.vercel.app/login\n` +
      `👤 *Usuário / E-mail:* ${createdCredentials.email}\n` +
      `🔑 *Senha Inicial:* ${createdCredentials.password}\n` +
      `💼 *Perfil:* ${createdCredentials.role}\n\n` +
      `_Por favor, guarde suas credenciais em local seguro._`;

    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleOpenResetPassword = (u: User) => {
    setUserToReset(u);
    setResetPasswordInput(generateSecurePassword());
    setResetSuccess(false);
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReset || !resetPasswordInput.trim()) return;

    databaseStore.resetUserPassword(userToReset.id, resetPasswordInput.trim());
    setResetSuccess(true);
    setTimeout(() => {
      setUserToReset(null);
      setResetSuccess(false);
      setRefresh((r) => r + 1);
    }, 2000);
  };

  const handleOpenApprove = (u: User) => {
    setSelectedUser(u);
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Usuários e Acessos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gerencie os membros da equipe e permissões de acesso da empresa.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={handleOpenCreateModal}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Usuários</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{users.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{activeUsers.length} ativos na empresa</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tradutores & Revisores</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {users.filter((u) => u.role === 'TRANSLATOR' || u.role === 'REVIEWER').length}
          </div>
          <div className="text-[10px] text-indigo-700 mt-0.5">Habilitados para OS</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gestão & Comercial</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {users.filter((u) => u.role === 'ADMIN' || u.role === 'MANAGER' || u.role === 'ATTENDANT' || u.role === 'FINANCE').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Operação interna</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acessos Bloqueados</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{blockedUsers.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Revogados pela gestão</div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto touch-scroll">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 shrink-0 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Todos os Usuários & Equipe ({users.length})</span>
        </button>

        {pendingUsers.length > 0 && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Fila de Pendências</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold animate-pulse">
              {pendingUsers.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 shrink-0 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Trilha de Auditoria & LGPD</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TODOS OS USUÁRIOS E GERENCIAMENTO DE CARGOS                        */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
          <div className="p-3 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
              >
                <option value="ALL">Todos os Cargos</option>
                <option value="ADMIN">🛡️ Administradores</option>
                <option value="MANAGER">💼 Gerentes Operacionais</option>
                <option value="FINANCE">💰 Financeiro</option>
                <option value="ATTENDANT">🎧 Atendentes Comerciais</option>
                <option value="TRANSLATOR">👨‍⚖️ Tradutores Juramentados</option>
                <option value="REVIEWER">🔍 Revisores de Qualidade</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Gerar Novo Cadastro
            </Button>
          </div>

          <div className="overflow-x-auto touch-scroll">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Cargo Atual (RBAC)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Cadastrado em</th>
                  <th className="px-4 py-3 text-right">Ações do Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
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
                          {/* Reset Password Button */}
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Redefinir Senha de Acesso"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

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
      {/* TAB 2: FILA DE PENDÊNCIAS (SE HOUVER)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h3 className="font-bold text-slate-800 text-base">Nenhum cadastro pendente!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos os usuários do sistema foram cadastrados e liberados diretamente pela administração.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map((u) => (
                <div key={u.id} className="p-4 bg-white rounded-2xl border border-amber-300 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{u.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(u.id, u.name)}
                      className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Recusar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenApprove(u)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Aprovar & Atribuir Cargo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LOGS DE AUDITORIA E SEGURANÇA LGPD                                 */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trilha de Auditoria & Segurança (LGPD)</h3>
              <p className="text-xs text-slate-500">Registro permanente e imutável de todas as ações administrativas</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {auditLogs.length} Registros
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors text-xs flex items-start justify-between gap-4">
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
      {/* MODAL: GERAR NOVO CADASTRO & SENHA (EXCLUSIVO DO ADMIN)                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="➕ Gerar Novo Cadastro de Usuário"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
            Como administrador, você gera os cadastros da sua equipe. Defina o perfil e a senha inicial do colaborador.
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nome Completo do Colaborador:</label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ex: Dra. Camila Rocha"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">E-mail de Acesso:</label>
            <input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="camila@traduztudo.com.br"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Senha Inicial de Acesso:</label>
              <button
                type="button"
                onClick={() => setCreatePassword(generateSecurePassword())}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Gerar Nova Senha
              </button>
            </div>
            <div className="relative">
              <input
                type={createShowPassword ? 'text' : 'password'}
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Defina uma senha ou use a gerada"
                className="w-full p-2.5 pr-10 border border-slate-300 rounded-xl font-mono text-slate-900"
                required
              />
              <button
                type="button"
                onClick={() => setCreateShowPassword(!createShowPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {createShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Telefone / WhatsApp Comercial:</label>
            <input
              type="tel"
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder="(11) 98888-7777"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Cargo e Perfil de Acesso (RBAC):</label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as UserRole)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
            >
              <option value="TRANSLATOR">👨‍⚖️ Tradutor Juramentado (Oficial com Fé Pública)</option>
              <option value="REVIEWER">🔍 Revisor de Qualidade (Terminologia e Pares)</option>
              <option value="MANAGER">💼 Gerente Operacional (Supervisão de OS e Equipe)</option>
              <option value="FINANCE">💰 Analista Financeiro (Contas a Pagar/Receber)</option>
              <option value="ATTENDANT">🎧 Atendente Comercial (Atendimento e Orçamentos)</option>
              <option value="ADMIN">🛡️ Administrador Geral (Acesso Total)</option>
              <option value="VIEWER">👁️ Visualizador (Acesso Leitura)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {roleLabelMap[createRole]?.desc}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Criar e Ativar Cadastro
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREDENCIAIS GERADAS COM SUCESSO                                    */}
      {/* ========================================================================= */}
      {createdCredentials && (
        <Modal
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          title="🎉 Cadastro Gerado com Sucesso!"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>O novo usuário já está ativo e pode acessar o TraduzTudo OS imediatamente.</span>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 font-mono text-xs shadow-inner">
              <div className="text-[11px] text-slate-400 uppercase font-sans font-bold border-b border-slate-800 pb-1">
                Credenciais de Acesso do Colaborador:
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nome:</span>
                <span className="font-bold text-white">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Cargo:</span>
                <span className="font-bold text-indigo-300">{createdCredentials.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">E-mail:</span>
                <span className="font-bold text-blue-300">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Senha Inicial:</span>
                <span className="font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                  {createdCredentials.password}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-400">Página de Login:</span>
                <span className="text-slate-300 truncate">https://traduztudo-os.vercel.app/login</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleCopyCredentials}
                className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                {copiedCredentials ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Dados de Acesso</span>
                  </>
                )}
              </Button>

              {createdCredentials.phone && (
                <a
                  href={`https://wa.me/55${createdCredentials.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${createdCredentials.name}, seu acesso ao sistema TraduzTudo OS foi gerado!\n\nLink: https://traduztudo-os.vercel.app/login\nUsuário: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar via WhatsApp</span>
                </a>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedCredentials(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REDEFINIR SENHA DE QUALQUER USUÁRIO                                */}
      {/* ========================================================================= */}
      {userToReset && (
        <Modal
          isOpen={!!userToReset}
          onClose={() => setUserToReset(null)}
          title={`🔑 Redefinir Senha: ${userToReset.name}`}
        >
          <form onSubmit={handleConfirmResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Defina uma nova senha para <b>{userToReset.name}</b> ({userToReset.email}). A alteração tem efeito imediato.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Nova Senha de Acesso:</label>
                <button
                  type="button"
                  onClick={() => setResetPasswordInput(generateSecurePassword())}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Gerar Senha Segura
                </button>
              </div>
              <input
                type="text"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-900"
                required
              />
            </div>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Senha redefinida com sucesso!</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUserToReset(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Confirmar Nova Senha
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APROVAR CADASTRO E ATRIBUIR CARGO (PENDÊNCIAS)                      */}
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

            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
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
    </div>
  );
}
