'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Inbox,
  FileSpreadsheet,
  FileCheck2,
  FolderOpen,
  CheckSquare,
  Languages,
  UserCheck,
  CircleDollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  BarChart3,
  Bell,
  Mail,
  MessageSquare,
  Building2,
  ShieldCheck,
  Sliders,
  Webhook,
  History,
  ExternalLink,
  ChevronRight,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { databaseStore } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const tenant = databaseStore.getTenant();
  const pendingCount = databaseStore.getUsers().filter((u) => u.status === 'PENDING').length;
  const leadsCount = databaseStore.getLeads().length;
  const activeOrdersCount = databaseStore.getWorkOrders().filter((o) => o.status !== 'entregue' && o.status !== 'cancelado').length;
  const unreadNotifsCount = databaseStore.getNotifications().filter((n) => !n.read).length;

  const navSections = [
    {
      title: 'Visão Geral',
      items: [
        {
          label: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'CRM & Vendas',
      items: [
        {
          label: 'Leads (Pipeline)',
          href: '/crm/leads',
          icon: UserPlus,
          badge: leadsCount > 0 ? String(leadsCount) : undefined,
        },
        {
          label: 'Clientes',
          href: '/crm/clientes',
          icon: Users,
        },
      ],
    },
    {
      title: 'Operação & Tradução',
      items: [
        {
          label: 'Solicitações (Site)',
          href: '/operacao/solicitacoes',
          icon: Inbox,
        },
        {
          label: 'Orçamentos',
          href: '/operacao/orcamentos',
          icon: FileSpreadsheet,
        },
        {
          label: 'Ordens de Serviço',
          href: '/operacao/ordens-servico',
          icon: FileCheck2,
          badge: activeOrdersCount > 0 ? `${activeOrdersCount} ativas` : undefined,
          badgeVariant: 'purple' as const,
        },
        {
          label: 'Documentos & Arquivos',
          href: '/operacao/documentos',
          icon: FolderOpen,
        },
        {
          label: 'Tarefas da Equipe',
          href: '/operacao/tarefas',
          icon: CheckSquare,
        },
        {
          label: 'Tradutores',
          href: '/operacao/tradutores',
          icon: Languages,
        },
        {
          label: 'Revisores',
          href: '/operacao/revisores',
          icon: UserCheck,
        },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        {
          label: 'Contas a Receber',
          href: '/financeiro/contas-receber',
          icon: ArrowDownCircle,
        },
        {
          label: 'Contas a Pagar',
          href: '/financeiro/contas-pagar',
          icon: ArrowUpCircle,
        },
        {
          label: 'Fluxo de Caixa',
          href: '/financeiro/fluxo-caixa',
          icon: CircleDollarSign,
        },
        {
          label: 'Despesas',
          href: '/financeiro/despesas',
          icon: Receipt,
        },
      ],
    },
    {
      title: 'Inteligência & Gestão',
      items: [
        {
          label: 'Relatórios & BI',
          href: '/relatorios',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Comunicação',
      items: [
        {
          label: 'Notificações',
          href: '/comunicacao/notificacoes',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? String(unreadNotifsCount) : undefined,
          badgeVariant: 'warning' as const,
        },
        {
          label: 'Templates de E-mail',
          href: '/comunicacao/templates',
          icon: Mail,
        },
        {
          label: 'WhatsApp API',
          href: '/comunicacao/whatsapp',
          icon: MessageSquare,
        },
      ],
    },
    {
      title: 'Configurações SaaS',
      items: [
        {
          label: 'Painel Admin (Cargos)',
          href: '/admin',
          icon: ShieldCheck,
          badge: pendingCount > 0 ? `${pendingCount} Pendentes` : 'Admin',
        },
        {
          label: 'Empresa & Tenant',
          href: '/configuracoes/empresa',
          icon: Building2,
        },
        {
          label: 'Usuários & Permissões',
          href: '/configuracoes/usuarios',
          icon: ShieldCheck,
        },
        {
          label: 'Serviços & Idiomas',
          href: '/configuracoes/servicos',
          icon: Sliders,
        },
        {
          label: 'Integrações & API',
          href: '/configuracoes/integracoes',
          icon: Webhook,
        },
        {
          label: 'Trilha de Auditoria',
          href: '/configuracoes/auditoria',
          icon: History,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="h-18 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              TT
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">
                  TraduzTudo
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                Gestão Inteligente
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </h4>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Tenant Context & Client Portal link */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <Link
            href="/portal"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs transition-colors border border-slate-700/50 group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Portal do Cliente</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </Link>

          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs uppercase">
              {(user?.name || 'Administrador').slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'Administrador'}</p>
              <p className="text-[10px] text-slate-400 truncate">{tenant.name} · {user?.role || 'ADMIN'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
