import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700', className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 rounded-full"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
