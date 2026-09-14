import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.API_VACAS_URL || 'https://apivacas.jariel.com.ar';
    const res = await fetch(`${apiUrl}/api/salon/appointments/week`, {
      next: { revalidate: 60 }, // Revalidar cada 1 minuto
    });

    if (!res.ok) {
      // Si el endpoint de semana aún no está disponible o falla, respondemos con array vacío y status
      return NextResponse.json({
        success: false,
        appointments: [],
        message: `Servidor apivacas respondió con status ${res.status}`,
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn('No se pudo obtener turnos de Caro Nails:', error.message);
    return NextResponse.json({
      success: false,
      appointments: [],
      error: error.message,
    });
  }
}
