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
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WebTerminalProps {
  className?: string;
}

interface TerminalSession {
  id: string;
  title: string;
}

const DEFAULT_SESSIONS: TerminalSession[] = [
  { id: 'personal-1', title: 'Terminal 1' },
];

const QUICK_COMMANDS = [
  { label: 'Ctrl + C', cmd: '\x03', desc: 'Cancelar / Interrumpir proceso activo (SIGINT)' },
  { label: 'Ctrl + O', cmd: '\x0f', desc: 'Atajo Ctrl + O' },
  { label: 'pm2 status', cmd: 'pm2 status\n', desc: 'Ver estado de servicios PM2' },
  { label: 'top', cmd: 'top\n', desc: 'Monitor de procesos top' },
];

export function WebTerminal({ className = '' }: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const touchCleanupRef = useRef<(() => void) | null>(null);

  const [sessions, setSessions] = useState<TerminalSession[]>(DEFAULT_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('personal-1');
  const activeSessionIdRef = useRef<string>('personal-1');

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar sesiones guardadas desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('personal_terminal_sessions');
      const savedActive = localStorage.getItem('personal_terminal_active');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          const initialActive =
            savedActive && parsed.some((s) => s.id === savedActive) ? savedActive : parsed[0].id;
          setActiveSessionId(initialActive);
          activeSessionIdRef.current = initialActive;
        }
      }
    } catch (e) {}
  }, []);

  const saveSessions = (updated: TerminalSession[], newActive?: string) => {
    setSessions(updated);
    try {
      localStorage.setItem('personal_terminal_sessions', JSON.stringify(updated));
      if (newActive) {
        localStorage.setItem('personal_terminal_active', newActive);
      }
    } catch (e) {}
  };

  const connectTerminal = useCallback(async (targetSessionId?: string) => {
    try {
      setStatus('connecting');
      setErrorMessage(null);

      const sessId = targetSessionId || activeSessionIdRef.current || 'personal-1';
      activeSessionIdRef.current = sessId;

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
      if (touchCleanupRef.current) {
        touchCleanupRef.current();
        touchCleanupRef.current = null;
      }

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

      // 3. Crear instancia Xterm con buffer de scrollback amplio
      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        scrollback: 10000,
        smoothScrollDuration: 120,
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

      // Soporte táctil nativo en celular para scrollear hacia arriba/abajo
      const termEl = terminalRef.current;
      let touchStartY = 0;
      let touchStartX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          touchStartY = e.touches[0].clientY;
          touchStartX = e.touches[0].clientX;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1 && termInstanceRef.current) {
          const currentY = e.touches[0].clientY;
          const currentX = e.touches[0].clientX;
          const deltaY = currentY - touchStartY;
          const deltaX = currentX - touchStartX;

          // Si el desplazamiento es predominantemente vertical, interceptar scroll
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) >= 8) {
            if (e.cancelable) {
              e.preventDefault();
            }
            const lines = Math.trunc(deltaY / 14);
            if (lines !== 0) {
              termInstanceRef.current.scrollLines(-lines);
              touchStartY = currentY;
              touchStartX = currentX;
            }
          }
        }
      };

      termEl.addEventListener('touchstart', handleTouchStart, { passive: true });
      termEl.addEventListener('touchmove', handleTouchMove, { passive: false });

      touchCleanupRef.current = () => {
        termEl.removeEventListener('touchstart', handleTouchStart);
        termEl.removeEventListener('touchmove', handleTouchMove);
      };

      termInstanceRef.current = term;
      fitAddonRef.current = fitAddon;

      // 4. Limpiar timers previos
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

      // 5. Conectar WebSocket a través de Cloudflare tunnel con la sesión seleccionada
      const fullUrl = `${wsUrl}?token=${encodeURIComponent(token)}&session=${encodeURIComponent(
        sessId
      )}&cols=${term.cols}&rows=${term.rows}`;
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

        // Heartbeat cada 12 segundos para mantener el túnel y el socket siempre activos
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch {}
          }
        }, 12000);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'output') {
            term.write(parsed.data);
          } else if (parsed.type === 'heartbeat' || parsed.type === 'pong') {
            // Heartbeat recibido, el socket sigue vivo
          } else if (parsed.type === 'exit') {
            term.writeln(`\r\n\x1b[33m[${parsed.data || `Proceso PTY finalizado`}]\x1b[0m\r\n`);
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
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        setStatus('disconnected');

        // Auto-reconectar en 2s si la pestaña sigue visible
        if (isMountedRef.current && typeof document !== 'undefined' && document.visibilityState === 'visible') {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && wsRef.current?.readyState !== WebSocket.OPEN) {
              connectTerminal(activeSessionIdRef.current);
            }
          }, 2000);
        }
      };

      ws.onerror = (err) => {
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        console.warn('[WebTerminal] Error en socket:', err);
        setStatus('error');
        setErrorMessage('Error al conectar con el servidor WebSocket.');
      };

      // 6. Enviar teclas del usuario hacia el PTY
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        } else {
          connectTerminal(activeSessionIdRef.current);
        }
      });
    } catch (err: any) {
      console.error('[WebTerminal] Error inicializando terminal:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Error desconocido');
    }
  }, []);

  // Inicializar al montar y gestionar reconexión al volver de otra app (ej. WhatsApp)
  useEffect(() => {
    isMountedRef.current = true;
    connectTerminal(activeSessionIdRef.current);

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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectTerminal(activeSessionIdRef.current);
        }
      }
    };

    const handleWindowFocus = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectTerminal(activeSessionIdRef.current);
      }
    };

    const handleOnline = () => {
      connectTerminal(activeSessionIdRef.current);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (touchCleanupRef.current) {
        touchCleanupRef.current();
        touchCleanupRef.current = null;
      }
      if (termInstanceRef.current) {
        try {
          termInstanceRef.current.dispose();
        } catch (e) {}
      }
    };
  }, [connectTerminal]);

  // Bloquear scroll de la página cuando la terminal está en pantalla completa
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Permitir salir de pantalla completa con la tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Al cambiar pantalla completa, reajustar tamaño inmediatamente y tras la animación CSS
  useEffect(() => {
    const handleFit = () => {
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

    handleFit();
    const t1 = setTimeout(handleFit, 60);
    const t2 = setTimeout(handleFit, 200);
    const t3 = setTimeout(handleFit, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFullscreen]);

  // Gestión de pestañas de sesiones
  const switchSession = (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    activeSessionIdRef.current = sessionId;
    try {
      localStorage.setItem('personal_terminal_active', sessionId);
    } catch (e) {}
    connectTerminal(sessionId);
  };

  const addNewSession = () => {
    if (sessions.length >= 6) {
      alert('Puedes tener hasta 6 pestañas de terminal simultáneas.');
      return;
    }
    const nextNum = sessions.length + 1;
    const newId = `personal-${Date.now()}`;
    const newSession: TerminalSession = {
      id: newId,
      title: `Terminal ${nextNum}`,
    };
    const updated = [...sessions, newSession];
    saveSessions(updated, newId);
    setActiveSessionId(newId);
    activeSessionIdRef.current = newId;
    connectTerminal(newId);
  };

  const closeSession = (sessionIdToClose: string) => {
    if (sessions.length <= 1) {
      if (window.confirm('¿Deseas reiniciar esta terminal desde cero?')) {
        handleResetSession();
      }
      return;
    }

    const sessionObj = sessions.find((s) => s.id === sessionIdToClose);
    if (
      !window.confirm(
        `¿Cerrar '${sessionObj?.title || 'la sesión'}'? Los procesos que corren en esta pestaña se finalizarán.`
      )
    ) {
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'kill', session: sessionIdToClose }));
      } catch (e) {}
    }

    const updated = sessions.filter((s) => s.id !== sessionIdToClose);
    let nextActive = activeSessionId;
    if (sessionIdToClose === activeSessionId) {
      nextActive = updated[0].id;
      setActiveSessionId(nextActive);
      activeSessionIdRef.current = nextActive;
      connectTerminal(nextActive);
    }
    saveSessions(updated, nextActive);
  };

  const renameSession = (sessionId: string) => {
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) return;
    const newTitle = window.prompt('Nombre de la pestaña:', current.title);
    if (newTitle && newTitle.trim()) {
      const updated = sessions.map((s) =>
        s.id === sessionId ? { ...s, title: newTitle.trim().slice(0, 20) } : s
      );
      saveSessions(updated);
    }
  };

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

  const handleResetSession = () => {
    const currentTitle = sessions.find((s) => s.id === activeSessionId)?.title || 'actual';
    if (
      typeof window !== 'undefined' &&
      window.confirm(
        `¿Deseas reiniciar '${currentTitle}' desde cero? Se cerrarán los procesos en segundo plano de esta pestaña.`
      )
    ) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'reset' }));
      }
      setTimeout(() => {
        connectTerminal(activeSessionId);
      }, 600);
    }
  };

  return (
    <div
      className={`transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-[100] h-[100dvh] w-screen bg-[#070b14] flex flex-col sm:inset-3 sm:rounded-2xl sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100vw-1.5rem)] sm:border sm:border-blue-500/40 shadow-2xl overflow-hidden'
          : `relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#070b14] shadow-md overflow-hidden flex flex-col ${className}`
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono font-semibold border border-blue-500/25 hidden sm:inline">
              tmux persistente
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono hidden md:inline flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              auto-cierre: 30m inactivo
            </span>
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

          {/* Reset Session Button */}
          <Button
            onClick={handleResetSession}
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 px-2 rounded-lg cursor-pointer"
            title="Reiniciar sesión persistente desde cero (cierra procesos en background)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* Reconnect Button */}
          <Button
            onClick={() => connectTerminal(activeSessionId)}
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
            className={`h-7 text-xs px-2 rounded-lg cursor-pointer transition-colors ${
              isFullscreen
                ? 'text-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa (ESC)' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Tabs Bar: Múltiples Sesiones */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#080d1a] border-b border-slate-800/80 overflow-x-auto text-xs shrink-0 select-none">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1 shrink-0">
          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Pestañas:</span>
        </div>

        {sessions.map((sess) => {
          const isActive = sess.id === activeSessionId;
          return (
            <div
              key={sess.id}
              onClick={() => switchSession(sess.id)}
              onDoubleClick={() => renameSession(sess.id)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-blue-600/25 text-blue-200 border-blue-500/50 font-semibold shadow-xs'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border-slate-800/80'
              }`}
              title="Clic para ver pestaña | Doble clic para renombrar"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className="max-w-[120px] truncate">{sess.title}</span>

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(sess.id);
                  }}
                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 p-0.5 rounded transition-all ml-0.5"
                  title="Cerrar esta pestaña"
                  aria-label="Cerrar pestaña"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Botón Nueva Sesión */}
        <button
          type="button"
          onClick={addNewSession}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-dashed border-slate-700/80 transition-all cursor-pointer shrink-0 ml-0.5"
          title="Abrir nueva sesión de terminal independiente"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Nueva Sesión</span>
        </button>
      </div>

      {/* Quick Commands Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#090d19] border-b border-slate-800/70 overflow-x-auto shrink-0 text-xs">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-semibold tracking-wider mr-1 shrink-0">
          <Command className="w-3 h-3 text-cyan-400" />
          <span>Atajos:</span>
        </div>

        {QUICK_COMMANDS.map((item) => {
          const isCtrlC = item.label === 'Ctrl + C';
          const isCtrlO = item.label === 'Ctrl + O';
          return (
            <button
              key={item.label}
              onClick={() => sendQuickCommand(item.cmd)}
              disabled={status !== 'connected'}
              className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                isCtrlC
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/50 font-bold shadow-xs'
                  : isCtrlO
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/50 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-cyan-300 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50'
              }`}
              title={item.desc}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error alert banner if disconnected */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 flex items-center justify-between px-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <Button
            onClick={() => connectTerminal(activeSessionId)}
            size="sm"
            variant="outline"
            className="h-6 text-[11px] border-rose-500/40 hover:bg-rose-500/20 text-white rounded px-2 cursor-pointer"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Terminal Viewport Canvas */}
      <div className={`relative w-full overflow-hidden ${isFullscreen ? 'flex-1 min-h-0' : 'h-[380px] sm:h-[450px]'}`}>
        <div
          ref={terminalRef}
          className="w-full h-full p-2.5 font-mono overflow-hidden focus:outline-none select-text"
          onClick={() => termInstanceRef.current?.focus()}
        />

        {/* Floating Quick Scroll Buttons (Subir / Bajar para celular) */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              termInstanceRef.current?.scrollPages(-1);
            }}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-90 text-slate-300 hover:text-cyan-300 border border-slate-700/60 shadow-lg flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
            title="Subir página"
            aria-label="Subir página"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              termInstanceRef.current?.scrollPages(1);
            }}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-90 text-slate-300 hover:text-cyan-300 border border-slate-700/60 shadow-lg flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
            title="Bajar página"
            aria-label="Bajar página"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Footer Info */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#060911] border-t border-slate-800/80 text-[11px] text-slate-500 font-mono shrink-0">
        <span>Soporta pestañas concurrentes, atajos y auto-cierre tras 30 min inactivo</span>
        <span className="text-slate-400">WebSocket Cifrado (WSS)</span>
      </div>
    </div>
  );
}
