import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || !verifyPassword(password)) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta. Acceso denegado.' },
        { status: 401 }
      );
    }

    const token = generateSessionToken();
    const response = NextResponse.json({ success: true, message: 'Autenticado con éxito' });

    // Set HttpOnly secure cookie for 30 days
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando autenticación' }, { status: 500 });
  }
}
