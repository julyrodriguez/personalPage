import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const articles = await db.getNews(category);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    return NextResponse.json({ error: 'Error al obtener noticias' }, { status: 500 });
  }
}
