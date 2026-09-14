'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Calendar, Clock, DollarSign, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalonAppointment } from '@/types';

export function CaroNailsWidget() {
  const [appointments, setAppointments] = useState<SalonAppointment[]>([]);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeekAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/caro-appointments');
      if (res.ok) {
        const data = await res.json();
        if (data.appointments) {
          setAppointments(data.appointments);
          if (data.range) setRange(data.range);
        }
      }
    } catch (e) {
      console.warn('Error fetching Caro Nails appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekAppointments();
  }, []);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes} hs`;
    } catch {
      return isoString;
    }
  };

  const formatDateLabel = (dayKey?: string) => {
    if (!dayKey) return '';
    try {
      const [y, m, d] = dayKey.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dayKey;
    }
  };

  const totalRevenue = appointments.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalPaid = appointments.filter((a) => a.paid).reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <Card className="border-pink-200/70 dark:border-pink-900/30 bg-gradient-to-br from-white via-white to-pink-50/25 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-pink-950/20 overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              Caro Nails
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-pink-300 text-pink-600 dark:border-pink-800 dark:text-pink-400">
                Esta Semana
              </Badge>
            </CardTitle>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {range ? `${range.start} al ${range.end}` : 'Agenda Semanal de Turnos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchWeekAppointments}
            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Actualizar turnos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        {/* Resumen Métricas Rápidas */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Turnos</span>
            <strong className="text-sm font-bold text-slate-800 dark:text-white">
              {appointments.length}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Total Cobrado</span>
            <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ${totalPaid.toLocaleString('es-AR')}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Estimado Total</span>
            <strong className="text-sm font-bold text-slate-800 dark:text-white">
              ${totalRevenue.toLocaleString('es-AR')}
            </strong>
          </div>
        </div>

        {/* Lista de Turnos */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 opacity-50" />
              Cargando agenda de Caro Nails...
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
              No hay turnos registrados para esta semana
            </div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {appt.clientNameSnapshot || 'Clienta'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono">
                      {formatDateLabel(appt.dayKey)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {formatTime(appt.startAt)}
                    </span>
                    {appt.description && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[120px] sm:max-w-[160px]">{appt.description}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    ${appt.amount?.toLocaleString('es-AR')}
                  </span>
                  {appt.paid ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-2.5 h-2.5" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
