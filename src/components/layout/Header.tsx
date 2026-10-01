'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  Bell,
  ExternalLink,
  ChevronDown,
  User,
  LogOut,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlobalSearchModal } from './GlobalSearchModal';
import { QuickActionModal } from './QuickActionModal';
import { databaseStore } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user, isAdmin, logout } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const notifications = databaseStore.getNotifications();
  const unreadNotifs = notifications.filter((n) => !n.read);
  const pendingCount = databaseStore.getUsers().filter((u) => u.status === 'PENDING').length;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Search trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global search trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-all text-xs w-48 sm:w-80 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="truncate">Buscar clientes, OS, orçamentos...</span>
            </div>
            <kbd className="hidden sm:inline-block font-mono bg-white border border-slate-200 text-slate-400 text-[10px] px-1.5 py-0.5 rounded shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Quick actions, notifications, user menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Action (+) button */}
          <Button
            size="sm"
            onClick={() => setIsQuickActionOpen(true)}
            className="gap-1.5 font-medium shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Criar</span>
          </Button>

          {/* Notifications dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileOpen(false);
              }}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    Notificações Operacionais
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    {unreadNotifs.length} novas
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => databaseStore.markNotificationRead(n.id)}
                      className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 text-center">
                  <Link
                    href="/comunicacao/notificacoes"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Ver central de notificações completa →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User profile menu */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {(user?.name || 'Administrador').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || 'Administrador'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {user?.role || 'OWNER'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.name || 'Administrador'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || ''}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {user?.role || 'OWNER'}
                  </span>
                </div>

                <div className="py-1">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Gestão de Usuários</span>
                    </Link>
                  )}
                  <Link
                    href="/configuracoes/empresa"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Building className="w-4 h-4 text-slate-400" />
                    Dados da Empresa
                  </Link>
                  <Link
                    href="https://traduztudo.vercel.app"
                    target="_blank"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    Site Público TraduzTudo
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sair do Sistema / Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </>
  );
}
