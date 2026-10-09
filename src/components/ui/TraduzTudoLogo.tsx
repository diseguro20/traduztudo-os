'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TraduzTudoLogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  theme?: 'dark' | 'light' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

export function TraduzTudoLogo({
  variant = 'icon',
  theme = 'auto',
  size = 'md',
  className,
}: TraduzTudoLogoProps) {
  // Determine src according to variant and theme
  let src = '/logo-icon.png';

  if (variant === 'icon') {
    src = '/logo-icon.png';
  } else if (variant === 'horizontal') {
    if (theme === 'light') {
      src = '/logo-horizontal-light.png';
    } else {
      src = '/logo-horizontal.png';
    }
  } else {
    // variant === 'full'
    if (theme === 'light') {
      src = '/logo-light.png';
    } else {
      src = '/logo.png';
    }
  }

  // Dimension classes
  const sizeClasses: Record<string, Record<string, string>> = {
    icon: {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20',
    },
    horizontal: {
      xs: 'h-6 w-auto max-w-[140px]',
      sm: 'h-8 w-auto max-w-[180px]',
      md: 'h-10 w-auto max-w-[220px]',
      lg: 'h-12 w-auto max-w-[280px]',
      xl: 'h-16 w-auto max-w-[360px]',
    },
    full: {
      xs: 'w-20 h-auto',
      sm: 'w-28 h-auto',
      md: 'w-40 h-auto',
      lg: 'w-56 h-auto',
      xl: 'w-72 h-auto',
    },
  };

  const currentSizeClass = sizeClasses[variant]?.[size] || sizeClasses.icon[size];

  return (
    <img
      src={src}
      alt="TraduzTudo"
      className={cn('object-contain select-none shrink-0', currentSizeClass, className)}
      loading="eager"
    />
  );
}

export default TraduzTudoLogo;
