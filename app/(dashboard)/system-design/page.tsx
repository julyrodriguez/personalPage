import type { Metadata } from 'next';
import Link from 'next/link';
import { Network, Trophy, Sparkles } from 'lucide-react';
import { Whiteboard } from '@/components/system-design/whiteboard';

export const metadata: Metadata = {
  title: 'System Design Trainer | Personal OS',
  description:
    'Whiteboard interactivo para entrevistas y práctica de arquitectura en la nube con simulación en tiempo real de capacidad, costos y cuellos de botella.',
};

export default function SystemDesignPage() {
  return (
    <div className="full-canvas flex-1 flex flex-col min-h-0 w-full space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Architecture Sandbox
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AWS & Azure
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-blue-600" />
            System Design Trainer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Arrastrá componentes al canvas, conectalos y simulá la capacidad real en RPS, costos y cuellos de botella.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shrink-0 self-start sm:self-center">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5" />
            Whiteboard
          </span>
          <Link
            href="/system-design/levels"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            15 Niveles & Desafíos
          </Link>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="flex-1 w-full h-[calc(100vh-12rem)] min-h-[680px] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950 relative">
        <Whiteboard />
      </div>
    </div>
  );
}
