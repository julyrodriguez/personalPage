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
        { error: 'El campo "title" es requerido y no puede estar vacío.' },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
      return NextResponse.json(
        { error: 'El campo "content" con el artículo completo en Markdown es requerido.' },
        { status: 400 }
      );
    }

    const article = await db.createNews({
      title: body.title.trim(),
      content: body.content,
      summary: body.summary || body.content.slice(0, 200).replace(/[#*`]/g, '').trim() + '...',
      source: body.source || 'Agente Externo',
      url: body.url || '',
      imageUrl: body.imageUrl || '',
      category: body.category || 'General',
      tags: Array.isArray(body.tags) ? body.tags : [],
      important: body.important !== undefined ? Boolean(body.important) : true,
      publishedAt: body.publishedAt || new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Artículo de noticia publicado exitosamente',
        article,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/ingest/news:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar el artículo de noticia.' },
      { status: 500 }
    );
  }
}
