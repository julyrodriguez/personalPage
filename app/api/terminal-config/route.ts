import { NextResponse } from 'next/server';

export async function GET() {
  const token =
    process.env.API_SECRET_KEY || 'pos_hub_secret_token_2025_power_user';

  // URL del endpoint WebSocket expuesto por Cloudflare / data-processor
  const wsUrl =
    process.env.NEXT_PUBLIC_WS_TERMINAL_URL ||
    'wss://apivacas.jariel.com.ar/api/personal/terminal';

  return NextResponse.json({
    success: true,
    wsUrl,
    token,
  });
}
