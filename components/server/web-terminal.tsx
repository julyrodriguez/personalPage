'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  Trash2,
  Sparkles,
  Command,
  Check,
  AlertCircle,
  ShieldCheck,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WebTerminalProps {
  className?: string;
}

const QUICK_COMMANDS = [
  { label: 'pm2 status', cmd: 'pm2 status\n', desc: 'Ver estado de servicios' },
  { label: 'pm2 logs', cmd: 'pm2 logs --lines 25 --nostream\n', desc: 'Últimas 25 líneas de logs' },
  { label: 'htop', cmd: 'htop\n', desc: 'Monitor de procesos en vivo' },
  { label: 'espacio (df -h)', cmd: 'df -h /\n', desc: 'Espacio en disco SSD' },
  { label: 'memoria (free -m)', cmd: 'free -h\n', desc: 'Memoria RAM y Swap' },
  { label: 'uptime & load', cmd: 'uptime\n', desc: 'Tiempo activo y carga' },
  { label: 'git status', cmd: 'git status\n', desc: 'Estado de git en personal' },
];

export function WebTerminal({ className = '' }: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const connectTerminal = useCallback(async () => {
    try {
      setStatus('connecting');
      setErrorMessage(null);

      // 1. Obtener configuración y token desde el endpoint local del dashboard
      const configRes = await fetch('/api/terminal-config');
      if (!configRes.ok) {
        throw new Error('No se pudo obtener la configuración de la terminal.');
      }
      const config = await configRes.json();
      const { wsUrl, token } = config;

      // 2. Importar módulos de Xterm dinámicamente en el cliente
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');

      // Limpiar terminal previa si existía
      if (termInstanceRef.current) {
        try {
          termInstanceRef.current.dispose();
        } catch (e) {}
      }

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }

      if (!terminalRef.current) return;
      terminalRef.current.innerHTML = '';

      // 3. Crear instancia Xterm
      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        theme: {
          background: '#070b14',
          foreground: '#e2e8f0',
          cursor: '#38bdf8',
          cursorAccent: '#070b14',
          selectionBackground: '#1e3a8a',
          black: '#0f172a',
          red: '#ef4444',
          green: '#10b981',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          magenta: '#d946ef',
          cyan: '#06b6d4',
          white: '#f8fafc',
          brightBlack: '#475569',
          brightRed: '#f87171',
          brightGreen: '#34d399',
          brightYellow: '#fbbf24',
          brightBlue: '#60a5fa',
          brightMagenta: '#e879f9',
          brightCyan: '#22d3ee',
          brightWhite: '#ffffff',
        },
        convertEol: true,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(terminalRef.current);
      fitAddon.fit();

      termInstanceRef.current = term;
      fitAddonRef.current = fitAddon;

      // 4. Conectar WebSocket a través de Cloudflare tunnel
      const fullUrl = `${wsUrl}?token=${encodeURIComponent(token)}&cols=${term.cols}&rows=${term.rows}`;
      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setErrorMessage(null);
        // Ajustar tamaño con el PTY del servidor
        ws.send(
          JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'output') {
            term.write(parsed.data);
          } else if (parsed.type === 'exit') {
            term.writeln(`\r\n\x1b[33m[Proceso PTY terminado con código ${parsed.code}]\x1b[0m\r\n`);
            setStatus('disconnected');
          } else if (parsed.type === 'error') {
            term.writeln(`\r\n\x1b[31m[Error: ${parsed.data}]\x1b[0m\r\n`);
            setStatus('error');
          }
        } catch {
          term.write(event.data);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
      };

      ws.onerror = (err) => {
        console.warn('[WebTerminal] Error en socket:', err);
        setStatus('error');
        setErrorMessage('Error al conectar con el servidor WebSocket.');
      };

      // 5. Enviar teclas del usuario hacia el PTY
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });
    } catch (err: any) {
      console.error('[WebTerminal] Error inicializando terminal:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Error desconocido');
    }
  }, []);

  // Inicializar al montar
  useEffect(() => {
    connectTerminal();

    const handleResize = () => {
      if (fitAddonRef.current && termInstanceRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        wsRef.current.send(
          JSON.stringify({
            type: 'resize',
            cols: termInstanceRef.current.cols,
            rows: termInstanceRef.current.rows,
          })
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (termInstanceRef.current) {
        try {
          termInstanceRef.current.dispose();
        } catch (e) {}
      }
    };
  }, [connectTerminal]);

  // Al cambiar pantalla completa, reajustar tamaño
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fitAddonRef.current && termInstanceRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        wsRef.current.send(
          JSON.stringify({
            type: 'resize',
            cols: termInstanceRef.current.cols,
            rows: termInstanceRef.current.rows,
          })
        );
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Enviar comando rápido
  const sendQuickCommand = (cmd: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: cmd }));
      termInstanceRef.current?.focus();
    }
  };

  const clearTerminal = () => {
    termInstanceRef.current?.clear();
    termInstanceRef.current?.focus();
  };

  return (
    <div
      className={`relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl bg-[#070b14] border border-blue-500/40 flex flex-col'
          : `rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#070b14] shadow-md overflow-hidden flex flex-col ${className}`
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0a0f1d] border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mac / Terminal Window Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/90 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-amber-500/90 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-xs" />
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-200">
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <span className="font-bold tracking-wide">Web Terminal Interactiva</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">bash (julian@vacas-locas-server)</span>
          </div>
        </div>

        {/* Status Badge & Controls */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[11px] font-mono py-0 px-2 flex items-center gap-1.5 ${
              status === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : status === 'connecting'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : status === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {status === 'connected'
                ? 'Conectado (WSS)'
                : status === 'connecting'
                ? 'Conectando...'
                : status === 'error'
                ? 'Error'
                : 'Desconectado'}
            </span>
          </Badge>

          {/* Clear Button */}
          <Button
            onClick={clearTerminal}
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 px-2 rounded-lg cursor-pointer"
            title="Limpiar pantalla"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>

          {/* Reconnect Button */}
          <Button
            onClick={connectTerminal}
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 px-2 rounded-lg cursor-pointer"
            title="Reconectar terminal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'connecting' ? 'animate-spin text-blue-400' : ''}`} />
          </Button>

          {/* Fullscreen Button */}
          <Button
            onClick={() => setIsFullscreen(!isFullscreen)}
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 px-2 rounded-lg cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Quick Commands Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#090d19] border-b border-slate-800/70 overflow-x-auto shrink-0 text-xs">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-semibold tracking-wider mr-1 shrink-0">
          <Command className="w-3 h-3 text-cyan-400" />
          <span>Atajos:</span>
        </div>

        {QUICK_COMMANDS.map((item) => (
          <button
            key={item.label}
            onClick={() => sendQuickCommand(item.cmd)}
            disabled={status !== 'connected'}
            className="px-2 py-0.5 rounded-md font-mono text-[11px] text-slate-300 hover:text-cyan-300 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50 transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title={item.desc}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Error alert banner if disconnected */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 flex items-center justify-between px-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <Button
            onClick={connectTerminal}
            size="sm"
            variant="outline"
            className="h-6 text-[11px] border-rose-500/40 hover:bg-rose-500/20 text-white rounded px-2 cursor-pointer"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Terminal Viewport Canvas */}
      <div
        ref={terminalRef}
        className={`w-full p-2.5 font-mono overflow-hidden focus:outline-none ${
          isFullscreen ? 'flex-1 min-h-0' : 'h-[380px] sm:h-[420px]'
        }`}
        onClick={() => termInstanceRef.current?.focus()}
      />

      {/* Terminal Footer Info */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#060911] border-t border-slate-800/80 text-[11px] text-slate-500 font-mono shrink-0">
        <span>Soporta teclas interactivas, Ctrl+C, Ctrl+L, Tab y flechas arriba/abajo</span>
        <span className="text-slate-400">WebSocket Cifrado (WSS)</span>
      </div>
    </div>
  );
}
