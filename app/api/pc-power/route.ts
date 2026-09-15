import { NextRequest, NextResponse } from 'next/server';

const DATA_PROCESSOR_URL =
  process.env.DATA_PROCESSOR_URL || 'https://apivacas.jariel.com.ar';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action !== 'prender' && action !== 'apagar') {
      return NextResponse.json(
        { success: false, error: 'Acción no válida. Usar "prender" o "apagar".' },
        { status: 400 }
      );
    }

    const targetUrl = `${DATA_PROCESSOR_URL}/asistencia/${action}-pc`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok && data.success === false && data.status !== 'success') {
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || `Error ${res.status} desde el servidor`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      message:
        action === 'prender'
          ? 'Comando Wake-on-LAN enviado a la PC'
          : 'Orden de apagado SSH enviada a la PC',
      detail: data,
    });
  } catch (error: any) {
    console.error('Error al controlar energía de la PC:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No se pudo comunicar con el servidor de asistencia',
        detail: error.message,
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action !== 'prender' && action !== 'apagar') {
    return NextResponse.json(
      { success: false, error: 'Acción requerida: ?action=prender o ?action=apagar' },
      { status: 400 }
    );
  }

  const targetUrl = `${DATA_PROCESSOR_URL}/asistencia/${action}-pc`;

  try {
    const res = await fetch(targetUrl, {
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      success: res.ok,
      action,
      detail: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 502 }
    );
  }
}
