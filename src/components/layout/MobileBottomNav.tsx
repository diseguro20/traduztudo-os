'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  FileSpreadsheet,
  FileCheck2,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { databaseStore } from '@/lib/db';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const newRequestsCount = databaseStore
    .getRequests()
    .filter((r) => r.status === 'nova').length;

  const activeOrdersCount = databaseStore
    .getWorkOrders()
    .filter((o) => o.status !== 'entregue' && o.status !== 'cancelado').length;

  const navItems = [
    {
      label: 'Início',
      href: '/',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    {
      label: 'Solicitações',
      href: '/operacao/solicitacoes',
      icon: Inbox,
      badge: newRequestsCount > 0 ? String(newRequestsCount) : undefined,
      badgeColor: 'bg-rose-500 text-white',
      isActive: pathname.startsWith('/operacao/solicitacoes'),
    },
    {
      label: 'Orçamentos',
      href: '/operacao/orcamentos',
      icon: FileSpreadsheet,
      isActive: pathname.startsWith('/operacao/orcamentos'),
    },
    {
      label: 'Ordens (OS)',
      href: '/operacao/ordens-servico',
      icon: FileCheck2,
      badge: activeOrdersCount > 0 ? String(activeOrdersCount) : undefined,
      badgeColor: 'bg-purple-600 text-white',
      isActive: pathname.startsWith('/operacao/ordens-servico'),
    },
  ];

  return (
    <nav
      aria-label="Navegação Rápida Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative text-center',
                item.isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform',
                    item.isActive ? 'scale-110 text-blue-600' : 'text-slate-500'
                  )}
                />
                {item.badge && (
                  <span
                    className={cn(
                      'absolute -top-1.5 -right-2 text-[10px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs',
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]',
                  item.isActive ? 'font-bold text-blue-600' : 'text-slate-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu Drawer Trigger */}
        <button
          onClick={onOpenMenu}
          type="button"
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-500 hover:text-slate-900 active:scale-95 transition-all text-center"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <Menu className="w-5 h-5 text-slate-600" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium text-slate-600">
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
}
