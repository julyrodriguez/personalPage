import Link from 'next/link';
import { getAllCourses } from '@/lib/courses';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Catálogo de Cursos | Personal OS',
  description: 'Catálogo de formación técnica y especialización profesional',
};

export default async function CursosPage() {
  const courses = await getAllCourses();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Learning Hub
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          Cursos y Rutas de Especialización
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Contenidos técnicos estructurados por semanas, lecciones prácticas en Markdown/MDX y
          ejemplos de código interactivos.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const firstLessonSlug =
            course.lessons && course.lessons.length > 0
              ? course.lessons[0].lessonSlug
              : '01-fundamentos-power-bi';

          return (
            <Card
              key={course.id}
              className="flex flex-col justify-between border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all group overflow-hidden"
            >
              <div>
                {/* Course Header Banner */}
                <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      {course.category}
                    </span>

                    <Badge
                      variant="warning"
                      className="text-[11px] gap-1 font-semibold"
                    >
                      <Award className="w-3 h-3" />
                      {course.level}
                    </Badge>
                  </div>

                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {course.title}
                  </CardTitle>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <CardContent className="p-6 pt-4 space-y-4">
                  {/* Meta Stats */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {course.lessonsCount}
                        </strong>{' '}
                        Clases estructuradas
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {course.estimatedHours}h
                        </strong>{' '}
                        Estimadas
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Progreso del Alumno: {course.completedCount} de {course.lessonsCount}{' '}
                        completadas
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {course.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                <Link
                  href={`/cursos/${course.id}/${firstLessonSlug}`}
                  className="w-full"
                >
                  <Button className="w-full rounded-xl text-xs gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 py-2.5 h-10">
                    <span>
                      {course.completedCount && course.completedCount > 0
                        ? 'Continuar Estudiando'
                        : 'Iniciar Curso'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
