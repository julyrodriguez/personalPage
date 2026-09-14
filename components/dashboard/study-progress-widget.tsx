'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types';

export function StudyProgressWidget() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await fetch('/api/progress?courseId=power-bi');
        const progress = res.ok ? await res.json() : null;

        const cRes = await fetch('/api/courses/power-bi').catch(() => null);
        let courseData = cRes && cRes.ok ? await cRes.json() : null;

        if (!courseData) {
          courseData = {
            id: 'power-bi',
            title: 'Power BI Masterclass',
            totalLessons: 10,
            estimatedHours: 40,
            level: 'Avanzado',
          };
        }

        const completedCount = progress?.completedLessons?.length ?? 0;
        const total = courseData.totalLessons || 10;
        const percentage = Math.round((completedCount / total) * 100);

        setCourse({
          id: 'power-bi',
          title: courseData.title || 'Power BI Masterclass',
          description: courseData.description || 'Power Query, Modelado y DAX avanzado.',
          category: 'Data & Analytics',
          level: 'Avanzado',
          estimatedHours: 40,
          tags: ['DAX', 'Power BI'],
          lessonsCount: total,
          completedCount,
          progressPercentage: percentage,
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
    <Card className="border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-br from-white via-white to-indigo-50/30 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-indigo-950/25 overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Curso Activo
            </CardTitle>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
          {percentage}%
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {course?.title || 'Power BI Masterclass'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            DAX Avanzado, Modelado Dimensional & Power Query
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {completed} de {total} clases
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              40h estimadas
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link href="/cursos/power-bi" className="block pt-1">
          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs text-xs h-8 rounded-xl flex items-center justify-center gap-1.5"
          >
            <span>Ir al Curso & Temario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
