import type { Metadata } from 'next';
import Link from 'next/link';
import { Network, Trophy, Sparkles } from 'lucide-react';
import { LevelsPage } from '@/components/system-design/levels-page';

export const metadata: Metadata = {
  title: 'Niveles & Desafíos | System Design Trainer',
  description: '15 niveles en 4 capítulos para practicar diseño de sistemas desde 10K hasta 100M usuarios.',
};

export default function SystemDesignLevelsPage() {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Desafíos de Arquitectura
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              15 Niveles · 4 Capítulos
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-500" />
            Niveles & Roadmap de Aprendizaje
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Seleccioná un nivel, construí la infraestructura y probá si soporta la carga y objetivos requeridos.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shrink-0 self-start sm:self-center">
          <Link
            href="/system-design"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1.5"
          >
            <Network className="w-3.5 h-3.5" />
            Whiteboard
          </Link>
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            15 Niveles & Desafíos
          </span>
        </div>
      </div>

      {/* Levels content */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 sm:p-4 shadow-sm">
        <LevelsPage />
      </div>
    </div>
  );
}
