import React, { useState } from 'react';
import {
  ArrowUpDown,
  Filter,
  Search,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Radio
} from 'lucide-react';
import { Station } from '../types';

interface RankingsTableProps {
  rankedStations: Station[];
  staleStations?: Station[];
  offlineStations?: Station[];
  offlineOrStaleStations?: Station[];
  onSelectStation: (station: Station) => void;
  selectedStationId?: string;
}

export const RankingsTable: React.FC<RankingsTableProps> = ({
  rankedStations,
  staleStations = [],
  offlineStations = [],
  offlineOrStaleStations = [],
  onSelectStation,
  selectedStationId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<'aqi' | 'pm2_5' | 'name'>('aqi');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter valid ranked stations
  const filtered = rankedStations.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || st.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  filtered.sort((a, b) => {
    let aVal: any = a.cpcb_ground_aqi ?? a.aqi ?? 0;
    let bVal: any = b.cpcb_ground_aqi ?? b.aqi ?? 0;
    if (sortField === 'pm2_5') {
      aVal = a.model_estimates?.pm2_5 ?? 0;
      bVal = b.model_estimates?.pm2_5 ?? 0;
    } else if (sortField === 'name') {
      aVal = a.short_name;
      bVal = b.short_name;
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (field: 'aqi' | 'pm2_5' | 'name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-800">
      {/* Top Header & Search / Filters */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Bangalore CPCB Ground Station Rankings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked strictly by authentic empirical CAAQMS telemetry with observations &lt;24 hours fresh
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search station or zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-48 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Tiers</option>
              <option value="good">Good (0-50)</option>
              <option value="satisfactory">Satisfactory (51-100)</option>
              <option value="moderate">Moderate (101-200)</option>
              <option value="poor">Poor (201-300)</option>
              <option value="very poor">Very Poor (301-400)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table: Active Ranked Stations */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 w-14 text-center">Rank</th>
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Station Location</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('aqi')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>CPCB Ground AQI</span>
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                </div>
              </th>
              <th className="py-3 px-4">Telemetry Classification</th>
              <th className="py-3 px-4">Observation Timestamp</th>
              <th className="py-3 px-4">Data Freshness</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.map((st, idx) => {
              const isSelected = selectedStationId === st.id;
              const aqiVal = st.cpcb_ground_aqi ?? st.aqi;
              return (
                <tr
                  key={st.id}
                  onClick={() => onSelectStation(st)}
                  className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{st.short_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-mono">
                      {st.zone} • {st.station_type}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-100">
                        {aqiVal ? Math.round(aqiVal) : '--'}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                        style={{
                          backgroundColor: `${st.color}20`,
                          color: st.color,
                          borderColor: `${st.color}50`
                        }}
                      >
                        {st.category}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {st.data_classification}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                    {st.cpcb_observation_time || st.last_updated}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      {st.observation_age_hours !== undefined && st.observation_age_hours !== null
                        ? `${st.observation_age_hours}h ago`
                        : 'Fresh'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStation(st);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors text-[11px]"
                    >
                      Inspect 3D
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Excluded Stale Stations (>24h since last observation) */}
      {staleStations.length > 0 && (
        <div className="p-4 bg-amber-950/20 border-t border-amber-800/40 text-xs">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300">
              Excluded Stale Observations (&gt;24 Hours Old — Unranked):
            </span>
          </div>
          <div className="space-y-2">
            {staleStations.map((st) => (
              <div
                key={st.id}
                onClick={() => onSelectStation(st)}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between font-mono text-[11px] cursor-pointer hover:border-amber-500/40"
              >
                <div>
                  <span className="font-bold text-slate-200">{st.short_name}</span>
                  <span className="text-slate-400 ml-2">Last ping: {st.cpcb_observation_time}</span>
                  <span className="text-amber-400 ml-2">({st.observation_age_hours}h old)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Recorded AQI: {st.cpcb_ground_aqi}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800">
                    Stale (&gt;24h)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline / Recalibrating Stations */}
      {offlineStations.length > 0 && (
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Radio className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-slate-300">
              Sensor Telemetry Offline / Awaiting KSPCB Maintenance ({offlineStations.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {offlineStations.map((st) => (
              <span
                key={st.id}
                onClick={() => onSelectStation(st)}
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px] cursor-pointer hover:border-slate-700"
              >
                {st.short_name}: Telemetry Offline (No sample data substituted)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
