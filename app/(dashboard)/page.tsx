import { Header } from '@/components/layout/header';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import { StudyProgressWidget } from '@/components/dashboard/study-progress-widget';
import { TaskWidget } from '@/components/dashboard/task-widget';
import { NotesWidget } from '@/components/dashboard/notes-widget';
import { SystemStatusWidget } from '@/components/dashboard/system-status-widget';

export const metadata = {
  title: 'Dashboard Principal | Personal OS',
  description: 'Hub central de vida, estudio y automatización personal con Bento Grid',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header with live clock & greeting */}
      <Header />

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Ingestion API & Automation Gateway (3 cols full width) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <SystemStatusWidget />
        </div>
      </div>
    </div>
  );
}
