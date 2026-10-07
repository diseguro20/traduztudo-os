'use client';

import React, { useState } from 'react';
import { Mail, Edit2, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { emailService } from '@/lib/services/email';

export default function TemplatesPage() {
  const templates = emailService.getTemplates();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Mail className="w-5 h-5 sm:w-6 h-6 text-blue-600" /> Templates Transacionais de E-mail
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Modelos padronizados de propostas, confirmações de pagamento e avisos de documentos prontos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {tpl.type}
                </span>
                <button
                  onClick={() => handleCopy(tpl.id, tpl.body)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                  title="Copiar texto"
                >
                  {copiedId === tpl.id ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
              <p className="text-xs font-semibold text-slate-700">
                Assunto: <span className="font-normal text-slate-600">{tpl.subject}</span>
              </p>

              <pre className="text-[11px] font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {tpl.body}
              </pre>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 items-center">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Variáveis:</span>
              {tpl.variables.map((v) => (
                <span
                  key={v}
                  className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                >
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
