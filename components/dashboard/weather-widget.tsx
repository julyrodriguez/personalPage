'use client';

import { useEffect, useState } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  Wind,
  Droplets,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherData } from '@/types';

function getWeatherIcon(code: number, className = 'w-6 h-6') {
  if (code === 0) return <Sun className={`${className} text-amber-500`} />;
  if (code === 1 || code === 2) return <CloudSun className={`${className} text-amber-400`} />;
  if (code === 3) return <Cloud className={`${className} text-slate-400`} />;
  if ([45, 48].includes(code)) return <CloudFog className={`${className} text-slate-400`} />;
  if ([51, 53, 55].includes(code)) return <CloudDrizzle className={`${className} text-blue-400`} />;
  if ([61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className={`${className} text-blue-500`} />;
  if ([71, 73, 75].includes(code)) return <CloudSnow className={`${className} text-indigo-300`} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning className={`${className} text-purple-500`} />;
  return <Sun className={`${className} text-amber-500`} />;
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/weather');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching weather:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const formatDayName = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const name = new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d);
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-white to-blue-50/40 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-blue-950/20">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">
              {data?.current.city || 'Buenos Aires, AR'}
            </CardTitle>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Open-Meteo Live API</p>
          </div>
        </div>

        <button
          onClick={fetchWeather}
          disabled={refreshing}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Actualizar clima"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </CardHeader>

      <CardContent className="p-4 pt-1">
        {loading ? (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Current Weather Highlight */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {data.current.temperature}°
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">C</span>
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {data.current.weatherDescription}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sensación: {data.current.apparentTemperature}°C
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 flex items-center justify-center">
                {getWeatherIcon(data.current.weatherCode, 'w-10 h-10')}
              </div>
            </div>

            {/* Environmental Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Wind className="w-3.5 h-3.5 text-blue-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block leading-tight">Viento</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {data.current.windSpeed} km/h
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block leading-tight">Humedad</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {data.current.humidity}%
                  </span>
                </div>
              </div>
            </div>

            {/* 3-Day Forecast */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pronóstico 3 Días
              </p>
              <div className="grid grid-cols-3 gap-2">
                {data.daily.map((day) => (
                  <div
                    key={day.date}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 text-center flex flex-col items-center"
                  >
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {formatDayName(day.date)}
                    </span>
                    <div className="my-1">
                      {getWeatherIcon(day.weatherCode, 'w-5 h-5')}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      <span>{day.maxTemp}°</span>
                      <span className="text-slate-400 font-normal ml-1">{day.minTemp}°</span>
                    </div>
                    {typeof day.precipitationProbability === 'number' && day.precipitationProbability > 0 && (
                      <span className="text-[9px] text-blue-500 font-mono mt-0.5">
                        {day.precipitationProbability}% ll
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4">No se pudo cargar el clima</p>
        )}
      </CardContent>
    </Card>
  );
}
