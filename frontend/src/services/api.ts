import {
  DashboardData,
  Station,
  RankingsResponse,
  TimeseriesRecord,
  CorrelationData,
  DiurnalRecord,
  PredictionStep,
  ModelMetadata,
  DriverAnalysis,
  HealthAdvisory,
  SolutionsData,
  ProvenanceResponse
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });
  if (!res.ok) {
    let errMsg = `API error (${res.status}): ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody.detail) errMsg = errBody.detail;
    } catch {
      // Keep generic error
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  getHealth: () => fetchJson<{ status: string; service: string; city: string; server_time_ist: string }>('/health'),
  
  getDashboard: () => fetchJson<DashboardData>('/dashboard'),

  getStations: () => fetchJson<{ count: number; stations: Station[] }>('/stations'),

  getRankings: (sortBy: 'aqi' | 'pm2_5' | 'name' = 'aqi', order: 'asc' | 'desc' = 'desc') =>
    fetchJson<RankingsResponse>(`/rankings?sort_by=${sortBy}&order=${order}`),

  getTimeseries: (pastDays: number = 7, aggregate: 'hourly' | 'daily' = 'hourly') =>
    fetchJson<{ aggregate: string; period_days: number; count: number; records: TimeseriesRecord[] }>(
      `/analytics/timeseries?past_days=${pastDays}&aggregate=${aggregate}`
    ),

  getCorrelations: (pastDays: number = 30) =>
    fetchJson<CorrelationData>(`/analytics/correlations?past_days=${pastDays}`),

  getDiurnalPatterns: (pastDays: number = 30) =>
    fetchJson<{ period_days: number; diurnal_cycle: DiurnalRecord[] }>(`/analytics/diurnal?past_days=${pastDays}`),

  getMlPredictions: (hours: number = 6, modelType: 'hist_gradient_boosting' | 'random_forest' = 'hist_gradient_boosting') =>
    fetchJson<{ model_metadata: ModelMetadata; forecast_horizon_hours: number; predictions: PredictionStep[] }>(
      `/ml/predict?hours=${hours}&model_type=${modelType}`
    ),

  getMlMetadata: (modelType: 'hist_gradient_boosting' | 'random_forest' = 'hist_gradient_boosting') =>
    fetchJson<ModelMetadata>(`/ml/metadata?model_type=${modelType}`),

  retrainModel: (pastDays: number = 30, modelType: 'hist_gradient_boosting' | 'random_forest' = 'hist_gradient_boosting') =>
    fetchJson<{ message: string; metadata: ModelMetadata }>(`/ml/retrain?past_days=${pastDays}&model_type=${modelType}`, {
      method: 'POST'
    }),

  getDriverAnalysis: () => fetchJson<DriverAnalysis>('/intelligence/drivers'),

  getHealthAdvisory: () => fetchJson<HealthAdvisory>('/health-advisory'),

  getSolutions: () => fetchJson<SolutionsData>('/solutions'),

  getProvenance: () => fetchJson<ProvenanceResponse>('/provenance')
};
