import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Info,
  Shield,
  Activity,
  Calendar,
  Compass,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Database
} from 'lucide-react';
import { Station } from '../types';

interface BangaloreMap3DProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station | null) => void;
}

export const BangaloreMap3D: React.FC<BangaloreMap3DProps> = ({
  stations,
  selectedStation,
  onSelectStation
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  const [is3D, setIs3D] = useState<boolean>(true);
  const [showHeatCircles, setShowHeatCircles] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerWrapperRef = useRef<HTMLDivElement>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [77.5946, 12.9716],
      zoom: 11.2,
      pitch: 55,
      bearing: -15,
      maxPitch: 75,
      antialias: true
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      map.addSource('station-radii', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'station-radii-layer',
        type: 'circle',
        source: 'station-radii',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.22,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.8
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers and Halos
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const features: any[] = [];

    stations.forEach((st) => {
      const aqiVal = st.cpcb_ground_aqi || 50;
      const radiusPx = Math.min(Math.max((aqiVal / 500) * 80 + 20, 25), 90);

      // Only add dispersion halo if station is actively reporting
      if (st.is_valid_for_ranking && st.cpcb_ground_aqi) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [st.longitude, st.latitude]
          },
          properties: {
            id: st.id,
            name: st.short_name,
            aqi: aqiVal,
            color: st.color || '#FBBF24',
            radius: radiusPx
          }
        });
      }

      // Create Custom HTML Marker with data quality styling
      const el = document.createElement('div');
      el.className = 'station-marker-pin flex flex-col items-center group cursor-pointer';

      const isSelected = selectedStation?.id === st.id;
      const isLive = st.data_quality === 'verified';
      const isDelayed = st.data_quality === 'delayed';
      const isStale = st.data_quality === 'stale';
      const isOffline = st.data_quality === 'unavailable';

      let pingBadge = '';
      if (isLive) {
        pingBadge = `<span class="absolute w-8 h-8 rounded-full animate-ping opacity-75" style="background-color: ${st.color}40;"></span>`;
      } else if (isStale) {
        pingBadge = `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950" title="Stale observation (>24h)"></span>`;
      } else if (isOffline) {
        pingBadge = `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-950" title="Sensor offline"></span>`;
      }

      const displayVal = st.cpcb_ground_aqi ? Math.round(st.cpcb_ground_aqi) : 'OFF';
      const borderColor = isOffline ? '#475569' : isStale ? '#F59E0B' : st.color;
      const textColor = isOffline ? '#94A3B8' : isStale ? '#FCD34D' : st.color;

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${pingBadge}
          <div class="relative flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-mono font-bold shadow-xl border ${
            isSelected ? 'ring-2 ring-cyan-400 scale-110' : ''
          }" style="background-color: #0B1120; color: ${textColor}; border-color: ${borderColor};">
            <span>${displayVal}</span>
          </div>
        </div>
        <div class="mt-1 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-slate-950/90 text-slate-200 border border-slate-800 shadow-md whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
          ${st.short_name}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectStation(st);
        map.flyTo({
          center: [st.longitude, st.latitude],
          zoom: 13.5,
          pitch: 60,
          speed: 1.2
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([st.longitude, st.latitude])
        .addTo(map);

      markersRef.current[st.id] = marker;
    });

    if (map.isStyleLoaded() && map.getSource('station-radii')) {
      (map.getSource('station-radii') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: showHeatCircles ? features : []
      });
    }
  }, [stations, selectedStation, showHeatCircles, onSelectStation]);

  const toggle3D = () => {
    const map = mapRef.current;
    if (!map) return;
    if (is3D) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      setIs3D(false);
    } else {
      map.easeTo({ pitch: 60, bearing: -20, duration: 1000 });
      setIs3D(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      containerWrapperRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const resetBangaloreView = () => {
    mapRef.current?.flyTo({
      center: [77.5946, 12.9716],
      zoom: 11.2,
      pitch: is3D ? 55 : 0,
      bearing: is3D ? -15 : 0,
      duration: 1200
    });
  };

  return (
    <div
      ref={containerWrapperRef}
      className={`glass-panel rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl flex flex-col ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[640px] w-full'
      }`}
    >
      {/* Top Map Header & Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-950/80 backdrop-blur-md flex items-center gap-2 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-100 tracking-wide">
            3D Bangalore Verified CAAQMS Spatial Grid
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            [12.9716°N, 77.5946°E]
          </span>
        </div>

        {/* View Controls */}
        <div className="glass-panel p-1 rounded-xl border border-slate-700/80 bg-slate-950/80 backdrop-blur-md flex items-center gap-1 shadow-lg">
          <button
            onClick={toggle3D}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
              is3D
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 3D Perspective Pitch (60°)"
          >
            3D {is3D ? 'Active' : 'Flat'}
          </button>

          <button
            onClick={() => setShowHeatCircles((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
              showHeatCircles
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle AQI Dispersion Halos"
          >
            Halos
          </button>

          <button
            onClick={resetBangaloreView}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Recenter Bangalore City"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Toggle Fullscreen View"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel p-3 rounded-xl border border-slate-700/80 bg-slate-950/85 backdrop-blur-md max-w-xs text-xs shadow-xl">
        <div className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between text-[11px]">
          <span>Data Provenance & Markers</span>
          <span className="font-mono text-[9px] text-slate-400">10 Verified Stations</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
            <span className="text-slate-300">Live (&lt;4h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <span className="text-slate-300">Stale (&gt;24h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0"></span>
            <span className="text-slate-400">Sensor Offline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span className="text-cyan-300">CAMS Grid Model</span>
          </div>
        </div>
      </div>

      {/* Selected Station Drawer / Details Card */}
      {selectedStation && (
        <div className="absolute top-4 right-14 z-20 w-84 glass-panel p-4 rounded-2xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedStation.zone}</span>
              </div>
              <h3 className="font-bold text-base text-slate-100 mt-0.5">
                {selectedStation.short_name}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {selectedStation.name}
              </p>
            </div>
            <button
              onClick={() => onSelectStation(null)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 text-sm"
            >
              ✕
            </button>
          </div>

          {/* AQI Ground Badge */}
          <div className="my-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>CPCB Ground AQI</span>
              </div>
              <div className="text-3xl font-black font-mono text-slate-100">
                {selectedStation.cpcb_ground_aqi ? Math.round(selectedStation.cpcb_ground_aqi) : 'Offline'}
              </div>
            </div>
            <div className="text-right">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: `${selectedStation.color}20`,
                  color: selectedStation.color,
                  borderColor: `${selectedStation.color}60`
                }}
              >
                {selectedStation.category}
              </span>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {selectedStation.data_classification}
              </div>
            </div>
          </div>

          {/* Model Pollutants breakdown */}
          {selectedStation.model_estimates && (
            <div className="space-y-1.5 mb-3">
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>Regional Atmospheric Model (CAMS Grid):</span>
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                Model grid estimate (0.1° / ~11km) — not an independent neighborhood sensor
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-1">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">PM2.5 (Model)</span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedStation.model_estimates.pm2_5 ? `${selectedStation.model_estimates.pm2_5} µg/m³` : '--'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">PM10 (Model)</span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedStation.model_estimates.pm10 ? `${selectedStation.model_estimates.pm10} µg/m³` : '--'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">NO2 (Model)</span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedStation.model_estimates.no2 ? `${selectedStation.model_estimates.no2} µg/m³` : '--'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Ozone (Model)</span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedStation.model_estimates.ozone ? `${selectedStation.model_estimates.ozone} µg/m³` : '--'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Telemetry Source & Metadata */}
          <div className="text-[11px] text-slate-400 space-y-1.5 border-t border-slate-800/80 pt-2.5">
            <div className="flex items-center justify-between">
              <span>Station Type:</span>
              <span className="text-slate-300 font-medium">{selectedStation.station_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Verified Coordinates:</span>
              <span className="font-mono text-slate-300">
                {selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Elevation:</span>
              <span className="font-mono text-slate-300">{selectedStation.elevation_m}m ASL</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Official Network:</span>
              <span className="text-cyan-400">{selectedStation.official_network}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span>Sensor Observation:</span>
              <span className="text-slate-300 font-mono">
                {selectedStation.cpcb_observation_time || 'No ping received'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
