import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { saveOrUpdateCourse } from '@/lib/courses';

export async function POST(request: NextRequest) {
  // Validar autenticación
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body.id !== 'string' || !body.id.trim()) {
      return NextResponse.json(
        { error: 'El campo "id" es requerido y debe ser un slug (ej: "machine-learning").' },
        { status: 400 }
      );
    }

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { error: 'El campo "title" es requerido.' },
        { status: 400 }
      );
    }

    const courseId = body.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    const course = await saveOrUpdateCourse({
      id: courseId,
      title: body.title.trim(),
      description: body.description || '',
      category: body.category || 'General',
      level: ['Principiante', 'Intermedio', 'Avanzado'].includes(body.level)
        ? body.level
        : 'Intermedio',
      estimatedHours: typeof body.estimatedHours === 'number' ? body.estimatedHours : 20,
      tags: Array.isArray(body.tags) ? body.tags : [],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Curso registrado o actualizado con éxito',
        course,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/ingest/course:', error);
    return NextResponse.json(
      { error: 'Error interno al registrar el curso.' },
      { status: 500 }
    );
  }
}
