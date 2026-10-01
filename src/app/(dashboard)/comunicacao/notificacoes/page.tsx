'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { databaseStore } from '@/lib/db';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function NotificacoesPage() {
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return databaseStore.subscribe(() => setRefresh((r) => r + 1));
  }, []);

  const notifications = databaseStore.getNotifications();

  const handleMarkAllRead = () => {
    notifications.forEach((n) => databaseStore.markNotificationRead(n.id));
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" /> Central de Notificações
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Alertas de novos leads, prazos vencendo, aprovações de orçamentos e pagamentos.
          </p>
        </div>

        <Button variant="outline" onClick={handleMarkAllRead} className="text-xs">
          Marcar todas como lidas
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors ${
              !n.read ? 'bg-blue-50/30' : ''
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  n.type === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : n.type === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {n.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : n.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDateTime(n.createdAt)}
                </p>
              </div>
            </div>

            {n.link && (
              <Link
                href={n.link}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
              >
                Ver <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
