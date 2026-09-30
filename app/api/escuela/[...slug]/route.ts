import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.DATA_PROCESSOR_URL || 'http://127.0.0.1:3000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/escuela/${path}${search}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`❌ [API /api/escuela/${path}] Error conectando al backend:`, err.message);
    return NextResponse.json(
      { success: false, error: 'No se pudo conectar al procesador de Escuela en el backend.' },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join('/');
  const targetUrl = `${BACKEND_URL}/api/escuela/${path}`;

  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`❌ [API POST /api/escuela/${path}] Error conectando al backend:`, err.message);
    return NextResponse.json(
      { success: false, error: 'No se pudo conectar al procesador de Escuela en el backend.' },
      { status: 502 }
    );
  }
}
