import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  MapPin,
  Flame,
  Droplets,
  Wind,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Database,
  Info
} from 'lucide-react';
import { api } from './services/api';
import { DashboardData, Station, RankingsResponse } from './types';
import { Navbar } from './components/Navbar';
import { AqiGauge } from './components/AqiGauge';
import { WeatherMetrics } from './components/WeatherMetrics';
import { BangaloreMap3D } from './components/BangaloreMap3D';
import { RankingsTable } from './components/RankingsTable';
import { HistoricalAnalytics } from './components/HistoricalAnalytics';
import { MlPredictionView } from './components/MlPredictionView';
import { DriverAnalysisView } from './components/DriverAnalysisView';
import { HealthAdvisoriesView } from './components/HealthAdvisoriesView';
import { SolutionsCenterView } from './components/SolutionsCenterView';
import { DataProvenancePanel } from './components/DataProvenancePanel';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [rankings, setRankings] = useState<RankingsResponse | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [dashRes, stationsRes, rankRes] = await Promise.all([
        api.getDashboard(),
        api.getStations(),
        api.getRankings('aqi', 'desc')
      ]);

      setDashboard(dashRes);
      setStations(stationsRes.stations);
      setRankings(rankRes);
      setLoading(false);
      setIsRefreshing(false);
    } catch (err: any) {
      console.error('Failed to load telemetry:', err);
      setError(err.message || 'Unable to fetch real-time Bangalore environmental feeds.');
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectStation = (station: Station | null) => {
    setSelectedStation(station);
    if (station && activeTab !== 'map' && activeTab !== 'dashboard') {
      setActiveTab('map');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 animate-pulse flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <Activity className="w-8 h-8 text-slate-950 animate-bounce" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold font-mono text-slate-100 tracking-wider">
            AERIS 3D — BANGALORE
          </h2>
          <p className="text-xs text-cyan-400 font-mono mt-1">
            Auditing & establishing verified connection to CPCB CAAQMS & ECMWF Streams...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Fixed Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastUpdated={dashboard?.last_updated_human || null}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        activeGroundStations={dashboard?.active_ground_stations || 8}
        staleStationsCount={dashboard?.stale_stations_count || 1}
        offlineStationsCount={dashboard?.offline_stations_count || 1}
        totalStations={dashboard?.total_stations_monitored || 10}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification banner if any */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono"
            >
              Retry
            </button>
          </div>
        )}

        {/* Provenance & Telemetry Integrity Bar */}
        <div className="mb-6 glass-panel px-4 py-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Data Provenance Guarantee:</span>
            <span className="text-slate-400 hidden sm:inline">
              CPCB ground sensors strictly separated from Copernicus atmospheric models.
            </span>
            <button
              onClick={() => setActiveTab('provenance')}
              className="ml-2 text-cyan-400 hover:text-cyan-300 underline font-mono text-[10px]"
            >
              Provenance Details &rarr;
            </button>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              {dashboard?.active_ground_stations ?? 8} Ground Sensors Live
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
              {dashboard?.stale_stations_count ?? 1} Stale (&gt;24h)
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {dashboard?.offline_stations_count ?? 1} Offline
            </span>
          </div>
        </div>

        {/* TAB 1: MAIN COMMAND DASHBOARD */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            {/* Top Overview Grid: Gauge + Hotspot Banner + Key Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radial AQI Gauge */}
              <div className="lg:col-span-1">
                <AqiGauge
                  aqi={dashboard.overall_aqi}
                  category={dashboard.cpcb_category}
                  color={dashboard.cpcb_color}
                  severityLevel={dashboard.cpcb_severity_level}
                  healthSummary={dashboard.health_summary}
                  dominantPollutant={dashboard.dominant_pollutant}
                  activeStationsCount={dashboard.active_ground_stations}
                  modelAqi={dashboard.atmospheric_model_telemetry?.us_aqi}
                  cpcbModelGridNaqi={dashboard.cpcb_model_grid_naqi}
                  isStale={dashboard.is_stale}
                />
              </div>

              {/* Hotspots & City Telemetry Summary */}
              <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                {/* Hotspot & Cleanest Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hotspot Station */}
                  {dashboard.hotspot_station && (
                    <div
                      onClick={() => handleSelectStation(dashboard.hotspot_station!)}
                      className="glass-panel glass-panel-hover p-4 rounded-2xl border border-rose-500/30 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono">
                          <Flame className="w-3.5 h-3.5" />
                          <span>Highest Monitored Area</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-100 mt-0.5">
                          {dashboard.hotspot_station.short_name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {dashboard.hotspot_station.zone}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-rose-400">
                          {dashboard.hotspot_station.cpcb_ground_aqi ?? dashboard.hotspot_station.aqi ?? '--'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dashboard.hotspot_station.category}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cleanest Station */}
                  {dashboard.cleanest_station && (
                    <div
                      onClick={() => handleSelectStation(dashboard.cleanest_station!)}
                      className="glass-panel glass-panel-hover p-4 rounded-2xl border border-emerald-500/30 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Cleanest Monitored Air</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-100 mt-0.5">
                          {dashboard.cleanest_station.short_name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {dashboard.cleanest_station.zone}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          {dashboard.cleanest_station.cpcb_ground_aqi ?? dashboard.cleanest_station.aqi ?? '--'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dashboard.cleanest_station.category}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weather & Pollutant Summary Bar */}
                <WeatherMetrics dashboard={dashboard} />
              </div>
            </div>

            {/* Embedded 3D Map Section with Quick Link to Full Map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Interactive 3D Bangalore Geospatial Intelligence
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    10 verified CAAQMS station coordinates; click any marker to inspect micro-climate telemetry
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
                >
                  <span>Full Map Mode</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <BangaloreMap3D
                stations={stations}
                selectedStation={selectedStation}
                onSelectStation={handleSelectStation}
              />
            </div>

            {/* Area Rankings Preview */}
            {rankings && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Verified Ground Station Rankings
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {rankings.ranking_criteria}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('rankings')}
                    className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
                  >
                    <span>View All Rankings</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <RankingsTable
                  rankedStations={rankings.ranked_stations}
                  staleStations={rankings.stale_stations}
                  offlineStations={rankings.offline_stations}
                  offlineOrStaleStations={rankings.offline_or_stale_stations}
                  onSelectStation={handleSelectStation}
                  selectedStationId={selectedStation?.id}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FULL 3D MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <BangaloreMap3D
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={handleSelectStation}
            />
          </div>
        )}

        {/* TAB 3: AREA RANKINGS */}
        {activeTab === 'rankings' && rankings && (
          <div className="space-y-4">
            <RankingsTable
              rankedStations={rankings.ranked_stations}
              staleStations={rankings.stale_stations}
              offlineStations={rankings.offline_stations}
              offlineOrStaleStations={rankings.offline_or_stale_stations}
              onSelectStation={handleSelectStation}
              selectedStationId={selectedStation?.id}
            />
          </div>
        )}

        {/* TAB 4: HISTORICAL & CORRELATIONS */}
        {activeTab === 'analytics' && <HistoricalAnalytics />}

        {/* TAB 5: MACHINE LEARNING PREDICTION */}
        {activeTab === 'ml' && <MlPredictionView />}

        {/* TAB 6: AI POLLUTION DRIVER INTELLIGENCE */}
        {activeTab === 'ai' && <DriverAnalysisView />}

        {/* TAB 7: HEALTH ADVISORY */}
        {activeTab === 'health' && <HealthAdvisoriesView />}

        {/* TAB 8: SOLUTIONS CENTER */}
        {activeTab === 'solutions' && <SolutionsCenterView />}

        {/* TAB 9: DATA PROVENANCE CATALOG */}
        {activeTab === 'provenance' && <DataProvenancePanel />}
      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-slate-800/80 mt-12 py-6 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            <span className="font-bold text-slate-200">AERIS 3D</span> — Bangalore Air Quality & Weather Intelligence
            <span className="text-slate-600 mx-2">|</span>
            Official CPCB CAAQMS Network + Open-Meteo High-Resolution ECMWF & CAMS Models
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Coordinates: 12.9716°N, 77.5946°E</span>
            <span>Asia/Kolkata</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
