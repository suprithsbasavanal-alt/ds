import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  Database,
  Radio,
  Cpu,
  CloudSun,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { ProvenanceItem } from '../types';

export const DataProvenancePanel: React.FC = () => {
  const [provenanceList, setProvenanceList] = useState<ProvenanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getProvenance()
      .then((res) => {
        setProvenanceList(res.data_provenance_catalog);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load provenance catalog:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Data Provenance, Authenticity & Methodological Transparency
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  Phase 3 Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
                AERIS 3D strictly adheres to scientific data integrity standards. Ground-station observations, atmospheric chemistry reanalysis, numerical weather predictions, and machine-learning projections are partitioned into explicit epistemological categories with zero synthetic data fabrication.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Epistemological Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
              <Radio className="w-4 h-4" />
              <span>Ground In-Situ</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              CPCB / KSPCB CAAQMS physical continuous monitors reported via WAQI feed.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/30">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
              <Database className="w-4 h-4" />
              <span>Atmospheric Grid</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Copernicus Atmosphere Monitoring Service (CAMS) 0.1° (~11km) regional chemical model.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-blue-500/30">
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold">
              <CloudSun className="w-4 h-4" />
              <span>Meteorology</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              ECMWF IFS (9km) high-resolution numerical weather prediction via Open-Meteo.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-purple-500/30">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-semibold">
              <Cpu className="w-4 h-4" />
              <span>ML Projections</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Supervised models trained on CAMS reanalysis with fair baseline comparisons.
            </div>
          </div>
        </div>
      </div>

      {/* Main Provenance Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300">
              Live Source Attribution & Provider Catalog
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Target Coordinates: 12.9716°N, 77.5946°E (Asia/Kolkata)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">Data Category</th>
                <th className="py-3 px-4 font-semibold">Source Provider</th>
                <th className="py-3 px-4 font-semibold">Measurement Type</th>
                <th className="py-3 px-4 font-semibold">Status & Freshness</th>
                <th className="py-3 px-4 font-semibold">Scientific Disclosures</th>
                <th className="py-3 px-4 font-semibold text-right">Official Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {provenanceList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-200 font-mono text-[11px] whitespace-nowrap">
                    {item.data_category}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                    {item.source_provider}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {item.measurement_type}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {item.status}
                    </span>
                    <div className="text-slate-500 text-[10px] mt-0.5">{item.data_freshness}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400 max-w-md leading-relaxed">
                    {item.disclosure}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <a
                      href={item.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono transition-colors"
                    >
                      <span>Verify Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Scientific Commitments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold">
            <Info className="w-4 h-4" />
            <span>Official CPCB NAQI Methodology</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Per the Central Pollution Control Board guidelines (<em>How_AQI_Calculated.pdf</em>), official NAQI requires a minimum of 3 monitored pollutants with at least one particulate parameter (PM2.5 or PM10). Station sub-indices are derived using piecewise linear interpolation across official CPCB concentration breakpoints.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            City station averages are explicitly labelled as <span className="text-cyan-300 font-semibold">"Mean AQI of available monitoring stations — not an official city AQI"</span>.
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold">
            <Cpu className="w-4 h-4" />
            <span>Machine Learning Integrity & Uncertainty Bounds</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The machine learning engine is trained on continuous Copernicus (CAMS) reanalysis grid data and evaluated against strict chronological holdout splits. Unverified "95% confidence interval" claims are replaced with empirically scaled prediction bounds (±1.5 × Holdout RMSE).
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            For 1-hour forecasts, a residual delta regressor is evaluated directly against Naive Persistence baselines on identical holdout timestamps.
          </div>
        </div>
      </div>
    </div>
  );
};
