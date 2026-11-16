export interface DashboardData {
  city: string;
  state: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  timezone: string;
  last_updated: string;
  last_updated_human: string;
  overall_aqi: number;
  cpcb_category: string;
  cpcb_color: string;
  cpcb_severity_level: number;
  health_summary: string;
  dominant_pollutant: string;
  pollutants: {
    pm2_5: { value: number | null; unit: string; label: string };
    pm10: { value: number | null; unit: string; label: string };
    no2: { value: number | null; unit: string; label: string };
    so2: { value: number | null; unit: string; label: string };
    co: { value: number | null; unit: string; label: string };
    ozone: { value: number | null; unit: string; label: string };
  };
  weather: {
    temperature: { value: number | null; unit: string };
    apparent_temperature: { value: number | null; unit: string };
    relative_humidity: { value: number | null; unit: string };
    wind_speed: { value: number | null; unit: string };
    wind_direction: { value: number | null; unit: string };
    precipitation: { value: number | null; unit: string };
    surface_pressure: { value: number | null; unit: string };
    cloud_cover: { value: number | null; unit: string };
  };
  hotspot_station?: Station | null;
  cleanest_station?: Station | null;
  total_stations_monitored: number;
  active_ground_stations: number;
  sources: {
    ground_monitoring: string;
    atmospheric_model: string;
    weather_model: string;
  };
  is_stale?: boolean;
}

export interface Station {
  id: string;
  name: string;
  short_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  zone: string;
  station_type: string;
  aqi: number | null;
  cpcb_ground_aqi: number | null;
  cpcb_observation_time: string | null;
  category: string;
  color: string;
  severity_level: number;
  description: string;
  pm2_5?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  ozone?: number | null;
  effective_source: string;
  data_type: 'Ground Observation' | 'Atmospheric Model';
  is_ground_monitoring_active: boolean;
  last_updated: string;
  rank?: number;
}

export interface RankingsResponse {
  ranking_basis: string;
  order: string;
  ranked_stations: Station[];
  offline_or_stale_stations: Station[];
  total_ranked: number;
  total_monitored: number;
  timestamp: string;
}

export interface TimeseriesRecord {
  timestamp?: string;
  date?: string;
  display_time?: string;
  pm2_5: number | null;
  pm2_5_min?: number | null;
  pm2_5_max?: number | null;
  pm10: number | null;
  aqi: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  ozone?: number | null;
  temperature: number | null;
  relative_humidity: number | null;
  wind_speed: number | null;
  precipitation?: number | null;
}

export interface CorrelationData {
  analysis_period_days: number;
  sample_size: number;
  correlation_matrix: Record<string, Record<string, number>>;
  key_associations: {
    temperature_vs_pm25: { r: number; strength: string; direction: string; statistical_summary: string };
    humidity_vs_pm25: { r: number; strength: string; direction: string; statistical_summary: string };
    wind_speed_vs_pm25: { r: number; strength: string; direction: string; statistical_summary: string };
    precipitation_vs_pm25: { r: number; strength: string; direction: string; statistical_summary: string };
  };
  scatter_samples: {
    temperature: Array<{ x: number; y: number; time: string }>;
    humidity: Array<{ x: number; y: number; time: string }>;
    wind: Array<{ x: number; y: number; time: string }>;
  };
  scientific_disclaimer: string;
}

export interface DiurnalRecord {
  hour: number;
  display_hour: string;
  pm2_5: number | null;
  pm10: number | null;
  aqi: number | null;
  temperature: number | null;
  wind_speed: number | null;
  relative_humidity: number | null;
}

export interface PredictionStep {
  step_ahead: number;
  target_timestamp: string;
  display_time: string;
  predicted_aqi: number;
  lower_bound: number;
  upper_bound: number;
  category: string;
  color: string;
  expected_temp: number;
  expected_humidity: number;
  expected_wind_speed: number;
  is_model_prediction: boolean;
}

export interface ModelMetadata {
  model_algorithm: string;
  model_type: string;
  status: string;
  trained_at: string;
  training_date_range: { start: string; end: string };
  test_evaluation_range: { start: string; end: string };
  total_samples: number;
  train_samples: number;
  test_samples: number;
  metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
    baseline_persistence_mae: number;
    baseline_persistence_rmse: number;
    mae_improvement_pct: number;
    rmse_improvement_pct: number;
  };
  feature_importance: Array<{ feature: string; importance: number }>;
  data_source: string;
}

export interface DriverAnalysis {
  status: string;
  timestamp: string;
  measured_facts: string[];
  statistical_associations: string[];
  model_predictions: string[];
  source_hypotheses: string[];
  primary_driver_summary: string;
}

export interface HealthAdvisory {
  aqi: number;
  category: string;
  target_demographics: Array<{
    group: string;
    icon: string;
    risk_level: string;
    advice: string;
  }>;
  practical_precautions: {
    mask_guidance: string;
    ventilation_guidance: string;
    exercise_precautions: string;
    emergency_symptoms: string[];
  };
  medical_disclaimer: string;
}

export interface SolutionsData {
  individual_actions: Array<{
    title: string;
    impact: string;
    timeline: string;
    description: string;
  }>;
  community_actions: Array<{
    title: string;
    impact: string;
    timeline: string;
    description: string;
  }>;
  municipal_and_policy_actions: Array<{
    title: string;
    impact: string;
    timeline: string;
    description: string;
  }>;
  measured_trigger_context: string;
}
