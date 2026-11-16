import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Compass,
  CloudRain,
  Gauge,
  Flame,
  CloudFog,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { DashboardData } from '../types';

interface WeatherMetricsProps {
  dashboard: DashboardData;
}

export const WeatherMetrics: React.FC<WeatherMetricsProps> = ({ dashboard }) => {
  const { pollutants, weather } = dashboard;

  const pollutantItems = [
    {
      key: 'pm2_5',
      name: 'PM2.5',
      fullName: 'Fine Particulates (≤ 2.5 µm)',
      value: pollutants.pm2_5.value,
      unit: pollutants.pm2_5.unit,
      threshold: 60, // CPCB 24h standard
      icon: CloudFog,
      color: (pollutants.pm2_5.value || 0) > 60 ? 'text-orange-400' : 'text-emerald-400'
    },
    {
      key: 'pm10',
      name: 'PM10',
      fullName: 'Coarse Dust Particles (≤ 10 µm)',
      value: pollutants.pm10.value,
      unit: pollutants.pm10.unit,
      threshold: 100, // CPCB 24h standard
      icon: CloudFog,
      color: (pollutants.pm10.value || 0) > 100 ? 'text-orange-400' : 'text-emerald-400'
    },
    {
      key: 'no2',
      name: 'NO2',
      fullName: 'Nitrogen Dioxide (Combustion)',
      value: pollutants.no2.value,
      unit: pollutants.no2.unit,
      threshold: 80,
      icon: Flame,
      color: (pollutants.no2.value || 0) > 80 ? 'text-red-400' : 'text-cyan-400'
    },
    {
      key: 'ozone',
      name: 'O3',
      fullName: 'Ground-Level Ozone',
      value: pollutants.ozone.value,
      unit: pollutants.ozone.unit,
      threshold: 100,
      icon: ShieldCheck,
      color: (pollutants.ozone.value || 0) > 100 ? 'text-amber-400' : 'text-cyan-400'
    },
    {
      key: 'so2',
      name: 'SO2',
      fullName: 'Sulphur Dioxide',
      value: pollutants.so2.value,
      unit: pollutants.so2.unit,
      threshold: 80,
      icon: AlertCircle,
      color: 'text-cyan-400'
    },
    {
      key: 'co',
      name: 'CO',
      fullName: 'Carbon Monoxide',
      value: pollutants.co.value,
      unit: pollutants.co.unit,
      threshold: 2000,
      icon: Flame,
      color: 'text-cyan-400'
    }
  ];

  const weatherItems = [
    {
      label: 'Ambient Temp',
      value: weather.temperature.value !== null ? `${weather.temperature.value}°C` : '--',
      sub: `Feels like ${weather.apparent_temperature.value ?? weather.temperature.value}°C`,
      icon: Thermometer,
      color: 'text-amber-400'
    },
    {
      label: 'Relative Humidity',
      value: weather.relative_humidity.value !== null ? `${weather.relative_humidity.value}%` : '--',
      sub: 'Atmospheric moisture',
      icon: Droplets,
      color: 'text-blue-400'
    },
    {
      label: 'Wind Speed',
      value: weather.wind_speed.value !== null ? `${weather.wind_speed.value} km/h` : '--',
      sub: 'Boundary dispersion',
      icon: Wind,
      color: 'text-cyan-400'
    },
    {
      label: 'Wind Direction',
      value: weather.wind_direction.value !== null ? `${weather.wind_direction.value}°` : '--',
      sub: 'Bearing heading',
      icon: Compass,
      color: 'text-indigo-400'
    },
    {
      label: 'Surface Pressure',
      value: weather.surface_pressure.value !== null ? `${weather.surface_pressure.value} hPa` : '--',
      sub: 'Barometric elevation',
      icon: Gauge,
      color: 'text-purple-400'
    },
    {
      label: 'Precipitation',
      value: weather.precipitation.value !== null ? `${weather.precipitation.value} mm` : '0.0 mm',
      sub: 'Rain washout rate',
      icon: CloudRain,
      color: 'text-sky-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Pollutant cards grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Particulate & Gaseous Concentrations
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Source: CAMS Grid / CPCB CAAQMS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pollutantItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="glass-panel glass-panel-hover rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {item.name}
                  </span>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>

                <div className="my-2">
                  <span className="text-2xl font-bold font-mono text-slate-100">
                    {item.value !== null && item.value !== undefined ? Math.round(item.value * 10) / 10 : '--'}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1 font-mono">
                    {item.unit}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 truncate" title={item.fullName}>
                  {item.fullName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weather telemetry grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            High-Resolution Meteorological Conditions
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Source: ECMWF / Open-Meteo High-Res
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {weatherItems.map((w, idx) => {
            const Icon = w.icon;
            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {w.label}
                  </span>
                  <Icon className={`w-4 h-4 ${w.color}`} />
                </div>

                <div className="my-2">
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {w.value}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 truncate">
                  {w.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
