import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Baby,
  Activity,
  HeartPulse,
  Briefcase,
  AlertTriangle,
  Wind,
  Home,
  CheckCircle,
  FileText,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { HealthAdvisory } from '../types';

export const HealthAdvisoriesView: React.FC = () => {
  const [data, setData] = useState<HealthAdvisory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getHealthAdvisory()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching health advisory:', err);
        setLoading(false);
      });
  }, []);

  const getGroupIcon = (iconName: string) => {
    switch (iconName) {
      case 'baby':
        return Baby;
      case 'shield-alert':
        return ShieldAlert;
      case 'activity':
        return Activity;
      case 'heart-pulse':
        return HeartPulse;
      case 'briefcase':
        return Briefcase;
      default:
        return Users;
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-3">
        <Activity className="w-8 h-8 animate-spin" />
        <span>Loading CPCB Health Advisory guidelines...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              CPCB National Ambient Health Advisories & Precautions
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                AQI {Math.round(data.aqi)} ({data.category})
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Demographic vulnerability assessments and clinical exposure mitigation guidelines
            </p>
          </div>
        </div>
      </div>

      {/* Target Demographics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.target_demographics.map((cohort, idx) => {
          const Icon = getGroupIcon(cohort.icon);
          const isHigh = cohort.risk_level === 'High' || cohort.risk_level === 'Very High' || cohort.risk_level === 'Extreme';
          return (
            <div
              key={idx}
              className="glass-panel glass-panel-hover p-4 rounded-xl border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800/80 text-cyan-400 border border-slate-700/60">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {cohort.group}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isHigh
                        ? 'bg-rose-950/60 text-rose-400 border-rose-800/80'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                    }`}
                  >
                    Risk: {cohort.risk_level}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                  {cohort.advice}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Practical Action Guides: Mask, Ventilation, Exercise */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <Wind className="w-4 h-4" />
            <span>Mask Guidance</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.practical_precautions.mask_guidance}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
            <Home className="w-4 h-4" />
            <span>Ventilation Guidance</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.practical_precautions.ventilation_guidance}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <Activity className="w-4 h-4" />
            <span>Exercise Precautions</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.practical_precautions.exercise_precautions}
          </p>
        </div>
      </div>

      {/* Emergency Symptoms Warning Box */}
      <div className="glass-panel p-5 rounded-2xl border border-rose-500/40 bg-rose-950/20 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h4 className="text-sm font-bold tracking-wide">
            Clinical Symptoms Requiring Immediate Medical Attention
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
          {data.practical_precautions.emergency_symptoms.map((sym, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{sym}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">{data.medical_disclaimer}</p>
      </div>
    </div>
  );
};
