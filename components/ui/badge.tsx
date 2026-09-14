import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-blue-600 text-white',
    secondary: 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    destructive: 'border-transparent bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    outline: 'text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    success: 'border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
        variantStyles,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
