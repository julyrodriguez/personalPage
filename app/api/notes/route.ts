import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const notes = await db.getNotes();
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener notas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.content) {
      return NextResponse.json({ error: 'Título y contenido son requeridos' }, { status: 400 });
    }
    const note = await db.createNote({
      title: body.title.trim(),
      content: body.content,
      tags: Array.isArray(body.tags) ? body.tags : [],
      pinned: Boolean(body.pinned),
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear nota' }, { status: 500 });
  }
}
