import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  Cpu,
  Brain,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lastUpdated: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeGroundStations: number;
  staleStationsCount: number;
  offlineStationsCount: number;
  totalStations: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lastUpdated,
  onRefresh,
  isRefreshing,
  activeGroundStations,
  staleStationsCount,
  offlineStationsCount,
  totalStations
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(180); // 3 minutes refresh cycle

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'map', label: '3D Bangalore Map', icon: Layers },
    { id: 'rankings', label: 'Area Rankings', icon: MapPin },
    { id: 'analytics', label: 'Historical & Correlations', icon: TrendingUp },
    { id: 'ml', label: 'ML Predictions', icon: Cpu },
    { id: 'ai', label: 'AI Driver Intelligence', icon: Brain },
    { id: 'health', label: 'Health Advisory', icon: ShieldAlert },
    { id: 'solutions', label: 'Solutions Center', icon: Sparkles },
    { id: 'provenance', label: 'Data Provenance', icon: ShieldCheck },
  ];

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-[#070B14]/90 backdrop-blur-md">
      {/* Top status bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-slate-950">
            <Radio className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base sm:text-lg bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                AERIS 3D
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                Bangalore Verified CAAQMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Empirical Ground Observations & Meteorological Telemetry
            </p>
          </div>
        </div>

        {/* Center telemetry metadata badges with audited data quality */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
          {/* CPCB Ground Telemetry Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>CPCB Ground:</span>
            <span className="text-emerald-400 font-semibold">{activeGroundStations} Live</span>
            {staleStationsCount > 0 && (
              <span className="text-amber-400">({staleStationsCount} Stale)</span>
            )}
            {offlineStationsCount > 0 && (
              <span className="text-rose-400">({offlineStationsCount} Offline)</span>
            )}
          </div>

          {/* Model Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400">CAMS Grid:</span>
            <span className="text-slate-400">Model OK</span>
          </div>
        </div>

        {/* Right time & refresh */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-md font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr || 'Loading clock...'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCountdown(180);
                onRefresh();
              }}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all font-mono active:scale-95 disabled:opacity-50"
              title="Refresh telemetry feed now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="text-[10px] text-cyan-300/70">({formatCountdown(countdown)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 py-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
