import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { db } from '@/lib/db';
import { TaskPriority } from '@/types';

export async function POST(request: NextRequest) {
  // Validar autenticación
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { error: 'El campo "title" es requerido y debe ser un string no vacío.' },
        { status: 400 }
      );
    }

    const priority: TaskPriority = ['low', 'medium', 'high'].includes(body.priority)
      ? body.priority
      : 'medium';

    const task = await db.createTask({
      title: body.title.trim(),
      description: body.description || '',
      dueDate: body.dueDate,
      priority,
      category: body.category || 'General',
      status: 'pending',
    });

    return NextResponse.json(
      {
        message: 'Tarea ingestada exitosamente',
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/ingest/task:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la solicitud de tarea.' },
      { status: 500 }
    );
  }
}
