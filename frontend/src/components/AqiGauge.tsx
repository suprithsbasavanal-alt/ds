import React, { useState } from 'react';
import {
  AlertTriangle,
  Info,
  ShieldCheck,
  Database,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink
} from 'lucide-react';

interface AqiGaugeProps {
  aqi: number | null;
  category: string;
  color: string;
  severityLevel: number;
  healthSummary: string;
  dominantPollutant: string;
  activeStationsCount?: number;
  modelAqi?: number | null;
  cpcbModelGridNaqi?: {
    calculated_naqi: number | null;
    prominent_pollutant: string | null;
    category: string;
    color: string;
    sub_indices: Record<string, number>;
    criteria_met: boolean;
    methodology: string;
    official_reference_url: string;
  };
  isStale?: boolean;
}

export const AqiGauge: React.FC<AqiGaugeProps> = ({
  aqi,
  category,
  color,
  healthSummary,
  dominantPollutant,
  activeStationsCount = 8,
  modelAqi,
  cpcbModelGridNaqi,
  isStale
}) => {
  const [showSubIndices, setShowSubIndices] = useState<boolean>(false);
  const normalizedAqi = Math.min(Math.max(aqi || 0, 0), 500);
  const percentage = (normalizedAqi / 500) * 100;
  
  const radius = 75;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-between shadow-xl border border-slate-800">
      {/* Background ambient radial glow */}
      <div
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: color || '#FBBF24' }}
      />
      
      {/* Top Header & Data Provenance Label */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-wide flex items-center gap-1.5">
              <span>Mean Station AQI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                Ground Telemetry
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Mean AQI of available monitoring stations — not an official city AQI.
            </p>
          </div>
        </div>

        {isStale && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 font-mono">
            <AlertTriangle className="w-3 h-3" /> Cached Telemetry
          </span>
        )}
      </div>

      {/* SVG Semi-Circle Radial Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg className="w-64 h-36 overflow-visible" viewBox="0 0 180 100">
          <defs>
            <linearGradient id="cpcbGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />       {/* Good 0-50 */}
              <stop offset="20%" stopColor="#84CC16" />      {/* Satisfactory 51-100 */}
              <stop offset="40%" stopColor="#FBBF24" />      {/* Moderate 101-200 */}
              <stop offset="60%" stopColor="#F97316" />      {/* Poor 201-300 */}
              <stop offset="80%" stopColor="#EF4444" />      {/* Very Poor 301-400 */}
              <stop offset="100%" stopColor="#991B1B" />     {/* Severe 401-500 */}
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track arc */}
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke="#1E293B"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active colored AQI arc */}
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke="url(#cpcbGradient)"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#glowFilter)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center AQI value */}
        <div className="absolute top-14 flex flex-col items-center text-center">
          <span className="text-5xl font-black tracking-tight font-mono text-slate-100 drop-shadow-md">
            {aqi ? Math.round(aqi) : '--'}
          </span>
          <span
            className="mt-1 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm"
            style={{
              backgroundColor: `${color}20`,
              color: color,
              borderColor: `${color}60`
            }}
          >
            {category}
          </span>
        </div>
      </div>

      {/* Calculated CPCB NAQI from CAMS Grid Pollutants Box */}
      {cpcbModelGridNaqi && (
        <div className="w-full mt-2 rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calculated CPCB NAQI (CAMS Grid):</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold font-mono text-cyan-300">
                {cpcbModelGridNaqi.calculated_naqi ?? '--'} ({cpcbModelGridNaqi.category})
              </span>
              <button
                onClick={() => setShowSubIndices(!showSubIndices)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800"
                title="Toggle CPCB Sub-indices Breakdown"
              >
                {showSubIndices ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Sub-indices Dropdown Breakdown */}
          {showSubIndices && cpcbModelGridNaqi.sub_indices && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Prominent Pollutant:</span>
                <span className="text-amber-400 font-bold">{cpcbModelGridNaqi.prominent_pollutant}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                {Object.entries(cpcbModelGridNaqi.sub_indices).map(([pollutant, subVal]) => (
                  <div key={pollutant} className="p-1 rounded bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 text-[9px]">{pollutant}</div>
                    <div className={`font-bold ${pollutant === cpcbModelGridNaqi.prominent_pollutant ? 'text-amber-400' : 'text-slate-200'}`}>
                      {Math.round(subVal)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-slate-500">
                <span>Methodology: CPCB Breakpoint Formula</span>
                <a
                  href="https://www.airquality.cpcb.gov.in/ccr_docs/How_AQI_Calculated.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-cyan-400 hover:underline"
                >
                  <span>CPCB Guidelines PDF</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Atmospheric Model Grid Comparison Pill */}
      {modelAqi !== undefined && modelAqi !== null && (
        <div className="w-full mt-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Open-Meteo CAMS Model Grid:</span>
          </div>
          <span className="text-blue-300 font-bold">
            {modelAqi} US AQI (Model Grid)
          </span>
        </div>
      )}

      {/* Dominant Pollutant & Scale Indicators */}
      <div className="w-full mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Prominent Pollutant:</span>
          <span className="font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-mono">
            {dominantPollutant}
          </span>
        </div>
        <div className="text-slate-400 text-[11px] font-mono">
          Active Monitors: <span className="text-emerald-400 font-bold">{activeStationsCount}</span>
        </div>
      </div>

      {/* Health Impact Summary */}
      <div className="w-full mt-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">{healthSummary}</p>
      </div>

      {/* CPCB Scale Bar Legend */}
      <div className="w-full mt-3 grid grid-cols-6 gap-1 text-[9px] text-center font-mono">
        <div className="bg-emerald-500/20 text-emerald-400 py-1 rounded border border-emerald-500/30">0-50</div>
        <div className="bg-lime-500/20 text-lime-400 py-1 rounded border border-lime-500/30">51-100</div>
        <div className="bg-amber-500/20 text-amber-400 py-1 rounded border border-amber-500/30">101-200</div>
        <div className="bg-orange-500/20 text-orange-400 py-1 rounded border border-orange-500/30">201-300</div>
        <div className="bg-red-500/20 text-red-400 py-1 rounded border border-red-500/30">301-400</div>
        <div className="bg-rose-900/30 text-rose-400 py-1 rounded border border-rose-800/40">401-500</div>
      </div>
    </div>
  );
};
