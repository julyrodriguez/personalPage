'use client';

import React, { useState } from 'react';
import {
  Monitor,
  Power,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RemoteDesktop } from '@/components/server/remote-desktop';

export default function EscritorioRemotoPage() {
  const [powerActionLoading, setPowerActionLoading] = useState<'prender' | 'apagar' | null>(null);
  const [powerFeedback, setPowerFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);

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

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Monitor className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Escritorio Remoto Windows 11
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold py-0.5 px-2.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Tailscale 100.127.136.115
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control interactivo gráfico en tiempo real mediante pasarela noVNC WebSockets y túnel cifrado privado.
          </p>
        </div>

        {/* Acciones de energía rápidas */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handlePcPowerAction('prender')}
            disabled={powerActionLoading !== null}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl gap-1.5 text-xs shadow-sm cursor-pointer"
          >
            <Power className={`w-3.5 h-3.5 ${powerActionLoading === 'prender' ? 'animate-spin' : ''}`} />
            <span>Prender PC (WoL)</span>
          </Button>

          {!showShutdownConfirm ? (
            <Button
              onClick={() => setShowShutdownConfirm(true)}
              disabled={powerActionLoading !== null}
              size="sm"
              variant="destructive"
              className="bg-rose-600/90 hover:bg-rose-600 text-white font-semibold rounded-xl gap-1.5 text-xs shadow-sm cursor-pointer"
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span>Apagar</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => handlePcPowerAction('apagar')}
                disabled={powerActionLoading !== null}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
              >
                {powerActionLoading === 'apagar' ? 'Apagando...' : 'Confirmar'}
              </Button>
              <Button
                onClick={() => setShowShutdownConfirm(false)}
                size="sm"
                variant="ghost"
                className="text-xs text-slate-400 hover:text-white rounded-lg h-8 px-2"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback de acciones de energía */}
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

      {/* Visor de Escritorio Remoto Embebido */}
      <RemoteDesktop />
    </div>
  );
}
