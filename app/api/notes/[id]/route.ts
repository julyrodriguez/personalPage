import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const updates = await request.json();
    const updated = await db.updateNote(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar la nota' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deleted = await db.deleteNote(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Nota eliminada' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar la nota' }, { status: 500 });
  }
}
