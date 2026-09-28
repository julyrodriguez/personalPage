'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Globe,
  Keyboard,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RemoteDesktopProps {
  className?: string;
  defaultFullscreen?: boolean;
}

const HTTPS_VNC_URL =
  'https://apivacas.jariel.com.ar/novnc/vnc.html?path=novnc/vnc&autoconnect=true&resize=scale&password=Vnc@2026&reconnect=true';

const TAILSCALE_VNC_URL =
  'http://100.109.27.9:8085/vnc.html?path=vnc&autoconnect=true&resize=scale&password=Vnc@2026&reconnect=true';

export function RemoteDesktop({ className = '', defaultFullscreen = false }: RemoteDesktopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const [iframeKey, setIframeKey] = useState(0);
  const [connectionMode, setConnectionMode] = useState<'https' | 'tailscale'>('https');
  const [vncUrl, setVncUrl] = useState<string>(HTTPS_VNC_URL);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar, seleccionar la URL adecuada según el protocolo (HTTPS para evitar mixed content)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      if (isHttps) {
        setConnectionMode('https');
        setVncUrl(HTTPS_VNC_URL);
      } else {
        // En entorno local HTTP, se puede usar directo o HTTPS
        setConnectionMode('https');
        setVncUrl(HTTPS_VNC_URL);
      }
    }
  }, []);

  const changeMode = (mode: 'https' | 'tailscale') => {
    setConnectionMode(mode);
    setIsLoading(true);
    setVncUrl(mode === 'https' ? HTTPS_VNC_URL : TAILSCALE_VNC_URL);
    setIframeKey((prev) => prev + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Escuchar cambios de fullscreen del navegador
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0 w-screen h-screen'
          : `w-full ${className}`
      }`}
    >
      {/* Barra Superior / Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0a0f1d] border-b border-slate-800 text-white select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">
                Windows 11 Desktop
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono flex items-center gap-1 py-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VNC Activo
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              PC: <span className="text-slate-200">100.127.136.115:5900</span> &bull; Gateway:{' '}
              <span className="text-slate-200">
                {connectionMode === 'https' ? 'Cloudflare HTTPS / WSS' : 'Tailscale :8085'}
              </span>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de modo / Gateway */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px]">
            <button
              onClick={() => changeMode('https')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                connectionMode === 'https'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Túnel HTTPS seguro (Sin errores Mixed Content)"
            >
              <Globe className="w-3 h-3" />
              <span>HTTPS (Seguro)</span>
            </button>
            <button
              onClick={() => changeMode('tailscale')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                connectionMode === 'tailscale'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Conexión HTTP directa por Tailscale (100.109.27.9:8085)"
            >
              <Layers className="w-3 h-3" />
              <span>Tailscale :8085</span>
            </button>
          </div>

          {/* Botón Recargar */}
          <Button
            onClick={handleReload}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs gap-1.5"
            title="Recargar sesión de escritorio"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Recargar</span>
          </Button>

          {/* Botón Abrir en ventana independiente */}
          <Button
            onClick={() => window.open(vncUrl, '_blank', 'noopener,noreferrer')}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs gap-1.5"
            title="Abrir en ventana independiente"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pestaña Completa</span>
          </Button>

          {/* Botón Pantalla Completa */}
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white text-xs gap-1.5"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pantalla Completa</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contenedor del Iframe de noVNC */}
      <div
        className={`relative w-full bg-black flex items-center justify-center ${
          isFullscreen ? 'flex-1 h-[calc(100vh-50px)]' : 'h-[640px] sm:h-[750px]'
        }`}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={vncUrl}
          onLoad={() => setIsLoading(false)}
          allow="clipboard-read; clipboard-write; fullscreen"
          className="w-full h-full border-0"
          title="Escritorio Remoto Windows 11"
        />
      </div>

      {/* Barra de Tips e Información */}
      {!isFullscreen && (
        <div className="px-4 py-2.5 bg-[#060a12] border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              Tip: Desplegá la <strong>barra lateral izquierda</strong> de noVNC para enviar{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                Ctrl+Alt+Del
              </kbd>
              , portapapeles o ajustar la escala.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto text-slate-400 font-mono text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {connectionMode === 'https' ? 'Túnel HTTPS Cloudflare SSL' : 'Túnel Tailscale WireGuard'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
