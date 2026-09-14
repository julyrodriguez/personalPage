import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseById, getCourseLessonsMeta } from '@/lib/courses';
import { db } from '@/lib/db';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  ArrowLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) return { title: 'Curso no encontrado' };
  return {
    title: `${course.title} | Personal OS`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { courseId } = await params;

  const [course, lessons, progress] = await Promise.all([
    getCourseById(courseId),
    getCourseLessonsMeta(courseId),
    db.getCourseProgress(courseId),
  ]);

  if (!course) {
    notFound();
  }

  const completedCount = progress.completedLessons.length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Encontrar la primera lección no completada o la última visitada
  const nextLessonSlug =
    progress.lastLessonSlug ||
    lessons.find((l) => !progress.completedLessons.includes(l.lessonSlug))?.lessonSlug ||
    lessons[0]?.lessonSlug ||
    '01-fundamentos-power-bi';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Botón Volver */}
      <div>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo de Cursos
        </Link>
      </div>

      {/* Banner Principal del Curso */}
      <Card className="border-indigo-200/80 dark:border-indigo-900/40 bg-gradient-to-br from-white via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 overflow-hidden shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider">
                  {course.category || 'Formación Profesional'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {course.level}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {course.estimatedHours}h estimadas
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {course.title}
              </h1>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col gap-2 shrink-0 sm:self-start">
              <Link href={`/cursos/${course.id}/${nextLessonSlug}`}>
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 text-xs px-5 h-10 rounded-xl flex items-center justify-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  <span>{completedCount > 0 ? 'Continuar Lección' : 'Comenzar Lección 01'}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Progreso del Curso: {completedCount} de {totalLessons} clases completadas
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {course.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Temario / Lista de Clases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Temario Completo ({lessons.length} Clases)
          </h2>
        </div>

        {lessons.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400 border-dashed">
            No hay clases registradas aún para este curso. Puedes inyectar clases con el endpoint POST /api/personal/course-lesson.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {lessons.map((lesson, idx) => {
              const isCompleted = progress.completedLessons.includes(lesson.lessonSlug);

              return (
                <Link
                  key={lesson.lessonSlug}
                  href={`/cursos/${course.id}/${lesson.lessonSlug}`}
                  className="block group"
                >
                  <Card
                    className={`p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? 'border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/10 dark:bg-emerald-950/10 hover:border-emerald-400/80'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-indigo-400/80'
                    } hover:shadow-xs`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              Semana {lesson.week} • {lesson.day}
                            </span>
                            {isCompleted && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Completada
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {lesson.title}
                          </h3>

                          {lesson.summary && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {lesson.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                          {lesson.durationMinutes || 30} min
                        </span>
                        <div className="p-2 rounded-lg text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
