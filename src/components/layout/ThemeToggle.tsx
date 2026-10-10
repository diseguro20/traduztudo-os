'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-xl border transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40 active:scale-90',
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-amber-300 shadow-sm hover:shadow-amber-500/10 hover:border-amber-400/40'
          : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 shadow-xs hover:border-slate-300',
        className
      )}
      title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
        )}
      </div>
    </button>
  );
}

export default ThemeToggle;
