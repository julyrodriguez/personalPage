import { NextRequest } from 'next/server';

export const SESSION_COOKIE_NAME = 'personal_os_session';

export function getDashboardPassword(): string {
  return process.env.DASHBOARD_PASSWORD || 'julian2025';
}

export function verifyPassword(password: string): boolean {
  const expected = getDashboardPassword();
  return password.trim() === expected.trim();
}

export function generateSessionToken(): string {
  const secret = process.env.API_SECRET_KEY || 'pos_hub_secret_token_2025_power_user';
  const pass = getDashboardPassword();
  const raw = `pos_session_${secret}_${pass}_authenticated`;
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(raw).toString('base64url');
  }
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isValidSession(token?: string): boolean {
  if (!token) return false;
  return token === generateSessionToken();
}

/**
 * Valida la cabecera de autorización de peticiones entrantes para agentes externos.
 * Acepta:
 * - Authorization: Bearer <API_SECRET_KEY>
 * - x-api-key: <API_SECRET_KEY>
 */
export function validateApiKey(request: Request | NextRequest): { valid: boolean; error?: string } {
  const secretKey = process.env.API_SECRET_KEY || process.env.INGESTION_SECRET_KEY;

  if (!secretKey) {
    return {
      valid: false,
      error: 'API_SECRET_KEY no está configurada en las variables de entorno del servidor.',
    };
  }

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const xApiKey = request.headers.get('x-api-key');

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      if (parts[1].trim() === secretKey.trim()) {
        return { valid: true };
      }
    }
  }

  if (xApiKey && xApiKey.trim() === secretKey.trim()) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Token de autorización inválido o ausente. Enviar cabecera Authorization: Bearer <INGESTION_SECRET_KEY>',
  };
}
