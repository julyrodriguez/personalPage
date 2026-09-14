'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';

export function Header() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Formato amigable en español
      const dateFormatted = new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);

      const timeFormatted = new Intl.DateTimeFormat('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now);

      setCurrentDate(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1));
      setCurrentTime(timeFormatted);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace & Daily Focus
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3 h-3" /> Online
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hub integral de estudio, gestión de metas y automatizaciones con agentes.
        </p>
      </div>

      {/* Date & Time Widget Pill */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          <span>{currentDate || 'Cargando fecha...'}</span>
        </div>
        <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{currentTime || '--:--:--'}</span>
        </div>
      </div>
    </header>
  );
}
