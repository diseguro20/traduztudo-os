'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, User, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { databaseStore } from '@/lib/db';
import { UserRole } from '@/types';
import { formatDate } from '@/lib/utils';

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const users = databaseStore.getUsers();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ATTENDANT');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Traduz@2026');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    const tenant = databaseStore.getTenant();

    databaseStore.createUser({
      tenantId: tenant.id,
      name,
      email,
      role,
      phone,
      password: password || 'Traduz@2026',
      active: true,
      status: 'ACTIVE',
    });

    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPassword('Traduz@2026');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Equipe e Controle de Acesso (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerenciamento de usuários internos, papéis hierárquicos e permissões operacionais.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xs text-xs sm:text-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Convidar Usuário
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full min-w-[750px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Membro da Equipe</th>
              <th className="px-4 py-3">Papel / Nível</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span>{u.name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{u.email}</td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{u.phone || '-'}</td>
                <td className="px-4 py-3.5 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Convidar Membro para a Equipe"
        description="Defina os dados de acesso e o papel hierárquico no sistema."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Beatriz Lima"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="beatriz@traduztudo.com.br"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Senha Inicial de Acesso
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Traduz@2026"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Papel / Permissões (Role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="ADMIN">ADMIN — Administrador do Sistema</option>
              <option value="MANAGER">MANAGER — Gerente Operacional</option>
              <option value="FINANCE">FINANCE — Analista Financeiro</option>
              <option value="ATTENDANT">ATTENDANT — Atendimento Comercial</option>
              <option value="TRANSLATOR">TRANSLATOR — Tradutor</option>
              <option value="REVIEWER">REVIEWER — Revisor</option>
              <option value="VIEWER">VIEWER — Apenas Visualização</option>
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Enviar Convite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
