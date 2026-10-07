'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, FileSpreadsheet, FileCheck2, UserPlus, ArrowRight, X } from 'lucide-react';
import { databaseStore } from '@/lib/db';
import { Customer, Quote, WorkOrder, Lead } from '@/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{
    customers: Customer[];
    quotes: Quote[];
    workOrders: WorkOrder[];
    leads: Lead[];
  }>({
    customers: [],
    quotes: [],
    workOrders: [],
    leads: [],
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ customers: [], quotes: [], workOrders: [], leads: [] });
      return;
    }

    const term = searchTerm.toLowerCase();

    const customers = databaseStore.getCustomers().filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.cpf && c.cpf.includes(term)) ||
        (c.cnpj && c.cnpj.includes(term)) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );

    const quotes = databaseStore.getQuotes().filter(
      (q) =>
        q.code.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        q.customerEmail.toLowerCase().includes(term)
    );

    const workOrders = databaseStore.getWorkOrders().filter(
      (o) =>
        o.code.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.serviceName.toLowerCase().includes(term)
    );

    const leads = databaseStore.getLeads().filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.phone.includes(term)
    );

    setResults({ customers, quotes, workOrders, leads });
  }, [searchTerm]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const totalResults =
    results.customers.length +
    results.quotes.length +
    results.workOrders.length +
    results.leads.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-16 p-3 sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        <div className="flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-slate-100 shrink-0">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por cliente, CPF/CNPJ, e-mail, OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-transparent px-3 py-1 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 ml-1"
            aria-label="Fechar busca"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2">
            ESC
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!searchTerm && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Digite algo para pesquisar em toda a operação do TraduzTudo OS...
            </div>
          )}

          {searchTerm && totalResults === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhum resultado encontrado para &quot;{searchTerm}&quot;.
            </div>
          )}

          {results.customers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Clientes ({results.customers.length})
              </p>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigateTo(`/crm/clientes/${c.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50/60 cursor-pointer group transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500">{c.email} • {c.phone}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.quotes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" /> Orçamentos ({results.quotes.length})
              </p>
              <div className="space-y-1">
                {results.quotes.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => navigateTo(`/operacao/orcamentos`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/60 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {q.code}
                        </span>
                        <p className="text-sm font-medium text-slate-900">
                          {q.customerName}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        R$ {q.total.toFixed(2)} • Status: {q.status}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.workOrders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-purple-600" /> Ordens de Serviço ({results.workOrders.length})
              </p>
              <div className="space-y-1">
                {results.workOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => navigateTo(`/operacao/ordens-servico/${o.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-purple-50/60 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                          {o.code}
                        </span>
                        <p className="text-sm font-medium text-slate-900">
                          {o.customerName}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {o.serviceName} • {o.sourceLanguage} → {o.targetLanguage}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.leads.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" /> Leads ({results.leads.length})
              </p>
              <div className="space-y-1">
                {results.leads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => navigateTo(`/crm/leads`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-emerald-50/60 cursor-pointer group transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {l.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Origem: {l.origin} • Status: {l.status}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
