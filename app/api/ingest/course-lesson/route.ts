import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { saveOrUpdateLesson } from '@/lib/courses';

export async function POST(request: NextRequest) {
  // Validar autenticación
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { courseId, lessonSlug, title, week, day, markdownContent, order, tags, summary, durationMinutes } = body;

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'El campo "courseId" es requerido.' }, { status: 400 });
    }
    if (!lessonSlug || typeof lessonSlug !== 'string') {
      return NextResponse.json({ error: 'El campo "lessonSlug" es requerido.' }, { status: 400 });
    }
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'El campo "title" es requerido.' }, { status: 400 });
    }
    if (typeof week !== 'number') {
      return NextResponse.json({ error: 'El campo "week" es requerido y debe ser un número.' }, { status: 400 });
    }
    if (!day || typeof day !== 'string') {
      return NextResponse.json({ error: 'El campo "day" es requerido.' }, { status: 400 });
    }
    if (typeof markdownContent !== 'string') {
      return NextResponse.json({ error: 'El campo "markdownContent" es requerido.' }, { status: 400 });
    }

    const savedLesson = await saveOrUpdateLesson({
      courseId: courseId.trim().toLowerCase(),
      lessonSlug: lessonSlug.trim().toLowerCase(),
      title: title.trim(),
      week,
      day: day.trim(),
      order: typeof order === 'number' ? order : undefined,
      markdownContent,
      tags: Array.isArray(tags) ? tags : [],
      summary: typeof summary === 'string' ? summary : '',
      durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : 45,
    });

    return NextResponse.json(
      {
        message: 'Clase guardada o actualizada con éxito',
        lesson: savedLesson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/ingest/course-lesson:', error);
    return NextResponse.json(
      { error: 'Error interno al guardar la clase del curso.' },
      { status: 500 }
    );
  }
}
