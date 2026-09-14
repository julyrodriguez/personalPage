import { Header } from '@/components/layout/header';
import { NewsCoverWidget } from '@/components/dashboard/news-cover-widget';
import { TaskWidget } from '@/components/dashboard/task-widget';
import { CaroNailsWidget } from '@/components/dashboard/caro-nails-widget';
import { NotesWidget } from '@/components/dashboard/notes-widget';
import { StudyProgressWidget } from '@/components/dashboard/study-progress-widget';

export const metadata = {
  title: 'Dashboard Principal | Personal OS',
  description: 'Hub central de vida, estudio y gestión personal con Bento Grid',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header con Fecha, Hora en vivo, Clima actual y Pronóstico de 2 días */}
      <Header />

      {/* 2. Portada de Noticias & Artículos Destacados */}
      <NewsCoverWidget />

      {/* 3. Bento Grid Organizado: Tareas, Caro Nails, Curso Activo & Notas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {/* Columna 1: Tareas y Daily Focus */}
        <div className="w-full">
          <TaskWidget />
        </div>

        {/* Columna 2: Caro Nails - Turnos de la Semana */}
        <div className="w-full">
          <CaroNailsWidget />
        </div>

        {/* Columna 3: Curso Activo (Compacto) + Notas Rápidas */}
        <div className="w-full space-y-5">
          <StudyProgressWidget />
          <NotesWidget />
        </div>
      </div>
    </div>
  );
}
