import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.DATA_PROCESSOR_URL || 'http://127.0.0.1:3000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/escuela/stats`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Backend no disponible' },
      { status: 502 }
    );
  }
}
