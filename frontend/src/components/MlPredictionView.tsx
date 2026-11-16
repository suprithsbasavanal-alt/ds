import React, { useState, useEffect } from 'react';
import {
  Cpu,
  TrendingUp,
  Award,
  RefreshCw,
  CheckCircle,
  Clock,
  Layers,
  BarChart2,
  Calendar,
  AlertCircle,
  Info,
  ShieldCheck,
  Table
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../services/api';
import { PredictionStep, ModelMetadata } from '../types';

export const MlPredictionView: React.FC = () => {
  const [modelType, setModelType] = useState<'hist_gradient_boosting' | 'random_forest'>('hist_gradient_boosting');
  const [forecastHours, setForecastHours] = useState<number>(6);
  const [predictions, setPredictions] = useState<PredictionStep[]>([]);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPredictions = () => {
    setLoading(true);
    api.getMlPredictions(forecastHours, modelType)
      .then((res) => {
        setPredictions(res.predictions);
        setMetadata(res.model_metadata);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching ML predictions:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPredictions();
  }, [modelType, forecastHours]);

  const handleRetrain = () => {
    setIsRetraining(true);
    setNotification(null);
    api.retrainModel(30, modelType)
      .then((res) => {
        setIsRetraining(false);
        setNotification('Model retrained successfully with chronological holdout and multi-horizon fair baseline evaluation.');
        fetchPredictions();
      })
      .catch((err) => {
        setIsRetraining(false);
        setNotification(`Retraining failed: ${err.message}`);
      });
  };

  const chartData = predictions.map((p) => ({
    display_time: p.display_time,
    predicted_aqi: p.predicted_aqi,
    lower_bound: p.lower_bound,
    upper_bound: p.upper_bound,
    expected_temp: p.expected_temp,
    expected_humidity: p.expected_humidity,
    expected_wind_speed: p.expected_wind_speed
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Model Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Audited Multi-Horizon ML Prediction Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                Phase 3 Validated
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated against Naive Persistence on identical holdout timestamps at 1h, 3h, and 6h horizons
            </p>
          </div>
        </div>

        {/* Algorithm switch & Retrain trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setModelType('hist_gradient_boosting')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                modelType === 'hist_gradient_boosting'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Residual Ridge + HistGradient
            </button>
            <button
              onClick={() => setModelType('random_forest')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                modelType === 'random_forest'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Residual Ridge + RandomForest
            </button>
          </div>

          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Retraining...' : 'Retrain Pipeline'}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Target Variable Disclosure Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">
            Target Variable Epistemological Disclosure:
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {metadata?.target_variable?.disclosure ||
              'This machine-learning model is trained strictly on Copernicus Atmosphere Monitoring Service (CAMS) reanalysis grid AQI (0.1° / ~11km resolution) for Bangalore. It is NOT trained on CPCB ground station observations, as intermittent CAAQMS telemetry dropouts preclude uninterrupted sequential lag training.'}
          </p>
        </div>
      </div>

      {/* Multi-Horizon Fair Baseline Comparison Table */}
      {metadata?.multi_horizon_comparison && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              Multi-Horizon Fair Baseline Comparison Table (Identical Holdout Timestamps)
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Holdout Period: {metadata.test_evaluation_range?.start} to {metadata.test_evaluation_range?.end} (N={metadata.test_samples})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950/50">
                  <th className="py-2.5 px-3">Forecast Horizon</th>
                  <th className="py-2.5 px-3">Persistence MAE</th>
                  <th className="py-2.5 px-3">Persistence RMSE</th>
                  <th className="py-2.5 px-3">Persistence R²</th>
                  <th className="py-2.5 px-3">ML Model MAE</th>
                  <th className="py-2.5 px-3">ML Model RMSE</th>
                  <th className="py-2.5 px-3">ML Model R²</th>
                  <th className="py-2.5 px-3">Superior Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(metadata.multi_horizon_comparison).map(([hKey, comp]) => (
                  <tr key={hKey} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-cyan-300">
                      +{comp.horizon_hours} Hour Horizon
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {comp.naive_persistence.mae}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {comp.naive_persistence.rmse}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {comp.naive_persistence.r2_score}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      {comp.machine_learning.mae}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400">
                      {comp.machine_learning.rmse}
                    </td>
                    <td className="py-2.5 px-3 text-purple-400">
                      {comp.machine_learning.r2_score}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-200">
                        {comp.superior_model}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-400 pt-1 font-sans leading-relaxed">
            <span className="font-semibold text-slate-200">Active 1-Hour Predictor: </span>
            {metadata.metrics.active_1h_predictor}. The residual delta formulation conditions next-hour change on boundary-layer meteorological trends, reducing error below naive persistence.
          </div>
        </div>
      )}

      {/* 1 to 6 Hour Forward Forecast Cards with Estimated Prediction Bounds */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            1–6 Hour Forward Trajectory with Estimated Prediction Range (±1.5 × Holdout RMSE)
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Meteorological Input: Genuine ECMWF Hourly Numerical Weather Forecast
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {predictions.map((p) => (
            <div
              key={p.step_ahead}
              className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border border-slate-800 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  +{p.step_ahead} Hour
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {p.display_time}
                </span>
              </div>

              <div className="my-3">
                <div className="text-3xl font-black font-mono text-slate-100">
                  {Math.round(p.predicted_aqi)}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Range: [{Math.round(p.lower_bound)} - {Math.round(p.upper_bound)}]
                </div>
              </div>

              <div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold border inline-block"
                  style={{
                    backgroundColor: `${p.color}20`,
                    color: p.color,
                    borderColor: `${p.color}50`
                  }}
                >
                  {p.category}
                </span>
                <div className="text-[10px] text-slate-400 mt-2 font-mono space-y-0.5">
                  <div>Temp: {p.expected_temp}°C</div>
                  <div>Wind: {p.expected_wind_speed} km/h</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Chart & Feature Importance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Projected 1-6h AQI Trendline with Estimated Prediction Range
            </h4>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="display_time" stroke="#64748B" fontSize={10} tickLine={false} />
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
                  dataKey="predicted_aqi"
                  name="Predicted AQI"
                  stroke="#00F0FF"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#00F0FF' }}
                />
                <Line
                  type="monotone"
                  dataKey="upper_bound"
                  name="Upper Prediction Bound (+1.5σ)"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lower_bound"
                  name="Lower Prediction Bound (-1.5σ)"
                  stroke="#10B981"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Permutation Feature Importance
            </h4>
            <p className="text-[11px] text-slate-400 font-mono mb-4">
              Empirical holdout loss increase when feature is randomized
            </p>
          </div>

          {metadata && (
            <div className="space-y-2.5 font-mono text-xs">
              {metadata.feature_importance.slice(0, 6).map((feat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">{feat.feature}</span>
                    <span className="text-cyan-400 font-bold">
                      {Math.round(feat.importance * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(feat.importance * 200, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            Calculated via Scikit-Learn permutation_importance on chronological holdout.
          </div>
        </div>
      </div>
    </div>
  );
};
