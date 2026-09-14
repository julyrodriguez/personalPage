'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Calendar,
  Clock,
  Menu,
  X,
} from 'lucide-react';
import { LessonMeta } from '@/types';
import { cn } from '@/lib/utils';

interface LessonSidebarProps {
  courseId: string;
  courseTitle: string;
  currentLessonSlug: string;
  lessons: LessonMeta[];
  completedLessons: string[];
}

export function LessonSidebar({
  courseId,
  courseTitle,
  currentLessonSlug,
  lessons,
  completedLessons,
}: LessonSidebarProps) {
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Group lessons by week
  const weeksMap: Record<number, LessonMeta[]> = {};
  lessons.forEach((l) => {
    const w = l.week || 1;
    if (!weeksMap[w]) weeksMap[w] = [];
    weeksMap[w].push(l);
  });

  const weekNumbers = Object.keys(weeksMap).map(Number).sort((a, b) => a - b);

  const toggleWeek = (week: number) => {
    setOpenWeeks((prev) => ({ ...prev, [week]: !prev[week] }));
  };

  const completedCount = completedLessons.length;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Course Title & Overall Progress */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
        <Link
          href="/cursos"
          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2"
        >
          ← Volver a Cursos
        </Link>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
          {courseTitle}
        </h3>

        {/* Mini progress */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>
              {completedCount} de {totalCount} completadas
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {progressPercent}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Syllabus Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {weekNumbers.map((week) => {
          const isOpen = openWeeks[week] ?? true;
          const weekLessons = weeksMap[week];
          const weekCompleted = weekLessons.filter((l) =>
            completedLessons.includes(l.lessonSlug)
          ).length;

          return (
            <div
              key={week}
              className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden"
            >
              <button
                onClick={() => toggleWeek(week)}
                className="w-full flex items-center justify-between p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px]">
                    S{week}
                  </span>
                  <span>Semana {week}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({weekCompleted}/{weekLessons.length})
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="p-1.5 pt-0 space-y-1">
                  {weekLessons.map((l) => {
                    const isCurrent = l.lessonSlug === currentLessonSlug;
                    const isCompleted = completedLessons.includes(l.lessonSlug);

                    return (
                      <Link
                        key={l.lessonSlug}
                        href={`/cursos/${courseId}/${l.lessonSlug}`}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={cn(
                          'flex items-start gap-2.5 p-2 rounded-lg text-xs transition-all',
                          isCurrent
                            ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2
                              className={cn(
                                'w-3.5 h-3.5',
                                isCurrent ? 'text-white' : 'text-emerald-500'
                              )}
                            />
                          ) : (
                            <Circle
                              className={cn(
                                'w-3.5 h-3.5',
                                isCurrent ? 'text-white/60' : 'text-slate-400'
                              )}
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] uppercase tracking-wider opacity-75">
                              {l.day}
                            </span>
                            {l.durationMinutes && (
                              <span className="text-[9px] opacity-75 font-mono">
                                {l.durationMinutes}m
                              </span>
                            )}
                          </div>
                          <p className="line-clamp-2 leading-tight mt-0.5">{l.title}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden sticky top-14 z-30 flex items-center justify-between p-3 mb-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 truncate pr-2">
          <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
            Temario ({progressPercent}% completado)
          </span>
        </div>
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="shrink-0 px-3 py-1.5 text-xs rounded-xl bg-blue-600 text-white font-semibold shadow-xs"
        >
          Ver Clases
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full z-10 shadow-2xl flex flex-col">
            <div className="flex justify-end p-2 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{sidebarContent}</div>
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-80 shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {sidebarContent}
      </aside>
    </>
  );
}
