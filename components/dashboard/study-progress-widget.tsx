'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Course } from '@/types';

export function StudyProgressWidget() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await fetch('/api/progress?courseId=power-bi');
        const progress = res.ok ? await res.json() : null;

        // Fetch course info
        const cRes = await fetch('/api/courses/power-bi').catch(() => null);
        let courseData = cRes && cRes.ok ? await cRes.json() : null;

        if (!courseData) {
          // Fallback metadata if not fetched directly
          courseData = {
            id: 'power-bi',
            title: 'Power BI Masterclass: De Cero a Arquitecto Analítico',
            totalLessons: 10,
            estimatedHours: 40,
            level: 'Avanzado',
          };
        }

        const completedCount = progress?.completedLessons?.length ?? 0;
        const total = courseData.totalLessons || 10;
        const percentage = Math.round((completedCount / total) * 100);
        const lastSlug = progress?.lastLessonSlug || '01-fundamentos-power-bi';

        setCourse({
          id: 'power-bi',
          title: courseData.title,
          description: courseData.description || 'Power Query, Modelado Dimensional, DAX y VertiPaq.',
          category: 'Data & Analytics',
          level: 'Avanzado',
          estimatedHours: 40,
          tags: ['DAX', 'Power BI', 'SQL'],
          lessonsCount: total,
          completedCount,
          progressPercentage: percentage,
          lessons: courseData.lessons || [],
        });
      } catch (e) {
        console.error('Error loading course progress:', e);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, []);

  const completed = course?.completedCount ?? 0;
  const total = course?.lessonsCount ?? 10;
  const percentage = course?.progressPercentage ?? 0;

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-white to-indigo-50/30 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-indigo-950/20 overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Curso Activo</CardTitle>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Plan de Carrera Profesional</p>
          </div>
        </div>

        <Link
          href="/cursos"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Ver Todos <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {course?.title || 'Power BI Masterclass'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Domina Power Query (M), Modelado Kimball y DAX avanzado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 mt-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <strong className="font-semibold text-slate-900 dark:text-white">{completed}</strong> de {total} clases
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              {course?.estimatedHours ?? 40}h estimadas
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Avanzado
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600 dark:text-slate-400">Progreso Total</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{percentage}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Quick Continue Button */}
        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Link
            href="/cursos/power-bi/01-fundamentos-power-bi"
            className="flex-1"
          >
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 text-xs py-2 h-9 rounded-xl flex items-center justify-center gap-2">
              <PlayCircle className="w-4 h-4" />
              <span>{completed > 0 ? 'Continuar Lección' : 'Comenzar Lección 01'}</span>
            </Button>
          </Link>
          <Link href="/cursos/power-bi" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 px-3 text-xs rounded-xl">
              Ver Temario
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
