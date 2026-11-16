import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  LineChart,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DriverAnalysis } from '../types';

export const DriverAnalysisView: React.FC = () => {
  const [data, setData] = useState<DriverAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getDriverAnalysis()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching driver analysis:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-3">
        <Brain className="w-8 h-8 animate-pulse" />
        <span>Synthesizing explainable AI pollution driver diagnostics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-sm">
        Driver analysis is temporarily unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Explainable AI Environmental Diagnosis & Driver Intelligence
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured multi-tier scientific reasoning adhering to strict epistemological boundaries
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          Primary Driver: {data.primary_driver_summary}
        </div>
      </div>

      {/* 4 Epistemological Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 1: Measured Facts */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-slate-950/70 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">
                1. Measured Physical Facts
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Empirical ground sensor and satellite readings (Ground Truth)
              </span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {data.measured_facts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tier 2: Statistical Associations */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 bg-slate-950/70 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <LineChart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-300">
                2. Statistical Associations
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Co-variation & diurnal trends (Correlation ≠ Causation)
              </span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {data.statistical_associations.map((assoc, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>{assoc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tier 3: Model Predictions */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-slate-950/70 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-300">
                3. Model Predictions & Physics
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Boundary layer dynamics and machine-learning projections
              </span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {data.model_predictions.map((pred, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <span>{pred}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tier 4: Hypotheses & Urban Context */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-slate-950/70 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                4. Urban Source Apportionment Hypotheses
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Working hypotheses requiring chemical speciation verification
              </span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {data.source_hypotheses.map((hyp, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{hyp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Epistemological Integrity Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-200">Scientific Integrity Guarantee: </span>
          AERIS 3D enforces rigorous distinction between verified physical measurements, statistical correlations, and source attribution hypotheses. No specific commercial facility, industrial park, or motor transit operator is assigned definitive legal causality without verified local isotope and chemical fingerprinting assays.
        </div>
      </div>
    </div>
  );
};
