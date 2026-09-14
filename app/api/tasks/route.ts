import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tasks = await db.getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
    }
    const task = await db.createTask({
      title: body.title.trim(),
      description: body.description || '',
      dueDate: body.dueDate,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      category: body.category || 'General',
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 });
  }
}
