import { NextRequest, NextResponse } from 'next/server';

const REMOTE_BACKEND_URL = 'https://apivacas.jariel.com.ar';

function getCandidates(): string[] {
  const envUrl = process.env.DATA_PROCESSOR_URL;
  if (envUrl) {
    return [envUrl, REMOTE_BACKEND_URL];
  }
  // En producción o Vercel, priorizar la URL pública
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return [REMOTE_BACKEND_URL, 'http://127.0.0.1:3000'];
  }
  return ['http://127.0.0.1:3000', REMOTE_BACKEND_URL];
}

async function safeFetchJson(url: string, options: RequestInit) {
  const res = await fetch(url, { ...options, cache: 'no-store' });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Respuesta no-JSON (${res.status}): ${text.slice(0, 120)}`);
  }
  const data = await res.json();
  return { data, status: res.status };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join('/');
  const search = request.nextUrl.search;
  const candidates = getCandidates();

  let lastError: any = null;

  for (const base of candidates) {
    const targetUrl = `${base}/api/escuela/${path}${search}`;
    try {
      const { data, status } = await safeFetchJson(targetUrl, {
        headers: { 'Content-Type': 'application/json' },
      });
      return NextResponse.json(data, { status });
    } catch (err: any) {
      lastError = err;
      // intentar siguiente candidato
    }
  }

  console.error(`❌ [API /api/escuela/${path}] Fallaron todos los candidatos:`, lastError?.message);
  return NextResponse.json(
    { success: false, error: 'No se pudo conectar al procesador de Escuela en el backend.', details: lastError?.message },
    { status: 502 }
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join('/');
  const candidates = getCandidates();

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}

  let lastError: any = null;

  for (const base of candidates) {
    const targetUrl = `${base}/api/escuela/${path}`;
    try {
      const { data, status } = await safeFetchJson(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return NextResponse.json(data, { status });
    } catch (err: any) {
      lastError = err;
    }
  }

  console.error(`❌ [API POST /api/escuela/${path}] Fallaron todos los candidatos:`, lastError?.message);
  return NextResponse.json(
    { success: false, error: 'No se pudo conectar al procesador de Escuela en el backend.', details: lastError?.message },
    { status: 502 }
  );
}
