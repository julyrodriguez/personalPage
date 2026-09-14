import { Header } from '@/components/layout/header';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import { StudyProgressWidget } from '@/components/dashboard/study-progress-widget';
import { TaskWidget } from '@/components/dashboard/task-widget';
import { NotesWidget } from '@/components/dashboard/notes-widget';
import { CaroNailsWidget } from '@/components/dashboard/caro-nails-widget';
import { NewsWidget } from '@/components/dashboard/news-widget';

export const metadata = {
  title: 'Dashboard Principal | Personal OS',
  description: 'Hub central de vida, estudio y gestión personal con Bento Grid',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header with live clock & greeting */}
      <Header />

      {/* Bento Grid Clean Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Weather Widget (1 col) */}
        <div className="lg:col-span-1">
          <WeatherWidget />
        </div>

        {/* Study Progress Widget (2 cols on lg) */}
        <div className="md:col-span-2 lg:col-span-2">
          <StudyProgressWidget />
        </div>

        {/* Daily Focus & Tasks Widget (2 cols on lg) */}
        <div className="md:col-span-2 lg:col-span-2">
          <TaskWidget />
        </div>

        {/* Notes & Bitácora Widget (1 col) */}
        <div className="lg:col-span-1">
          <NotesWidget />
        </div>

        {/* Caro Nails Weekly Appointments Widget (1 col) */}
        <div className="lg:col-span-1">
          <CaroNailsWidget />
        </div>

        {/* News & Important Articles Widget (2 cols on lg) */}
        <div className="md:col-span-2 lg:col-span-2">
          <NewsWidget />
        </div>
      </div>
    </div>
  );
}
