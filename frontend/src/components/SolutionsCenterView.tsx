import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  User,
  Users,
  Building2,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { SolutionsData } from '../types';

export const SolutionsCenterView: React.FC = () => {
  const [data, setData] = useState<SolutionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getSolutions()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching solutions:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-3">
        <Sparkles className="w-8 h-8 animate-spin" />
        <span>Synthesizing evidence-based mitigation roadmaps...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Bangalore Clean Air Action Center & Evidence-Based Solutions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Actionable multi-tier interventions linked to active empirical telemetry and hotspot signatures
            </p>
          </div>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
          {data.measured_trigger_context}
        </div>
      </div>

      {/* 3 Action Columns: Individual, Community, Municipal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier 1: Individual Actions */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                1. Individual Citizen Actions
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Immediate personal lifestyle & mobility choices
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.individual_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="text-xs font-bold text-slate-200">{act.title}</h5>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                    {act.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {act.description}
                </p>
                <div className="mt-2 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Timeline: {act.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2: Community & Neighborhood Initiatives */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                2. Community & RWA Initiatives
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Apartment, layout & collective grassroots vigilance
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.community_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="text-xs font-bold text-slate-200">{act.title}</h5>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">
                    {act.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {act.description}
                </p>
                <div className="mt-2 text-[10px] font-mono text-blue-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Timeline: {act.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 3: Municipal & Urban Planning Policies */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                3. BBMP & Policy Interventions
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Municipal infrastructure, dust suppression & enforcement
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.municipal_and_policy_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="text-xs font-bold text-slate-200">{act.title}</h5>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/60">
                    {act.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {act.description}
                </p>
                <div className="mt-2 text-[10px] font-mono text-purple-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Timeline: {act.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
