import { notFound } from 'next/navigation';
import { getCourseById, getCourseLessonsMeta, getLesson } from '@/lib/courses';
import { db } from '@/lib/db';
import { LessonSidebar } from '@/components/course/lesson-sidebar';
import { LessonReader } from '@/components/course/lesson-reader';

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonSlug: string;
  }>;
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { courseId, lessonSlug } = await params;
  const lesson = await getLesson(courseId, lessonSlug);
  if (!lesson) return { title: 'Clase no encontrada' };

  return {
    title: `${lesson.title} | Personal OS`,
    description: lesson.summary || `Lección ${lesson.title} en curso ${courseId}`,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonSlug } = await params;

  const [course, lesson, allLessonsMeta, progress] = await Promise.all([
    getCourseById(courseId),
    getLesson(courseId, lessonSlug),
    getCourseLessonsMeta(courseId),
    db.getCourseProgress(courseId),
  ]);

  if (!lesson || !course) {
    notFound();
  }

  // Update last visited lesson safely in the background
  try {
    await db.setLastVisitedLesson(courseId, lessonSlug);
  } catch (err) {
    console.warn('Could not record last visited lesson:', err);
  }

  // Find previous and next lessons
  const currentIndex = allLessonsMeta.findIndex((l) => l.lessonSlug === lessonSlug);
  const prevLesson = currentIndex > 0 ? allLessonsMeta[currentIndex - 1] : null;
  const nextLesson =
    currentIndex !== -1 && currentIndex < allLessonsMeta.length - 1
      ? allLessonsMeta[currentIndex + 1]
      : null;

  const isInitiallyCompleted = progress.completedLessons.includes(lessonSlug);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Collapsible Syllabus Sidebar */}
      <LessonSidebar
        courseId={courseId}
        courseTitle={course.title}
        currentLessonSlug={lessonSlug}
        lessons={allLessonsMeta}
        completedLessons={progress.completedLessons}
      />

      {/* Main Content Area: Lesson Reader */}
      <div className="flex-1 min-w-0 w-full">
        <LessonReader
          lesson={lesson}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          isInitiallyCompleted={isInitiallyCompleted}
        />
      </div>
    </div>
  );
}
