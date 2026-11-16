import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Layers,
  Clock,
  Info,
  GitCommit,
  Activity,
  Droplets,
  Wind,
  Thermometer
} from 'lucide-react';
import { api } from '../services/api';
import { TimeseriesRecord, CorrelationData, DiurnalRecord } from '../types';

export const HistoricalAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<number>(7);
  const [aggregate, setAggregate] = useState<'hourly' | 'daily'>('hourly');
  const [timeseries, setTimeseries] = useState<TimeseriesRecord[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationData | null>(null);
  const [diurnal, setDiurnal] = useState<DiurnalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'timeseries' | 'correlations' | 'diurnal'>('timeseries');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getTimeseries(timeRange, aggregate),
      api.getCorrelations(Math.max(timeRange, 14)),
      api.getDiurnalPatterns(Math.max(timeRange, 14))
    ])
      .then(([tsRes, corrRes, diRes]) => {
        if (!isMounted) return;
        setTimeseries(tsRes.records);
        setCorrelations(corrRes);
        setDiurnal(diRes.diurnal_cycle);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching analytics:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timeRange, aggregate]);

  return (
    <div className="space-y-6">
      {/* Analytics Control Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Bangalore Environmental Time-Series & Correlation Suite</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
                CAMS Reanalysis & ECMWF
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Continuous hourly atmospheric reanalysis & weather model archive (strictly past observations ≤ current time)
            </p>
          </div>
        </div>

        {/* Range and aggregation selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-view switcher */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('timeseries')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'timeseries'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Time-Series
            </button>
            <button
              onClick={() => setActiveTab('correlations')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'correlations'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Correlations
            </button>
            <button
              onClick={() => setActiveTab('diurnal')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'diurnal'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24h Diurnal Cycle
            </button>
          </div>

          {/* Time range buttons */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
            {[
              { label: '24h', val: 1 },
              { label: '7d', val: 7 },
              { label: '30d', val: 30 },
              { label: '90d', val: 90 }
            ].map((r) => (
              <button
                key={r.val}
                onClick={() => setTimeRange(r.val)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === r.val
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Aggregation */}
          {activeTab === 'timeseries' && (
            <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setAggregate('hourly')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  aggregate === 'hourly' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hourly
              </button>
              <button
                onClick={() => setAggregate('daily')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  aggregate === 'daily' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Daily Mean
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-3">
          <Activity className="w-8 h-8 animate-spin" />
          <span>Synthesizing Bangalore continuous telemetry records...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: TIME-SERIES CHARTS */}
          {activeTab === 'timeseries' && (
            <div className="space-y-6">
              {/* Chart 1: PM2.5, PM10, AQI Evolution */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      Particulate Matter & AQI Trajectory
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      PM2.5 vs PM10 Concentrations (µg/m³) vs Indian National AQI
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {timeseries.length} data points
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPm25" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorPm10" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey={aggregate === 'daily' ? 'date' : 'display_time'}
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0B1120',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '11px',
                          color: '#F8FAFC'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Area
                        type="monotone"
                        dataKey="pm2_5"
                        name="PM2.5 (µg/m³)"
                        stroke="#00F0FF"
                        strokeWidth={2}
                        fill="url(#colorPm25)"
                      />
                      <Area
                        type="monotone"
                        dataKey="pm10"
                        name="PM10 (µg/m³)"
                        stroke="#3B82F6"
                        strokeWidth={1.5}
                        fill="url(#colorPm10)"
                      />
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        name="AQI Index"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Weather Overlays (Wind Speed, Temp, Rain) */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Meteorological Driving Factors
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Temperature (°C), Wind Speed (km/h) & Precipitation (mm)
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey={aggregate === 'daily' ? 'date' : 'display_time'}
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0B1120',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '11px',
                          color: '#F8FAFC'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        name="Temperature (°C)"
                        stroke="#F97316"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="wind_speed"
                        name="Wind Speed (km/h)"
                        stroke="#06B6D4"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="relative_humidity"
                        name="Humidity (%)"
                        stroke="#8B5CF6"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Bar dataKey="precipitation" name="Precipitation (mm)" fill="#38BDF8" opacity={0.6} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CORRELATIONS & SCATTER PLOTS */}
          {activeTab === 'correlations' && correlations && (
            <div className="space-y-6">
              {/* Correlation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(correlations.key_associations).map(([key, item]) => {
                  const isNeg = item.r < 0;
                  return (
                    <div
                      key={key}
                      className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase font-mono text-slate-400">
                            {key.replace('_vs_pm25', '').replace('_', ' ')} vs PM2.5
                          </span>
                          <span
                            className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                              isNeg
                                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                            }`}
                          >
                            r = {item.r}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                          {item.statistical_summary}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                        Classification: <span className="capitalize text-slate-300">{item.strength} {item.direction}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scatter Plots: Temperature vs PM2.5 and Wind vs PM2.5 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wind vs PM2.5 */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Wind className="w-4 h-4 text-cyan-400" />
                      Wind Speed vs PM2.5 (Ventilation Effect)
                    </h4>
                    <span className="text-xs font-mono text-cyan-400">
                      r = {correlations.key_associations.wind_speed_vs_pm25.r}
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Wind Speed (km/h)"
                          unit=" km/h"
                          stroke="#64748B"
                          fontSize={10}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="PM2.5"
                          unit=" µg/m³"
                          stroke="#64748B"
                          fontSize={10}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{
                            backgroundColor: '#0B1120',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                            fontSize: '11px',
                            color: '#F8FAFC'
                          }}
                        />
                        <Scatter name="Observation" data={correlations.scatter_samples.wind} fill="#00F0FF" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Temperature vs PM2.5 */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      Temperature vs PM2.5 (Thermal Inversion Proxy)
                    </h4>
                    <span className="text-xs font-mono text-amber-400">
                      r = {correlations.key_associations.temperature_vs_pm25.r}
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Temperature (°C)"
                          unit="°C"
                          stroke="#64748B"
                          fontSize={10}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="PM2.5"
                          unit=" µg/m³"
                          stroke="#64748B"
                          fontSize={10}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{
                            backgroundColor: '#0B1120',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                            fontSize: '11px',
                            color: '#F8FAFC'
                          }}
                        />
                        <Scatter name="Observation" data={correlations.scatter_samples.temperature} fill="#F59E0B" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Scientific Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <p className="leading-relaxed">{correlations.scientific_disclaimer}</p>
              </div>
            </div>
          )}

          {/* TAB 3: DIURNAL 24-HOUR CYCLE */}
          {activeTab === 'diurnal' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Average 24-Hour Diurnal Cycle in Bangalore
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Aggregated hourly cycle showing morning (08:00-10:00) and evening (19:00-22:00) peaks
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={diurnal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="display_hour" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B1120',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="pm2_5"
                      name="PM2.5 (µg/m³)"
                      stroke="#00F0FF"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#00F0FF' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pm10"
                      name="PM10 (µg/m³)"
                      stroke="#3B82F6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="wind_speed"
                      name="Wind Speed (km/h)"
                      stroke="#10B981"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temp (°C)"
                      stroke="#F97316"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
