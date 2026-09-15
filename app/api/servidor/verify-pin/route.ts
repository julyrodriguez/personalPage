import { NextRequest, NextResponse } from 'next/server';

const REQUIRED_PIN = process.env.SERVER_ACCESS_PIN || '2001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = (body.pin || '').toString().trim();

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa el PIN de acceso.' },
        { status: 400 }
      );
    }

    if (pin !== REQUIRED_PIN.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN de seguridad incorrecto.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Acceso autorizado a la infraestructura.',
    });

    // Guardar cookie de sesión para la pestaña de servidor (expira en 1 hora o al cerrar navegador)
    response.cookies.set('server_tab_unlocked', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hora
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const isUnlocked = req.cookies.get('server_tab_unlocked')?.value === 'true';
  return NextResponse.json({
    unlocked: isUnlocked,
  });
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión de servidor bloqueada.',
  });

  response.cookies.delete('server_tab_unlocked');
  return response;
}
