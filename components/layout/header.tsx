'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  MapPin,
} from 'lucide-react';
import { WeatherData } from '@/types';

function getWeatherIcon(desc: string = '', isDay: boolean = true) {
  const d = desc.toLowerCase();
  if (d.includes('tormenta') || d.includes('eléctrica')) return CloudLightning;
  if (d.includes('llovizna')) return CloudDrizzle;
  if (d.includes('lluvia') || d.includes('chubasco')) return CloudRain;
  if (d.includes('nieve') || d.includes('nevada')) return CloudSnow;
  if (d.includes('niebla') || d.includes('escarcha')) return CloudFog;
  if (d.includes('parcialmente') || d.includes('mayormente')) return CloudSun;
  if (d.includes('nublado')) return Cloud;
  return isDay ? Sun : SunMedium;
}

function formatDayName(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const name = date.toLocaleDateString('es-AR', { weekday: 'short' });
    return name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
  } catch {
    return dateStr;
  }
}

export function Header() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateFormatted = new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(now);

      const timeFormatted = new Intl.DateTimeFormat('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now);

      setCurrentDate(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1));
      setCurrentTime(timeFormatted);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/weather')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.current) setWeather(data);
      })
      .catch((e) => console.warn('Error fetching weather in header:', e));
  }, []);

  const CurrentIcon = getWeatherIcon(weather?.current?.weatherDescription, weather?.current?.isDay);
  const nextTwoDays = (weather?.daily || []).slice(0, 2);

  return (
    <header className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-xs">
      {/* 1. Día y Hora */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Fecha de hoy</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {currentDate || 'Cargando fecha...'}
            </span>
          </div>
        </div>

        <span className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Hora local</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider">
              {currentTime || '--:--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Clima Actual + Pronóstico 2 Días */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap lg:justify-end border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100 dark:border-slate-800/80">
        {/* Clima Actual */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <CurrentIcon className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {weather?.current ? `${weather.current.temperature}°C` : '--°C'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {weather?.current?.weatherDescription || 'Clima'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <MapPin className="w-2.5 h-2.5 text-slate-400" />
              <span>{weather?.current?.city || 'Buenos Aires'}</span>
              {weather?.current && (
                <span>• ST {weather.current.apparentTemperature}°C</span>
              )}
            </div>
          </div>
        </div>

        {/* Pronóstico 2 Días Siguientes */}
        {nextTwoDays.length > 0 && (
          <div className="flex items-center gap-1.5">
            {nextTwoDays.map((d) => {
              const DayIcon = getWeatherIcon(d.weatherDescription, true);
              return (
                <div
                  key={d.date}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-xs"
                  title={`${formatDayName(d.date)}: ${d.weatherDescription} (Mín ${d.minTemp}° / Máx ${d.maxTemp}°)`}
                >
                  <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px]">
                    {formatDayName(d.date)}
                  </span>
                  <DayIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {d.minTemp}°/{d.maxTemp}°
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
