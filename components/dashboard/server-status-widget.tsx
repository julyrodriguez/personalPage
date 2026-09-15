'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export function ServerStatusWidget() {
  const [data, setData] = useState<ServerStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [logTab, setLogTab] = useState<'pm2' | 'apps'>('pm2');
  const [error, setError] = useState<string | null>(null);

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
        setSecondsLeft(30);
      } else {
        setError(json.error || 'Error al obtener estado');
      }
    } catch (err: any) {
      console.warn('Error fetching server status:', err);
      setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Poll every 30 seconds while the page is open and active
  useEffect(() => {
    fetchStatus();

    const timer = setInterval(() => {
      // Don't count down or poll if user has the tab hidden/minimized
      if (typeof document !== 'undefined' && document.hidden) return;

      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchStatus();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        // When tab is reopened, immediately refresh
        fetchStatus();
        setSecondsLeft(30);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getLogLineStyle = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('error') || lower.includes('fail') || lower.includes('killed')) {
      return 'text-rose-400 border-l-2 border-rose-500 bg-rose-500/5';
    }
    if (lower.includes('online') || lower.includes('iniciado') || lower.includes('conectada') || lower.includes('éxito')) {
      return 'text-emerald-400 border-l-2 border-emerald-500 bg-emerald-500/5';
    }
    if (lower.includes('stopping') || lower.includes('warning') || lower.includes('timeout')) {
      return 'text-amber-400 border-l-2 border-amber-500 bg-amber-500/5';
    }
    return 'text-slate-300 border-l-2 border-slate-700 bg-transparent';
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 shadow-sm overflow-hidden">
      {/* Widget Header */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Estado del Servidor VPS
              </CardTitle>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoreo en tiempo real de hardware y PM2 · En vivo (cada 30s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-mono px-2 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>sync en {secondsLeft}s</span>
          </span>

          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="h-8 rounded-xl text-xs gap-1.5 px-3 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden xs:inline">Actualizar</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Conectando con el servidor VPS...</p>
          </div>
        ) : error && !data ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">No se pudo contactar al servidor</p>
              <p className="text-[11px] opacity-80 mt-0.5">{error}</p>
            </div>
          </div>
        ) : data ? (
          <>
            {/* Display de Métricas Principales (CPU / RAM / Disco / Energía / Uptime) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* CPU Card */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Cpu className="w-4 h-4 text-cyan-500" />
                    <span>CPU Usage</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {data.cpu.cores} Cores
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {data.cpu.usagePercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    load {data.cpu.loadAvg[0]}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/50 mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-blue-600"
                    style={{ width: `${Math.min(100, Math.max(5, data.cpu.usagePercent))}%` }}
                  />
                </div>
              </div>

              {/* RAM Card */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Activity className="w-4 h-4 text-violet-500" />
                    <span>Memoria RAM</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {data.memory.totalGB} GB
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {data.memory.usagePercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {data.memory.usedGB} GB usada
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/50 mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-violet-500 to-fuchsia-600"
                    style={{ width: `${Math.min(100, Math.max(5, data.memory.usagePercent))}%` }}
                  />
                </div>
              </div>

              {/* Energy & Temp Card (Hardware Sensors) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    <span>Consumo Eléctrico</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                    {data.energy?.tempC ? `${data.energy.tempC}°C` : '31°C'}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {data.energy?.systemEstWatts || 22} W
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    CPU {data.energy?.pkgWatts || 10}W
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/50 mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, ((data.energy?.systemEstWatts || 22) / 65) * 100)
                      )}%`,
                    }}
                  />
                </div>

                <p className="text-[10px] text-slate-400 mt-2 font-mono truncate">
                  ~${data.energy?.monthlyCostArs?.toLocaleString('es-AR') || '1.890'}/mes ARS
                </p>
              </div>

              {/* Disk Card */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <HardDrive className="w-4 h-4 text-emerald-500" />
                    <span>Disco SSD</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {data.disk?.total || '98G'}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {data.disk?.percent || 53}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {data.disk?.used} / {data.disk?.total}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/50 mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${Math.min(100, Math.max(5, data.disk?.percent || 53))}%` }}
                  />
                </div>
              </div>

              {/* Uptime Card */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Uptime</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {data.os.platform}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {data.uptime.formatted}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono truncate">
                  host: {data.os.hostname}
                </p>
              </div>
            </div>

            {/* PM2 Processes Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  Procesos PM2 Activos ({data.pm2Processes.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {data.pm2Processes.map((proc) => {
                  const isOnline = proc.status === 'online';
                  return (
                    <div
                      key={proc.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {proc.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {proc.memoryMB} MB · {proc.cpu}% CPU
                        </p>
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-400 pl-2">
                        <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 block">
                          id:{proc.id}
                        </span>
                        <span className="text-[9px] block mt-0.5">
                          {formatUptime(proc.uptimeSec)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PM2 Logs Card (Últimos 5 logs) */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-md">
              {/* Card Terminal Header */}
              <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5 pl-2 border-l border-slate-800">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Últimos 5 Logs de PM2
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center p-0.5 bg-slate-800/90 rounded-lg text-[10px] font-mono">
                    <button
                      onClick={() => setLogTab('pm2')}
                      className={`px-2 py-1 rounded-md transition-all ${
                        logTab === 'pm2'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      PM2 Daemon (5)
                    </button>
                    <button
                      onClick={() => setLogTab('apps')}
                      className={`px-2 py-1 rounded-md transition-all ${
                        logTab === 'apps'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Apps en Vivo
                    </button>
                  </div>

                  <span className="text-[9px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    30s live
                  </span>
                </div>
              </div>

              {/* Logs Content Terminal Area */}
              <div className="p-3.5 sm:p-4 font-mono text-xs space-y-2 overflow-x-auto max-h-56 select-text">
                {logTab === 'pm2' ? (
                  data.pm2Logs && data.pm2Logs.length > 0 ? (
                    data.pm2Logs.slice(-5).map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-[11px] leading-relaxed break-all font-mono ${getLogLineStyle(
                          log.text
                        )}`}
                      >
                        <span className="text-slate-500 select-none mr-2">[{idx + 1}]</span>
                        <span className="text-blue-400 font-semibold mr-1.5">pm2:</span>
                        <span>{log.text}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-4 text-[11px]">
                      No hay registros recientes en ~/.pm2/pm2.log
                    </p>
                  )
                ) : data.recentAppLogs && data.recentAppLogs.length > 0 ? (
                  data.recentAppLogs.slice(-5).map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg text-[11px] leading-relaxed break-all font-mono ${getLogLineStyle(
                        log.text
                      )}`}
                    >
                      <span className="text-slate-500 select-none mr-2">[{idx + 1}]</span>
                      <span className="text-purple-400 font-semibold mr-1.5">
                        {log.app}:
                      </span>
                      <span>{log.text}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-4 text-[11px]">
                    No se detectaron logs de aplicaciones
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
