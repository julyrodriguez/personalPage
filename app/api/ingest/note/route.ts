import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { db } from '@/lib/db';

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
        { error: 'El campo "title" es requerido y debe ser un string.' },
        { status: 400 }
      );
    }

    if (typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'El campo "content" es requerido y debe ser un string con formato markdown.' },
        { status: 400 }
      );
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];

    const note = await db.createNote({
      title: body.title.trim(),
      content: body.content,
      tags,
      pinned: Boolean(body.pinned),
    });

    return NextResponse.json(
      {
        message: 'Nota ingestada exitosamente',
        note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/ingest/note:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la solicitud de nota.' },
      { status: 500 }
    );
  }
}
