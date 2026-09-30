'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Code,
  Award,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EscuelaCourseItem, EscuelaClassItem } from '@/types';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<EscuelaCourseItem | null>(null);
  const [loading, setLoading] = useState(true);

  const parseJsonSafe = async (res: Response) => {
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/escuela/courses/${courseId}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await parseJsonSafe(res);
        if (json && json.success) {
          setCourse(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching course detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <School className="w-8 h-8 animate-pulse mx-auto mb-2 text-blue-500" />
        <p className="text-sm">Cargando temario del curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curso no encontrado</h2>
        <Link href="/escuela">
          <Button variant="outline" className="rounded-xl">Volver a la Escuela</Button>
        </Link>
      </div>
    );
  }

  const pct = course.progressPercentage || 0;
  const classes = course.classes || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/escuela"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo de Escuela
        </Link>
      </div>

      {/* Course Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {course.category}
            </span>
            <Badge variant="warning" className="text-xs gap-1 font-semibold">
              <Award className="w-3.5 h-3.5" />
              Nivel {course.level || 1}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {course.title}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {course.description}
          </p>

          {/* Progress bar and stats */}
          <div className="pt-2 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Progreso general del curso</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {course.readCount || 0} de {classes.length} clases leídas ({pct}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Classes Syllabus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Temario & Clases Diarias ({classes.length})
          </h2>
          <span className="text-xs text-slate-500">
            Analizado con Gemini AI + Recursos Alumni
          </span>
        </div>

        <div className="space-y-3">
          {classes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500">
                Aún no hay clases generadas para este curso. Ejecuta la sincronización en la página principal.
              </p>
            </div>
          ) : (
            classes.map((cls, idx) => {
              const cp = cls.checkpoint;
              const isRead = cp?.read;
              const isPracticeDone = cp?.practiceCompleted;
              const isChallengeDone = cp?.challengeCompleted;

              return (
                <Link
                  key={cls.classId}
                  href={`/escuela/${courseId}/${cls.classId}`}
                  className="block group"
                >
                  <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all rounded-2xl shadow-2xs group-hover:shadow-sm cursor-pointer overflow-hidden">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Number + Title + Summary */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                            isRead
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isRead ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              Módulo {cls.moduleNumber || idx + 1}
                            </span>
                            {cls.rawResources && cls.rawResources.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {cls.rawResources.length} materiales oficiales
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {cls.title}
                          </h3>

                          {cls.summary && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {cls.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Checkpoint badges + Arrow */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Read Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                            isRead
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400'
                          }`}
                          title={isRead ? 'Clase leída' : 'Pendiente de lectura'}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{isRead ? 'Leída' : 'Por leer'}</span>
                        </span>

                        {/* Practice Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                            isPracticeDone
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400'
                          }`}
                          title={isPracticeDone ? 'Práctica completada' : 'Práctica pendiente'}
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Práctica</span>
                        </span>

                        {/* Challenge Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                            isChallengeDone
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400'
                          }`}
                          title={isChallengeDone ? 'Desafío superado' : 'Desafío pendiente'}
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Desafío</span>
                        </span>

                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
