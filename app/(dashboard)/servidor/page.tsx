'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Terminal,
  RefreshCw,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Zap,
  Power,
  PowerOff,
  Thermometer,
  DollarSign,
  TrendingDown,
  Copy,
  Check,
  Search,
  Monitor,
  ShieldCheck,
  Flame,
  Radio,
  ExternalLink,
  ChevronDown,
  Filter,
  Lock,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WebTerminal } from '@/components/server/web-terminal';

interface ServerStatusData {
  success: boolean;
  timestamp: string;
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
    loadAvg: number[];
  };
  memory: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  disk?: {
    filesystem: string;
    total: string;
    used: string;
    available: string;
    percent: number;
    mount: string;
  };
  energy?: {
    available: boolean;
    source: string;
    pkgWatts: number;
    coresWatts: number;
    dramWatts: number;
    systemEstWatts: number;
    tempC: number;
    dailyKWh: number;
    monthlyCostArs: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  os: {
    platform: string;
    hostname: string;
  };
  pm2Processes: Array<{
    id: number;
    name: string;
    status: string;
    cpu: number;
    memoryMB: number;
    restarts: number;
    uptimeSec: number;
  }>;
  pm2Logs: Array<{
    type: string;
    app: string;
    text: string;
  }>;
  recentAppLogs: Array<{
    app: string;
    text: string;
  }>;
}

export default function ServidorPage() {
  const [data, setData] = useState<ServerStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [error, setError] = useState<string | null>(null);

  // PIN Protection States
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Check PIN session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/servidor/verify-pin');
        if (res.ok) {
          const json = await res.json();
          setIsUnlocked(json.unlocked === true);
        } else {
          setIsUnlocked(false);
        }
      } catch {
        setIsUnlocked(false);
      }
    };
    checkAuth();
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch('/api/servidor/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        setPinError(null);
        setPinInput('');
      } else {
        setPinError(data.error || 'PIN incorrecto. Reintenta.');
      }
    } catch {
      setPinError('Error al conectar con el servidor.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleLockServer = async () => {
    try {
      await fetch('/api/servidor/verify-pin', { method: 'DELETE' });
    } catch {}
    setIsUnlocked(false);
  };

  // PC Remote Control States
  const [powerActionLoading, setPowerActionLoading] = useState<'prender' | 'apagar' | null>(null);
  const [powerFeedback, setPowerFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);

  // Logs States
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('all');
  const [searchLogQuery, setSearchLogQuery] = useState<string>('');
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Fetch Server Telemetry
  const fetchStatus = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/server-status');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        setLastUpdated(new Date());
        setError(null);
        setSecondsLeft(20);
      } else {
        setError(json.error || 'Error al obtener telemetría del servidor');
      }
    } catch (err: any) {
      console.warn('Error fetching server telemetry:', err);
      setError(err.message || 'No se pudo conectar con el servidor VPS');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    if (!isUnlocked) return;
    fetchStatus();

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;

      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchStatus();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchStatus();
        setSecondsLeft(20);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus, isUnlocked]);

  // Handle PC Remote Control (Prender / Apagar)
  const handlePcPowerAction = async (action: 'prender' | 'apagar') => {
    try {
      setPowerActionLoading(action);
      setPowerFeedback(null);

      const res = await fetch('/api/pc-power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await res.json();

      if (res.ok && (result.success || result.status === 'success')) {
        setPowerFeedback({
          type: 'success',
          message:
            action === 'prender'
              ? '⚡ Paquete mágico Wake-on-LAN enviado a la PC con éxito.'
              : '🛑 Orden de apagado forzada enviada a la PC mediante SSH.',
        });
      } else {
        setPowerFeedback({
          type: 'error',
          message:
            result.error ||
            result.message ||
            `Error al intentar ${action === 'prender' ? 'encender' : 'apagar'} la PC.`,
        });
      }
    } catch (err: any) {
      setPowerFeedback({
        type: 'error',
        message: `Fallo de comunicación: ${err.message}`,
      });
    } finally {
      setPowerActionLoading(null);
      setShowShutdownConfirm(false);
    }
  };

  // Compile combined logs
  const combinedLogs = useMemo(() => {
    if (!data) return [];
    const logs: Array<{ id: string; app: string; text: string; isSystem: boolean }> = [];

    // PM2 daemon logs
    data.pm2Logs?.forEach((l, idx) => {
      logs.push({
        id: `pm2-${idx}`,
        app: 'pm2-daemon',
        text: l.text,
        isSystem: true,
      });
    });

    // App logs
    data.recentAppLogs?.forEach((l, idx) => {
      logs.push({
        id: `app-${idx}`,
        app: l.app || 'general',
        text: l.text,
        isSystem: false,
      });
    });

    return logs;
  }, [data]);

  // Unique apps for log filter
  const availableApps = useMemo(() => {
    const set = new Set<string>();
    combinedLogs.forEach((l) => set.add(l.app));
    return ['all', ...Array.from(set)];
  }, [combinedLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return combinedLogs.filter((l) => {
      const matchesApp = selectedAppFilter === 'all' || l.app === selectedAppFilter;
      const matchesQuery =
        !searchLogQuery.trim() ||
        l.text.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        l.app.toLowerCase().includes(searchLogQuery.toLowerCase());
      return matchesApp && matchesQuery;
    });
  }, [combinedLogs, selectedAppFilter, searchLogQuery]);

  const copyAllLogs = () => {
    const text = filteredLogs.map((l) => `[${l.app}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const getLogStyle = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('error') || lower.includes('fail') || lower.includes('fatal') || lower.includes('rejection')) {
      return 'text-rose-400 bg-rose-950/20 border-l-2 border-rose-500';
    }
    if (lower.includes('online') || lower.includes('conectada') || lower.includes('éxito') || lower.includes('actualizadas')) {
      return 'text-emerald-400 bg-emerald-950/15 border-l-2 border-emerald-500';
    }
    if (lower.includes('warn') || lower.includes('stopping') || lower.includes('timeout')) {
      return 'text-amber-400 bg-amber-950/15 border-l-2 border-amber-500';
    }
    return 'text-slate-300 border-l-2 border-slate-700/60';
  };

  const formatUptimeSec = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Pantalla de bloqueo si no está autenticado con el PIN
  if (isUnlocked === false || isUnlocked === null) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <CardHeader className="p-6 pb-4 text-center relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Servidor & Control Protegido
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto">
              Ingresa el PIN de seguridad configurado en Vercel (<code className="text-blue-500 font-mono font-semibold">SERVER_ACCESS_PIN</code>) para acceder al panel y a la Web Terminal.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 relative z-10">
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  autoFocus
                  placeholder="PIN de acceso (ej. 2001)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  className={`w-full px-4 py-3 text-center text-lg font-mono tracking-widest rounded-xl bg-slate-50 dark:bg-slate-800/80 border focus:outline-none transition-all ${
                    pinError
                      ? 'border-rose-500 focus:border-rose-500 text-rose-500 bg-rose-500/5'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white'
                  }`}
                />

                {pinError && (
                  <p className="text-xs text-rose-500 mt-2 text-center font-medium flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={pinLoading || !pinInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer gap-2 text-sm"
              >
                {pinLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>{pinLoading ? 'Verificando...' : 'Desbloquear Servidor'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <Server className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Servidor & Infraestructura
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold py-0.5 px-2.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitoreo en tiempo real de hardware, telemetría térmica de silicio RAPL, procesos PM2 y control de energía.
          </p>
        </div>

        {/* Refresh button, countdown & lock button */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Auto-refresh: {secondsLeft}s</span>
          </div>

          <Button
            onClick={() => fetchStatus(true)}
            disabled={refreshing || loading}
            size="sm"
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{refreshing ? 'Actualizando...' : 'Refrescar'}</span>
          </Button>

          <Button
            onClick={handleLockServer}
            size="sm"
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 text-xs text-slate-500 hover:text-rose-500 hover:border-rose-500/40 cursor-pointer"
            title="Bloquear acceso a la pestaña"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bloquear</span>
          </Button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Error al comunicar con el servidor</p>
            <p className="text-xs opacity-80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Feedback banner for PC Power Action */}
      {powerFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            powerFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {powerFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            )}
            <span className="font-medium">{powerFeedback.message}</span>
          </div>
          <button
            onClick={() => setPowerFeedback(null)}
            className="text-xs underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* SECTION 1: REMOTE PC POWER CONTROL */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-950 text-white shadow-lg overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="p-5 sm:p-6 pb-3 border-b border-white/10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  PC Personal de Escritorio
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[11px] font-mono">
                    Windows Desktop
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-300 mt-0.5">
                  Control remoto por red local mediante Wake-on-LAN y túnel SSH seguro.
                </CardDescription>
              </div>
            </div>

            {/* PC Technical Details */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                IP: <strong className="text-white">100.127.136.115</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                MAC: <strong className="text-white">D8:5E:D3:49:34:19</strong>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Action 1: Prender PC */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Encender PC de Escritorio
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Envía el paquete mágico Wake-on-LAN a la tarjeta de red (NIC) para prender el equipo remotamente.
                  </p>
                </div>
                <Button
                  onClick={() => handlePcPowerAction('prender')}
                  disabled={powerActionLoading !== null}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl gap-2 shadow-md shadow-emerald-900/40 shrink-0 cursor-pointer"
                >
                  <Power className={`w-4 h-4 ${powerActionLoading === 'prender' ? 'animate-spin' : ''}`} />
                  <span>{powerActionLoading === 'prender' ? 'Enviando...' : 'Prender PC'}</span>
                </Button>
              </div>
            </div>

            {/* Action 2: Apagar PC */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/40 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                      Apagar PC de Escritorio
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ejecuta orden SSH con apagado forzado (<code className="text-rose-300">shutdown /s /f /t 10</code>) en Windows.
                  </p>
                </div>

                {!showShutdownConfirm ? (
                  <Button
                    onClick={() => setShowShutdownConfirm(true)}
                    disabled={powerActionLoading !== null}
                    variant="destructive"
                    className="bg-rose-600/90 hover:bg-rose-600 text-white font-semibold rounded-xl gap-2 shadow-md shadow-rose-950/40 shrink-0 cursor-pointer"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>Apagar PC</span>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      onClick={() => handlePcPowerAction('apagar')}
                      disabled={powerActionLoading !== null}
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      {powerActionLoading === 'apagar' ? 'Apagando...' : 'Confirmar Apagado'}
                    </Button>
                    <Button
                      onClick={() => setShowShutdownConfirm(false)}
                      size="sm"
                      variant="ghost"
                      className="text-xs text-slate-400 hover:text-white rounded-lg h-7"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: HARDWARE, THERMALS & RAPL SILICON SENSORS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Telemetría de Hardware & Sensores en Silicio
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Host: {data?.os?.hostname || 'vacas-locas-server'} ({data?.os?.platform || 'linux'})
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Consumo Eléctrico Real (Watts) */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Consumo Eléctrico</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400">
                  RAPL
                </Badge>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {data?.energy?.systemEstWatts ?? '--'}
                </span>
                <span className="text-xs font-semibold text-amber-500">Watts</span>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>CPU Package:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{data?.energy?.pkgWatts ?? '--'} W</strong>
                </div>
                <div className="flex justify-between">
                  <span>Cores / RAM:</span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    {data?.energy?.coresWatts ?? '--'}W / {data?.energy?.dramWatts ?? '--'}W
                  </strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{
                    width: `${Math.min(100, Math.max(8, ((data?.energy?.systemEstWatts || 22) / 65) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Temperatura del Procesador */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  <span>Temperatura CPU</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                  Óptima
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {data?.energy?.tempC ?? 36}
                </span>
                <span className="text-xs font-semibold text-rose-500">°C</span>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Límite térmico:</span>
                  <strong className="text-slate-700 dark:text-slate-200">72°C TjMax</strong>
                </div>
                <div className="flex justify-between">
                  <span>Margen térmico:</span>
                  <strong className="text-emerald-500">+{72 - (data?.energy?.tempC || 36)}°C disponible</strong>
                </div>
              </div>

              {/* Thermal indicator bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, ((data?.energy?.tempC || 36) / 80) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Card 3: CPU Usage */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Cpu className="w-4 h-4 text-cyan-500" />
                  <span>Uso de CPU</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {data?.cpu?.cores || 4} Cores
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {data?.cpu?.usagePercent ?? 0}%
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  load {data?.cpu?.loadAvg?.[0] ?? '--'}
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>5m / 15m load:</span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    {data?.cpu?.loadAvg?.[1] ?? '--'} / {data?.cpu?.loadAvg?.[2] ?? '--'}
                  </strong>
                </div>
                <div className="truncate text-[10px] text-slate-400" title={data?.cpu?.model}>
                  {data?.cpu?.model || 'Intel Core i3-4170'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{
                    width: `${Math.min(100, Math.max(5, data?.cpu?.usagePercent ?? 0))}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Card 4: Memoria RAM */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Activity className="w-4 h-4 text-violet-500" />
                  <span>Memoria RAM</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {data?.memory?.totalGB || 8} GB Total
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {data?.memory?.usagePercent ?? 0}%
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {data?.memory?.usedGB ?? '--'} GB usada
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Libre:</span>
                  <strong className="text-emerald-500">{data?.memory?.freeGB ?? '--'} GB</strong>
                </div>
                <div className="flex justify-between">
                  <span>En caché/buffers:</span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    {data?.memory ? (data.memory.totalGB - data.memory.usedGB).toFixed(2) : '--'} GB
                  </strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-violet-500 to-purple-600"
                  style={{
                    width: `${Math.min(100, Math.max(5, data?.memory?.usagePercent ?? 0))}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Card 5: Disco SSD & Costo Estimado */}
          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group col-span-2 md:col-span-1">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <span>Disco & Costo</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  SSD {data?.disk?.total || '98G'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {data?.disk?.percent ?? 53}%
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {data?.disk?.used} / {data?.disk?.total}
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Costo eléctrico:</span>
                  <strong className="text-amber-500 font-bold">~${data?.energy?.monthlyCostArs ?? 1875}/mes</strong>
                </div>
                <div className="flex justify-between">
                  <span>Proyección diaria:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{data?.energy?.dailyKWh ?? '0.52'} kWh/d</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{
                    width: `${Math.min(100, Math.max(5, data?.disk?.percent || 53))}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: WEB TERMINAL INTERACTIVA (EN EL CENTRO) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Consola Interactiva en Vivo (Web Terminal)
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              SSH PTY
            </Badge>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Sesión Bash interactiva con usuario julian
          </span>
        </div>

        <WebTerminal />
      </div>

      {/* SECTION 4: PM2 PROCESSES */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Servicios & Procesos PM2
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {data?.pm2Processes?.length || 4} Activos
            </Badge>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Uptime del Sistema: {data?.uptime?.formatted || '30d 0h'}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Servicio / Módulo</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4 text-right">CPU</th>
                  <th className="py-2.5 px-4 text-right">Memoria</th>
                  <th className="py-2.5 px-4 text-right">Reinicios</th>
                  <th className="py-2.5 px-4 text-right">Tiempo Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {data?.pm2Processes?.map((proc) => {
                  const isOnline = proc.status === 'online';
                  return (
                    <tr
                      key={proc.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-slate-400 font-bold">#{proc.id}</td>
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{proc.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant="outline"
                          className={
                            isOnline
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px]'
                          }
                        >
                          {proc.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-200">
                        {proc.cpu.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-200">
                        {proc.memoryMB} MB
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{proc.restarts}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">
                        {formatUptimeSec(proc.uptimeSec)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: REAL-TIME LOGS TERMINAL */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-[#0c121e] text-slate-200 shadow-md overflow-hidden">
        {/* Terminal Header */}
        <CardHeader className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#080d17]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="font-mono text-xs font-bold text-white tracking-wide">
                Terminal de Salida & Logs del Sistema
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search query inside logs */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
              />
            </div>

            {/* Copy Button */}
            <Button
              onClick={copyAllLogs}
              size="sm"
              variant="outline"
              className="h-7 text-[11px] rounded-lg border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 gap-1 px-2.5 cursor-pointer"
            >
              {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLogs ? 'Copiados' : 'Copiar'}</span>
            </Button>
          </div>
        </CardHeader>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 overflow-x-auto text-xs">
          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mr-1 shrink-0">
            Filtro:
          </span>
          {availableApps.map((app) => (
            <button
              key={app}
              onClick={() => setSelectedAppFilter(app)}
              className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] transition-colors shrink-0 cursor-pointer ${
                selectedAppFilter === app
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {app === 'all' ? 'todos' : app}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-mono text-slate-500 shrink-0">
            {filteredLogs.length} líneas
          </span>
        </div>

        {/* Terminal Output Stream */}
        <CardContent className="p-4 font-mono text-[11px] leading-relaxed max-h-[360px] overflow-y-auto space-y-1 bg-[#060a12]">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No hay logs que coincidan con los filtros seleccionados.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`py-1 px-2 rounded font-mono text-xs transition-colors flex items-start gap-2.5 ${getLogStyle(
                  log.text
                )}`}
              >
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 shrink-0 font-sans font-semibold">
                  {log.app}
                </span>
                <span className="break-all whitespace-pre-wrap flex-1">{log.text}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
