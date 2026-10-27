import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REMOTE_BACKEND_URL = 'https://apivacas.jariel.com.ar';
const SERVER_FILES_DIR = '/home/julian/vacas-locas/archivos';

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

function sanitizeFileName(rawName: string): string {
  const base = path.basename(String(rawName || 'archivo'));
  const cleaned = base.replace(/[\/\\?%*:|"<>]/g, '_').trim();
  return cleaned || `archivo_${Date.now()}`;
}

function isLocalServerAvailable(): boolean {
  try {
    return fs.existsSync('/home/julian/vacas-locas');
  } catch {
    return false;
  }
}

function listLocalServerFiles() {
  if (!fs.existsSync(SERVER_FILES_DIR)) {
    fs.mkdirSync(SERVER_FILES_DIR, { recursive: true });
  }
  const entries = fs.readdirSync(SERVER_FILES_DIR, { withFileTypes: true });
  const files = [];
  let totalBytes = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(SERVER_FILES_DIR, entry.name);
    try {
      const stat = fs.statSync(fullPath);
      totalBytes += stat.size;
      files.push({
        name: entry.name,
        path: fullPath,
        size: stat.size,
        extension: path.extname(entry.name).toLowerCase().replace('.', '') || 'file',
        createdAt: (stat.birthtime || stat.mtime).toISOString(),
        updatedAt: stat.mtime.toISOString(),
      });
    } catch {}
  }

  files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { files, totalBytes };
}

export async function GET(request: NextRequest) {
  const downloadName = request.nextUrl.searchParams.get('download');

  // Si está corriendo localmente en este servidor
  if (isLocalServerAvailable()) {
    try {
      if (downloadName) {
        const safeName = sanitizeFileName(downloadName);
        const fullPath = path.join(SERVER_FILES_DIR, safeName);
        if (!fs.existsSync(fullPath)) {
          return NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });
        }
        const fileBuffer = fs.readFileSync(fullPath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Disposition': `attachment; filename="${encodeURIComponent(safeName)}"`,
            'Content-Type': 'application/octet-stream',
          },
        });
      }

      const { files, totalBytes } = listLocalServerFiles();
      return NextResponse.json({
        success: true,
        serverDir: SERVER_FILES_DIR,
        count: files.length,
        totalBytes,
        files,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Si está en Vercel u otro host remoto, consultar a data-processor (apivacas.jariel.com.ar)
  const candidates = getCandidates();
  for (const base of candidates) {
    try {
      if (downloadName) {
        const target = `${base}/api/personal/files/download/${encodeURIComponent(downloadName)}`;
        return NextResponse.redirect(target);
      }
      const res = await fetch(`${base}/api/personal/files`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {}
  }

  return NextResponse.json(
    { success: false, error: 'No se pudo conectar con el servidor de archivos.' },
    { status: 502 }
  );
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  // Si corre directamente en el servidor local
  if (isLocalServerAvailable()) {
    try {
      if (!fs.existsSync(SERVER_FILES_DIR)) {
        fs.mkdirSync(SERVER_FILES_DIR, { recursive: true });
      }

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const saved: Array<{ name: string; path: string; size: number }> = [];

        for (const [, value] of formData.entries()) {
          if (value instanceof File) {
            const safeName = sanitizeFileName(value.name);
            const fullPath = path.join(SERVER_FILES_DIR, safeName);
            const arrayBuffer = await value.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(fullPath, buffer);
            saved.push({ name: safeName, path: fullPath, size: buffer.length });
          }
        }

        if (saved.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No se recibió ningún archivo.' },
            { status: 400 }
          );
        }

        const { files, totalBytes } = listLocalServerFiles();
        return NextResponse.json(
          {
            success: true,
            message: `${saved.length} archivo(s) guardado(s) en ${SERVER_FILES_DIR}`,
            serverDir: SERVER_FILES_DIR,
            saved,
            totalBytes,
            files,
          },
          { status: 201 }
        );
      }

      // JSON body ({ url, filename } o { filename, content })
      const body = await request.json();
      if (body.url) {
        const cleanUrl = String(body.url).trim();
        const urlObj = new URL(cleanUrl);
        const inferred = path.basename(urlObj.pathname) || `descarga_${Date.now()}`;
        const safeName = sanitizeFileName(body.filename?.trim() ? body.filename.trim() : inferred);
        const fullPath = path.join(SERVER_FILES_DIR, safeName);

        const res = await fetch(cleanUrl);
        if (!res.ok) {
          throw new Error(`Error al descargar URL (HTTP ${res.status})`);
        }
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        fs.writeFileSync(fullPath, buf);

        const { files, totalBytes } = listLocalServerFiles();
        return NextResponse.json(
          {
            success: true,
            message: `Archivo descargado en ${fullPath}`,
            serverDir: SERVER_FILES_DIR,
            saved: [{ name: safeName, path: fullPath, size: buf.length }],
            totalBytes,
            files,
          },
          { status: 201 }
        );
      }

      if (body.filename && body.content !== undefined) {
        const safeName = sanitizeFileName(body.filename);
        const fullPath = path.join(SERVER_FILES_DIR, safeName);
        fs.writeFileSync(fullPath, String(body.content), 'utf8');
        const stat = fs.statSync(fullPath);

        const { files, totalBytes } = listLocalServerFiles();
        return NextResponse.json(
          {
            success: true,
            message: `Archivo guardado en ${fullPath}`,
            serverDir: SERVER_FILES_DIR,
            saved: [{ name: safeName, path: fullPath, size: stat.size }],
            totalBytes,
            files,
          },
          { status: 201 }
        );
      }
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Proxy hacia data-processor en el servidor VPS
  const candidates = getCandidates();
  for (const base of candidates) {
    try {
      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const res = await fetch(`${base}/api/personal/files`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } else {
        const body = await request.json();
        const res = await fetch(`${base}/api/personal/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
    } catch {}
  }

  return NextResponse.json(
    { success: false, error: 'No se pudo conectar con el servidor para guardar el archivo.' },
    { status: 502 }
  );
}

export async function DELETE(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('name');
  if (!filename) {
    return NextResponse.json({ success: false, error: 'Falta el parámetro ?name=' }, { status: 400 });
  }

  if (isLocalServerAvailable()) {
    try {
      const safeName = sanitizeFileName(filename);
      const fullPath = path.join(SERVER_FILES_DIR, safeName);
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });
      }
      fs.unlinkSync(fullPath);
      const { files, totalBytes } = listLocalServerFiles();
      return NextResponse.json({
        success: true,
        message: `Archivo ${safeName} eliminado`,
        serverDir: SERVER_FILES_DIR,
        totalBytes,
        files,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  const candidates = getCandidates();
  for (const base of candidates) {
    try {
      const res = await fetch(
        `${base}/api/personal/files/${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {}
  }

  return NextResponse.json(
    { success: false, error: 'No se pudo eliminar el archivo en el servidor.' },
    { status: 502 }
  );
}
