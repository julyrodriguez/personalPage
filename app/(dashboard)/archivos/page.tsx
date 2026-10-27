'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderUp,
  Upload,
  File as FileIcon,
  FileText,
  FileCode,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  Copy,
  Check,
  Trash2,
  Download,
  RefreshCw,
  Terminal,
  HardDrive,
  Search,
  Link2,
  Plus,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServerFileItem {
  name: string;
  path: string;
  size: number;
  extension: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SERVER_DIR = '/home/julian/vacas-locas/archivos';
const DIRECT_BACKEND_URL = 'https://apivacas.jariel.com.ar/api/personal/files';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileIcon(ext: string) {
  const clean = (ext || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(clean)) {
    return <FileImage className="w-5 h-5 text-pink-500" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2'].includes(clean)) {
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  }
  if (
    ['js', 'ts', 'tsx', 'jsx', 'py', 'sh', 'json', 'yml', 'yaml', 'sql', 'html', 'css', 'env'].includes(
      clean
    )
  ) {
    return <FileCode className="w-5 h-5 text-cyan-500" />;
  }
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(clean)) {
    return <FileVideo className="w-5 h-5 text-purple-500" />;
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(clean)) {
    return <FileAudio className="w-5 h-5 text-indigo-500" />;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xlsx', 'xls'].includes(clean)) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  return <FileIcon className="w-5 h-5 text-slate-500" />;
}

export default function ArchivosPage() {
  const [files, setFiles] = useState<ServerFileItem[]>([]);
  const [serverDir, setServerDir] = useState<string>(DEFAULT_SERVER_DIR);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Upload states
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'text'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // URL download states
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [remoteFilename, setRemoteFilename] = useState<string>('');

  // Text / snippet file states
  const [textFilename, setTextFilename] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchFiles = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/files', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFiles(data.files || []);
          setServerDir(data.serverDir || DEFAULT_SERVER_DIR);
          setTotalBytes(data.totalBytes || 0);
        }
      }
    } catch (err) {
      console.error('Error cargando archivos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadWithXhr = (url: string, formData: FormData): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && json.success) {
            resolve(json);
          } else {
            reject(new Error(json.error || `Error HTTP ${xhr.status}`));
          }
        } catch {
          reject(new Error(`Error procesando respuesta (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Fallo de red en la subida'));
      xhr.send(formData);
    });
  };

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const selected = Array.from(fileList);
    if (selected.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setFeedback(null);

    const formData = new FormData();
    selected.forEach((f) => formData.append('files', f));

    try {
      let result: any;
      try {
        // Primero intentamos directo al backend del servidor para evitar límites de tamaño de Vercel
        result = await uploadWithXhr(DIRECT_BACKEND_URL, formData);
      } catch {
        // Fallback a la ruta local de Next.js (/api/files)
        result = await uploadWithXhr('/api/files', formData);
      }

      if (result.files) {
        setFiles(result.files);
        setTotalBytes(result.totalBytes || 0);
        if (result.serverDir) setServerDir(result.serverDir);
      } else {
        await fetchFiles();
      }

      setFeedback({
        type: 'success',
        message:
          result.message ||
          `${selected.length} archivo(s) descargado(s) en el servidor en ${serverDir}`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'No se pudieron subir los archivos al servidor.',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl.trim()) return;

    setUploading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: remoteUrl.trim(),
          filename: remoteFilename.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al descargar el archivo desde la URL');
      }

      setFiles(data.files || []);
      setTotalBytes(data.totalBytes || 0);
      setRemoteUrl('');
      setRemoteFilename('');
      setFeedback({
        type: 'success',
        message: data.message || 'Archivo descargado directamente en el servidor.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al descargar desde URL.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textFilename.trim()) return;

    setUploading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: textFilename.trim(),
          content: textContent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al crear el archivo en el servidor');
      }

      setFiles(data.files || []);
      setTotalBytes(data.totalBytes || 0);
      setTextFilename('');
      setTextContent('');
      setFeedback({
        type: 'success',
        message: data.message || 'Archivo creado directamente en el servidor.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al guardar el archivo.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`¿Eliminar "${filename}" del servidor?`)) return;

    try {
      const res = await fetch(`/api/files?name=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files || []);
        setTotalBytes(data.totalBytes || 0);
        setFeedback({
          type: 'success',
          message: `Archivo "${filename}" eliminado del servidor.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'No se pudo eliminar el archivo.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al eliminar archivo.',
      });
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <FolderUp className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Archivos al Servidor
            </h1>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-semibold"
            >
              Transferencia Directa
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Envía cualquier archivo desde tu navegador o celular para que se descargue y guarde directamente en este servidor.
          </p>
        </div>

        <Button
          onClick={() => fetchFiles(true)}
          disabled={refreshing || loading}
          size="sm"
          variant="outline"
          className="rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          <span>{refreshing ? 'Actualizando...' : 'Refrescar lista'}</span>
        </Button>
      </div>

      {/* Prominent Server Path Banner */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-950 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <HardDrive className="w-4 h-4" />
                <span>Ruta de Descarga en este Servidor</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <code className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 font-mono text-sm sm:text-base text-emerald-400 select-all">
                  {serverDir}
                </code>

                <Button
                  size="sm"
                  onClick={() => copyToClipboard(serverDir, 'dir-path')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs gap-1.5 h-9 cursor-pointer"
                >
                  {copiedKey === 'dir-path' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ruta copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar ruta</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => copyToClipboard(`cd ${serverDir} && ls -lh`, 'cd-cmd')}
                  className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 rounded-xl text-xs gap-1.5 h-9 cursor-pointer"
                >
                  {copiedKey === 'cd-cmd' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Comando copiado</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Copiar comando cd</span>
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-300">
                Todo lo que subas acá queda disponible al instante en el disco local del servidor en{' '}
                <span className="font-mono text-white">{serverDir}/&lt;nombre-archivo&gt;</span>.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
                <span className="block text-xs text-slate-400">Archivos</span>
                <span className="text-xl font-black text-white">{files.length}</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[120px]">
                <span className="block text-xs text-slate-400">Espacio usado</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatBytes(totalBytes)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Upload & Creation Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Enviar Archivos al Servidor
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Elige cómo quieres transferir el archivo a <code className="font-mono">{serverDir}</code>
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Archivo(s)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Desde URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Texto / Script</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFilesUpload(e.dataTransfer.files);
                }
              }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-500/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesUpload(e.target.files);
                  }
                }}
              />

              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Upload className={`w-6 h-6 ${uploading ? 'animate-bounce' : ''}`} />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {uploading
                  ? `Subiendo al servidor... (${uploadProgress}%)`
                  : 'Arrastra tus archivos aquí o haz clic para seleccionarlos'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Soporta cualquier tipo de archivo (ZIP, PDF, imágenes, scripts, backups, etc.) y subida múltiple.
              </p>

              {uploading && (
                <div className="max-w-md mx-auto mt-4">
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-200"
                      style={{ width: `${Math.max(5, uploadProgress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL directa del archivo *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://ejemplo.com/archivo.zip"
                    value={remoteUrl}
                    onChange={(e) => setRemoteUrl(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre en el servidor (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: instalador.zip"
                    value={remoteFilename}
                    onChange={(e) => setRemoteFilename(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={uploading || !remoteUrl.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Descargando en el servidor...' : 'Descargar en el Servidor'}</span>
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'text' && (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del archivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: script.sh, config.json, notas.txt"
                  value={textFilename}
                  onChange={(e) => setTextFilename(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contenido del archivo
                </label>
                <textarea
                  rows={6}
                  placeholder="Pega aquí tu código, script o texto..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={uploading || !textFilename.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Guardando...' : 'Guardar Archivo en el Servidor'}</span>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Files List Section */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Archivos Guardados en el Servidor ({filteredFiles.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {serverDir}
              </CardDescription>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar archivo por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Consultando archivos en {serverDir}...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
              <FolderUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No hay archivos en esta carpeta todavía</p>
              <p className="text-xs mt-1">
                Sube un archivo arriba y aparecerá aquí con su ruta exacta en el servidor.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredFiles.map((file) => {
                const fullPath = file.path || `${serverDir}/${file.name}`;
                const isCopied = copiedKey === `file-${file.name}`;

                return (
                  <div
                    key={file.name}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shrink-0">
                        {getFileIcon(file.extension)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {file.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {formatBytes(file.size)}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(file.updatedAt).toLocaleString('es-AR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-900/80 px-2 py-0.5 rounded-md truncate select-all">
                            {fullPath}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(fullPath, `file-${file.name}`)}
                        className="rounded-xl text-xs gap-1.5 h-8 cursor-pointer"
                        title="Copiar ruta absoluta del archivo en el servidor"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Ruta copiada</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar ruta</span>
                          </>
                        )}
                      </Button>

                      <a
                        href={`/api/files?download=${encodeURIComponent(file.name)}`}
                        download={file.name}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteFile(file.name)}
                        className="rounded-xl text-xs h-8 px-2.5 text-slate-400 hover:text-rose-600 hover:border-rose-500/30 cursor-pointer"
                        title="Eliminar del servidor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
