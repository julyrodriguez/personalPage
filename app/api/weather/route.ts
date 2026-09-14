import { NextRequest, NextResponse } from 'next/server';
import { WeatherData } from '@/types';

// WMO Weather interpretation codes (WW)
const WMO_CODE_MAP: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Cielo Despejado', icon: 'Sun' },
  1: { desc: 'Mayormente Despejado', icon: 'SunMedium' },
  2: { desc: 'Parcialmente Nublado', icon: 'CloudSun' },
  3: { desc: 'Nublado', icon: 'Cloud' },
  45: { desc: 'Niebla', icon: 'CloudFog' },
  48: { desc: 'Niebla con escarcha', icon: 'CloudFog' },
  51: { desc: 'Llovizna ligera', icon: 'CloudDrizzle' },
  53: { desc: 'Llovizna moderada', icon: 'CloudDrizzle' },
  55: { desc: 'Llovizna densa', icon: 'CloudDrizzle' },
  61: { desc: 'Lluvia leve', icon: 'CloudRain' },
  63: { desc: 'Lluvia moderada', icon: 'CloudRain' },
  65: { desc: 'Lluvia torrencial', icon: 'CloudRainWind' },
  71: { desc: 'Nevada ligera', icon: 'CloudSnow' },
  73: { desc: 'Nevada moderada', icon: 'CloudSnow' },
  75: { desc: 'Nevada intensa', icon: 'CloudSnow' },
  80: { desc: 'Chubascos leves', icon: 'CloudRain' },
  81: { desc: 'Chubascos moderados', icon: 'CloudRain' },
  82: { desc: 'Chubascos violentos', icon: 'CloudLightning' },
  95: { desc: 'Tormenta eléctrica', icon: 'CloudLightning' },
  96: { desc: 'Tormenta con granizo leve', icon: 'CloudLightning' },
  99: { desc: 'Tormenta con granizo fuerte', icon: 'CloudLightning' },
};

function getWmoInfo(code: number): { desc: string; icon: string } {
  return WMO_CODE_MAP[code] || { desc: 'Variable', icon: 'Sun' };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat') || process.env.NEXT_PUBLIC_DEFAULT_LAT || '-34.6037';
  const lon = searchParams.get('lon') || process.env.NEXT_PUBLIC_DEFAULT_LON || '-58.3816';
  const city = searchParams.get('city') || process.env.NEXT_PUBLIC_DEFAULT_CITY || 'Buenos Aires, AR';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=4`;

    // Cache por 15 minutos (900 segundos) para no saturar Open-Meteo
    const res = await fetch(url, {
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo respondió con código ${res.status}`);
    }

    const data = await res.json();
    const currentCode = data.current?.weather_code ?? 0;
    const currentWmo = getWmoInfo(currentCode);

    const dailyForecast = (data.daily?.time || []).slice(1, 4).map((dateStr: string, idx: number) => {
      const code = data.daily.weather_code[idx + 1] ?? 0;
      return {
        date: dateStr,
        minTemp: Math.round(data.daily.temperature_2m_min[idx + 1] ?? 15),
        maxTemp: Math.round(data.daily.temperature_2m_max[idx + 1] ?? 23),
        weatherCode: code,
        weatherDescription: getWmoInfo(code).desc,
        precipitationProbability: data.daily.precipitation_probability_max?.[idx + 1] ?? 0,
      };
    });

    const responseData: WeatherData = {
      current: {
        temperature: Math.round(data.current?.temperature_2m ?? 21),
        apparentTemperature: Math.round(data.current?.apparent_temperature ?? 21),
        weatherCode: currentCode,
        weatherDescription: currentWmo.desc,
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 12),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 55),
        isDay: Boolean(data.current?.is_day ?? 1),
        city,
        time: data.current?.time || new Date().toISOString(),
      },
      daily: dailyForecast,
      cachedAt: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.warn('Fallback climático activado (Open-Meteo no disponible o sin conexión):', error);

    // Fallback elegante y consistente
    const fallbackData: WeatherData = {
      current: {
        temperature: 22,
        apparentTemperature: 21,
        weatherCode: 1,
        weatherDescription: 'Mayormente Despejado (Offline)',
        windSpeed: 14,
        humidity: 58,
        isDay: true,
        city,
        time: new Date().toISOString(),
      },
      daily: [
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          minTemp: 16,
          maxTemp: 24,
          weatherCode: 0,
          weatherDescription: 'Despejado',
          precipitationProbability: 10,
        },
        {
          date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          minTemp: 17,
          maxTemp: 26,
          weatherCode: 2,
          weatherDescription: 'Parcialmente Nublado',
          precipitationProbability: 20,
        },
        {
          date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          minTemp: 15,
          maxTemp: 22,
          weatherCode: 61,
          weatherDescription: 'Lluvia leve',
          precipitationProbability: 60,
        },
      ],
      cachedAt: new Date().toISOString(),
    };

    return NextResponse.json(fallbackData);
  }
}
