import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get('courseId');
  try {
    if (courseId) {
      const progress = await db.getCourseProgress(courseId);
      return NextResponse.json(progress);
    }
    const all = await db.getAllCourseProgress();
    return NextResponse.json(all);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, lessonSlug, completed } = body;

    if (!courseId || !lessonSlug) {
      return NextResponse.json(
        { error: 'courseId y lessonSlug son obligatorios' },
        { status: 400 }
      );
    }

    const updated = await db.toggleLessonCompletion(courseId, lessonSlug, completed);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar progreso' }, { status: 500 });
  }
}
