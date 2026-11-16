export interface StationModelEstimates {
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  ozone: number | null;
  model_aqi: number | null;
  attribution: string;
}

export interface Station {
  id: string;
  waqi_uid?: number;
  name: string;
  short_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  zone: string;
  station_type: string;
  official_network: string;
  aqi: number | null;
  cpcb_ground_aqi: number | null;
  cpcb_observation_time: string | null;
  observation_age_hours?: number | null;
  data_quality: 'verified' | 'delayed' | 'stale' | 'unavailable';
  data_classification: string;
  is_valid_for_ranking: boolean;
  category: string;
  color: string;
  severity_level: number;
  description: string;
  model_estimates?: StationModelEstimates;
  last_updated: string;
  rank?: number;
}

export interface RankingsResponse {
  ranking_basis: string;
  order: string;
  ranked_stations: Station[];
  stale_stations: Station[];
  offline_stations: Station[];
  offline_or_stale_stations: Station[];
  total_ranked: number;
  total_monitored: number;
  ranking_criteria: string;
  timestamp: string;
}

export interface DashboardData {
  city: string;
  state: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  timezone: string;
  last_updated: string;
  last_updated_human: string;
  ground_station_telemetry?: {
    mean_station_aqi: number | null;
    label: string;
    category: string;
    color: string;
    severity_level: number;
    description: string;
    active_stations_counted: number;
    total_stations_monitored: number;
    status: string;
    data_source: string;
    measurement_type: string;
    applicable_scale: string;
  };
  cpcb_model_grid_naqi?: {
    calculated_naqi: number | null;
    prominent_pollutant: string | null;
    category: string;
    color: string;
    sub_indices: Record<string, number>;
    criteria_met: boolean;
    methodology: string;
    official_reference_url: string;
  };
  atmospheric_model_telemetry: {
    us_aqi: number | null;
    european_aqi: number | null;
    pm2_5: { value: number | null; unit: string };
    pm10: { value: number | null; unit: string };
    no2: { value: number | null; unit: string };
    so2: { value: number | null; unit: string };
    co: { value: number | null; unit: string };
    ozone: { value: number | null; unit: string };
    data_source: string;
    measurement_type: string;
  };
  weather_telemetry: {
    temperature: { value: number | null; unit: string };
    apparent_temperature: { value: number | null; unit: string };
    relative_humidity: { value: number | null; unit: string };
    wind_speed: { value: number | null; unit: string };
    wind_direction: { value: number | null; unit: string };
    precipitation: { value: number | null; unit: string };
    surface_pressure: { value: number | null; unit: string };
    cloud_cover: { value: number | null; unit: string };
    data_source: string;
    measurement_type: string;
    observation_time?: string;
  };
  overall_aqi: number | null;
  overall_aqi_label?: string;
  cpcb_category: string;
  cpcb_color: string;
  cpcb_severity_level: number;
  health_summary: string;
  dominant_pollutant: string;
  pollutants: {
    pm2_5: { value: number | null; unit: string; label: string; source: string };
    pm10: { value: number | null; unit: string; label: string; source: string };
    no2: { value: number | null; unit: string; label: string; source: string };
    so2: { value: number | null; unit: string; label: string; source: string };
    co: { value: number | null; unit: string; label: string; source: string };
    ozone: { value: number | null; unit: string; label: string; source: string };
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
  stale_stations_count: number;
  offline_stations_count: number;
  data_provenance: {
    ground_monitoring_feed?: string;
    ground_monitoring?: string;
    atmospheric_model: string;
    meteorological_model: string;
    audit_timestamp: string;
    integrity_policy: string;
  };
  is_stale?: boolean;
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
  uncertainty_spread?: number;
  uncertainty_label?: string;
  category: string;
  color: string;
  expected_temp: number;
  expected_humidity: number;
  expected_wind_speed: number;
  model_used?: string;
  is_model_prediction: boolean;
  classification: string;
}

export interface HorizonComparison {
  horizon_hours: number;
  naive_persistence: {
    mae: number;
    rmse: number;
    r2_score: number;
  };
  machine_learning: {
    mae: number;
    rmse: number;
    r2_score: number;
  };
  superior_model: string;
  hybrid_ensemble?: {
    mae: number;
    rmse: number;
    r2_score: number;
  };
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
  target_variable?: {
    name: string;
    grid_coordinates: number[];
    resolution: string;
    disclosure: string;
  };
  metrics: {
    mae?: number;
    rmse?: number;
    r2_score?: number;
    mae_1h?: number;
    rmse_1h?: number;
    r2_score_1h?: number;
    baseline_persistence_mae_1h?: number;
    baseline_persistence_rmse_1h?: number;
    baseline_persistence_mae_3h?: number;
    baseline_persistence_rmse_3h?: number;
    baseline_persistence_mae_6h?: number;
    baseline_persistence_rmse_6h?: number;
    active_1h_predictor?: string;
    evaluation_notes?: string;
  };
  multi_horizon_comparison?: Record<string, HorizonComparison>;
  uncertainty_calibration?: {
    method: string;
    label: string;
    coverage_disclaimer: string;
  };
  feature_importance: Array<{ feature: string; importance: number }>;
  data_source: string;
  epistemological_classification: string;
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

export interface ProvenanceItem {
  data_category: string;
  source_provider: string;
  measurement_type: string;
  status: string;
  data_freshness: string;
  official_url: string;
  secondary_url?: string;
  disclosure: string;
}

export interface ProvenanceResponse {
  timestamp: string;
  city: string;
  data_provenance_catalog: ProvenanceItem[];
}
