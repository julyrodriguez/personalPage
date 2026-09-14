import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Course, Lesson, LessonMeta } from '@/types';
import { db } from './db';

const COURSES_DIR = process.env.COURSES_DIR
  ? path.resolve(process.env.COURSES_DIR)
  : path.resolve(process.cwd(), 'content/courses');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');

const COURSES_FILE = path.join(DATA_DIR, 'courses.json');

type CourseCatalogItem = Omit<Course, 'lessons' | 'lessonsCount' | 'completedCount' | 'progressPercentage'>;

const INITIAL_CATALOG: CourseCatalogItem[] = [
  {
    id: 'power-bi',
    title: 'Power BI Masterclass: De Cero a Arquitecto Analítico',
    description: 'Domina Power Query (M), Modelado Dimensional en Estrella, DAX avanzado con Inteligencia de Tiempo, RLS dinámico y Optimización VertiPaq.',
    category: 'Business Intelligence & Data',
    level: 'Avanzado',
    estimatedHours: 40,
    tags: ['Power BI', 'DAX', 'Power Query', 'M', 'Modelado Dimensional', 'SQL'],
  },
];

export function getCoursesCatalog(): Record<string, CourseCatalogItem> {
  const map: Record<string, CourseCatalogItem> = {};
  INITIAL_CATALOG.forEach((c) => (map[c.id] = c));

  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        // Read-only FS
      }
    }

    if (!fs.existsSync(COURSES_FILE)) {
      try {
        fs.writeFileSync(COURSES_FILE, JSON.stringify(INITIAL_CATALOG, null, 2), 'utf-8');
      } catch {
        // Read-only FS
      }
      return map;
    }

    const raw = fs.readFileSync(COURSES_FILE, 'utf-8');
    const list: CourseCatalogItem[] = JSON.parse(raw);
    const parsedMap: Record<string, CourseCatalogItem> = {};
    list.forEach((c) => (parsedMap[c.id] = c));
    return parsedMap;
  } catch (error) {
    console.warn('Error reading courses.json, returning initial catalog:', error);
    return map;
  }
}

export async function saveOrUpdateCourse(data: CourseCatalogItem): Promise<CourseCatalogItem> {
  const catalog = getCoursesCatalog();
  catalog[data.id] = {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
    estimatedHours: Number(data.estimatedHours) || 20,
    level: data.level || 'Intermedio',
  };

  const list = Object.values(catalog);
  try {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist course update (read-only FS):', err);
  }
  ensureCoursesDir(data.id);
  return catalog[data.id];
}

function ensureCoursesDir(courseId?: string) {
  try {
    if (!fs.existsSync(COURSES_DIR)) {
      fs.mkdirSync(COURSES_DIR, { recursive: true });
    }
    if (courseId) {
      const coursePath = path.join(COURSES_DIR, courseId);
      if (!fs.existsSync(coursePath)) {
        fs.mkdirSync(coursePath, { recursive: true });
      }
    }
  } catch (err) {
    // Read-only filesystem, ignore
  }
}

/**
 * Obtiene todos los cursos disponibles con sus lecciones y progreso actual.
 */
export async function getAllCourses(): Promise<Course[]> {
  ensureCoursesDir();
  const allProgress = await db.getAllCourseProgress();
  const catalog = getCoursesCatalog();

  const courses: Course[] = [];
  const entries = Object.keys(catalog);

  for (const courseId of entries) {
    const meta = catalog[courseId];
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
  const catalog = getCoursesCatalog();
  const meta = catalog[courseId];
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
