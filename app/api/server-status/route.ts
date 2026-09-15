import { NextResponse } from 'next/server';

const BACKEND_STATUS_URL = process.env.DATA_PROCESSOR_URL
  ? `${process.env.DATA_PROCESSOR_URL}/api/personal/server-status`
  : 'https://apivacas.jariel.com.ar/api/personal/server-status';

export async function GET() {
  try {
    const res = await fetch(BACKEND_STATUS_URL, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Backend returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'No se pudo conectar con el servidor VPS',
        detail: error.message,
      },
      { status: 502 }
    );
  }
}
