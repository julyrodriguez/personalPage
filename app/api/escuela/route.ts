import { NextResponse } from 'next/server';

const REMOTE_BACKEND_URL = 'https://apivacas.jariel.com.ar';

function getCandidates(): string[] {
  const envUrl = process.env.DATA_PROCESSOR_URL;
  if (envUrl) {
    return [envUrl, REMOTE_BACKEND_URL];
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return [REMOTE_BACKEND_URL, 'http://127.0.0.1:3000'];
  }
  return ['http://127.0.0.1:3000', REMOTE_BACKEND_URL];
}

export async function GET() {
  const candidates = getCandidates();
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/escuela/stats`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}
  }

  return NextResponse.json(
    { success: false, error: 'Backend no disponible' },
    { status: 502 }
  );
}
