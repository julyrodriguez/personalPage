import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Course, Lesson, LessonMeta } from '@/types';
import { db } from './db';

const COURSES_DIR = path.resolve(process.cwd(), 'content/courses');

// Metadata registry for courses
const COURSES_CATALOG: Record<string, Omit<Course, 'lessons' | 'lessonsCount' | 'completedCount' | 'progressPercentage'>> = {
  'power-bi': {
    id: 'power-bi',
    title: 'Power BI Masterclass: De Cero a Arquitecto Analítico',
    description: 'Domina Power Query (M), Modelado Dimensional en Estrella, DAX avanzado con Inteligencia de Tiempo, RLS dinámico y Optimización VertiPaq.',
    category: 'Business Intelligence & Data',
    level: 'Avanzado',
    estimatedHours: 40,
    tags: ['Power BI', 'DAX', 'Power Query', 'M', 'Modelado Dimensional', 'SQL'],
  },
  'nextjs-fullstack': {
    id: 'nextjs-fullstack',
    title: 'Next.js Moderno y Arquitectura Frontend Escalable',
    description: 'Aprende App Router, Server Components, caching de alto rendimiento, Tailwind CSS y diseño de dashboards con Bento Grid.',
    category: 'Desarrollo Web',
    level: 'Intermedio',
    estimatedHours: 25,
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Full-Stack'],
  },
};

function ensureCoursesDir(courseId?: string) {
  if (!fs.existsSync(COURSES_DIR)) {
    fs.mkdirSync(COURSES_DIR, { recursive: true });
  }
  if (courseId) {
    const coursePath = path.join(COURSES_DIR, courseId);
    if (!fs.existsSync(coursePath)) {
      fs.mkdirSync(coursePath, { recursive: true });
    }
  }
}

/**
 * Obtiene todos los cursos disponibles con sus lecciones y progreso actual.
 */
export async function getAllCourses(): Promise<Course[]> {
  ensureCoursesDir();
  const allProgress = await db.getAllCourseProgress();

  const courses: Course[] = [];
  const entries = Object.keys(COURSES_CATALOG);

  for (const courseId of entries) {
    const meta = COURSES_CATALOG[courseId];
    const lessons = await getCourseLessonsMeta(courseId);
    const progress = allProgress[courseId];
    const completedCount = progress ? progress.completedLessons.length : 0;
    const progressPercentage = lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

    courses.push({
      ...meta,
      lessonsCount: lessons.length,
      completedCount,
      progressPercentage,
      lessons,
    });
  }

  return courses;
}

/**
 * Obtiene la información de un curso por ID.
 */
export async function getCourseById(courseId: string): Promise<Course | null> {
  const meta = COURSES_CATALOG[courseId];
  if (!meta) return null;

  const lessons = await getCourseLessonsMeta(courseId);
  const progress = await db.getCourseProgress(courseId);
  const completedCount = progress ? progress.completedLessons.length : 0;
  const progressPercentage = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  return {
    ...meta,
    lessonsCount: lessons.length,
    completedCount,
    progressPercentage,
    lessons,
  };
}

/**
 * Lista todos los metadatos de lecciones de un curso, ordenados por orden / semana / día.
 */
export async function getCourseLessonsMeta(courseId: string): Promise<LessonMeta[]> {
  ensureCoursesDir(courseId);
  const coursePath = path.join(COURSES_DIR, courseId);

  if (!fs.existsSync(coursePath)) {
    return [];
  }

  const files = fs.readdirSync(coursePath).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  const lessons: LessonMeta[] = [];

  for (const filename of files) {
    const slug = filename.replace(/\.(md|mdx)$/, '');
    const fullPath = path.join(coursePath, filename);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { data } = matter(content);

    lessons.push({
      courseId,
      lessonSlug: slug,
      title: data.title || slug.replace(/^[0-9]+-/, '').replace(/-/g, ' '),
      week: Number(data.week) || 1,
      day: data.day || 'Lunes',
      order: Number(data.order) || 99,
      durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : 30,
      tags: Array.isArray(data.tags) ? data.tags : [],
      summary: data.summary || '',
    });
  }

  // Ordenar por 'order' ascendente
  return lessons.sort((a, b) => a.order - b.order);
}

/**
 * Obtiene una lección completa con su contenido Markdown y metadatos.
 */
export async function getLesson(courseId: string, lessonSlug: string): Promise<Lesson | null> {
  ensureCoursesDir(courseId);
  const coursePath = path.join(COURSES_DIR, courseId);

  let fullPath = path.join(coursePath, `${lessonSlug}.md`);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(coursePath, `${lessonSlug}.mdx`);
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContent = fs.readFileSync(fullPath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    courseId,
    lessonSlug,
    title: data.title || lessonSlug.replace(/^[0-9]+-/, '').replace(/-/g, ' '),
    week: Number(data.week) || 1,
    day: data.day || 'Lunes',
    order: Number(data.order) || 1,
    durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : 30,
    tags: Array.isArray(data.tags) ? data.tags : [],
    summary: data.summary || '',
    content,
  };
}

/**
 * Ingesta o actualización de una lección (usado por el API Ingestion)
 */
export async function saveOrUpdateLesson(params: {
  courseId: string;
  lessonSlug: string;
  title: string;
  week: number;
  day: string;
  order?: number;
  markdownContent: string;
  tags?: string[];
  summary?: string;
  durationMinutes?: number;
}): Promise<LessonMeta> {
  ensureCoursesDir(params.courseId);
  const coursePath = path.join(COURSES_DIR, params.courseId);
  const filePath = path.join(coursePath, `${params.lessonSlug}.md`);

  const frontmatter = {
    courseId: params.courseId,
    lessonSlug: params.lessonSlug,
    title: params.title,
    week: params.week,
    day: params.day,
    order: params.order ?? 99,
    durationMinutes: params.durationMinutes ?? 30,
    tags: params.tags ?? [],
    summary: params.summary ?? '',
  };

  const fileData = matter.stringify(params.markdownContent, frontmatter);
  fs.writeFileSync(filePath, fileData, 'utf-8');

  return {
    courseId: params.courseId,
    lessonSlug: params.lessonSlug,
    title: params.title,
    week: params.week,
    day: params.day,
    order: frontmatter.order,
    durationMinutes: frontmatter.durationMinutes,
    tags: frontmatter.tags,
    summary: frontmatter.summary,
  };
}
