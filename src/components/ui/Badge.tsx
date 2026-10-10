import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-cyan-500/30',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/30',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/30',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500/30',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500/30',
    outline: 'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border tracking-wide whitespace-nowrap shrink-0 transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    // WorkOrder statuses
    case 'aguardando_documentos':
      return <Badge variant="warning">Aguardando Documentos</Badge>;
    case 'documentos_recebidos':
      return <Badge variant="info">Documentos Recebidos</Badge>;
    case 'em_traducao':
      return <Badge variant="purple">Em Tradução</Badge>;
    case 'em_revisao':
      return <Badge variant="warning">Em Revisão</Badge>;
    case 'correcao':
      return <Badge variant="danger">Correção</Badge>;
    case 'finalizacao':
      return <Badge variant="info">Finalização</Badge>;
    case 'pronto':
      return <Badge variant="success">Pronto para Entrega</Badge>;
    case 'entregue':
      return <Badge variant="success">Entregue</Badge>;
    case 'cancelado':
      return <Badge variant="danger">Cancelado</Badge>;

    // Quote statuses
    case 'rascunho':
      return <Badge variant="default">Rascunho</Badge>;
    case 'enviado':
      return <Badge variant="info">Enviado</Badge>;
    case 'visualizado':
      return <Badge variant="purple">Visualizado</Badge>;
    case 'aprovado':
      return <Badge variant="success">Aprovado</Badge>;
    case 'recusado':
      return <Badge variant="danger">Recusado</Badge>;
    case 'expirado':
      return <Badge variant="default">Expirado</Badge>;

    // Lead statuses
    case 'novo':
      return <Badge variant="info">Novo</Badge>;
    case 'contato_realizado':
      return <Badge variant="purple">Contato Realizado</Badge>;
    case 'orcamento_solicitado':
      return <Badge variant="warning">Orçamento Solicitado</Badge>;
    case 'orcamento_enviado':
      return <Badge variant="info">Orçamento Enviado</Badge>;
    case 'negociacao':
      return <Badge variant="warning">Negociação</Badge>;
    case 'convertido':
      return <Badge variant="success">Convertido</Badge>;
    case 'perdido':
      return <Badge variant="danger">Perdido</Badge>;

    // Payment statuses
    case 'pago':
      return <Badge variant="success">Pago</Badge>;
    case 'parcial':
      return <Badge variant="warning">Parcial</Badge>;
    case 'pendente':
      return <Badge variant="warning">Pendente</Badge>;
    case 'vencido':
      return <Badge variant="danger">Vencido</Badge>;

    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case 'urgente':
      return <Badge variant="danger">⚡ Urgente</Badge>;
    case 'alta':
      return <Badge variant="warning">Alta</Badge>;
    case 'normal':
      return <Badge variant="info">Normal</Badge>;
    case 'baixa':
      return <Badge variant="default">Baixa</Badge>;
    default:
      return <Badge variant="default">{priority}</Badge>;
  }
}
