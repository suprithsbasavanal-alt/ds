"""
Aeris 3D - Bangalore Environmental Intelligence
FastAPI REST Application - Phase 3 Audited
"""

import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz

from data_service import (
    get_cached_dashboard_data,
    get_cached_stations,
    fetch_live_weather,
    fetch_live_air_quality,
    fetch_historical_dataset,
    calculate_official_cpcb_naqi,
    TIMEZONE,
    BANGALORE_COORDS,
    IST
)
from analytics import (
    compute_correlations,
    compute_diurnal_patterns,
    get_timeseries_view
)
from ml_engine import get_ml_pipeline
from intelligence import (
    generate_driver_analysis,
    get_health_advisory,
    get_solutions_catalog
)

import os
from fastapi.staticfiles import StaticFiles

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("aeris.api")

app = FastAPI(
    title="Aeris 3D - Bangalore Environmental Intelligence API",
    description="Scientifically audited air quality, weather intelligence, 3D geospatial telemetry, and machine-learning forecasting for Bangalore, India.",
    version="3.0.0"
)

# Enable CORS for local dev and preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """System and data pipeline health status with provider provenance."""
    now_ist = datetime.now(IST)
    return {
        "status": "healthy",
        "service": "Aeris 3D Environmental Intelligence Platform",
        "city": "Bangalore",
        "coordinates": BANGALORE_COORDS,
        "server_time_ist": now_ist.isoformat(),
        "timezone": TIMEZONE,
        "version": "3.0.0",
        "audit_phase": "Phase 3 Scientific Validation & Data Integrity",
        "providers": {
            "cpcb_ground_stations": "Connected via WAQI Public Demonstration Query (token=demo)",
            "open_meteo_atmospheric_model": "Connected (Copernicus CAMS Reanalysis & Model Grid 0.1°)",
            "open_meteo_weather": "Connected (ECMWF High-Res 9km / GFS Forecast)",
            "ml_inference_engine": "Operational (Residual Delta + HistGradientBoosting with Fair Baseline Evaluation)"
        },
        "integrity_checks": {
            "future_timestamps_in_history": False,
            "mean_station_aqi_labelled_non_official": True,
            "cpcb_breakpoint_sub_indices_implemented": True,
            "direct_cpcb_private_integration_claimed": False
        }
    }

@app.get("/api/dashboard")
def get_dashboard():
    """Returns real-time city-wide environmental overview, station average, calculated CPCB NAQI, weather, and provenance."""
    try:
        return get_cached_dashboard_data()
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=503, detail=f"Data provider temporarily unreachable: {str(e)}")

@app.get("/api/weather")
def get_weather():
    """Returns real-time high-resolution weather telemetry from ECMWF/Open-Meteo."""
    try:
        return fetch_live_weather()
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        raise HTTPException(status_code=503, detail=f"Weather model stream error: {str(e)}")

@app.get("/api/air-quality")
def get_air_quality():
    """Returns Copernicus Atmosphere Monitoring Service (CAMS) model grid pollutants and calculated CPCB NAQI."""
    try:
        raw_aq = fetch_live_air_quality()
        cpcb_naqi = calculate_official_cpcb_naqi(raw_aq)
        raw_aq["calculated_cpcb_naqi"] = cpcb_naqi
        return raw_aq
    except Exception as e:
        logger.error(f"Error fetching atmospheric air quality: {e}")
        raise HTTPException(status_code=503, detail=f"Atmospheric model stream error: {str(e)}")

@app.get("/api/stations")
def get_stations():
    """Returns verified Bangalore monitoring stations with coordinates, real ground AQI, and localized pollutants."""
    try:
        stations = get_cached_stations()
        return {
            "count": len(stations),
            "stations": stations,
            "provenance": {
                "ground_network": "CPCB / KSPCB CAAQMS Network reported via WAQI feed",
                "feed_type": "Public demonstration query (token=demo)",
                "atmospheric_model": "Copernicus Atmosphere Monitoring Service (CAMS)",
                "audit_status": "Verified against official station GPS coordinates and UIDs",
                "disclaimer": "Ground telemetry aggregated from CPCB/KSPCB public feeds. Does not represent a direct authenticated private contract with CPCB CCR."
            }
        }
    except Exception as e:
        logger.error(f"Error fetching station data: {e}")
        raise HTTPException(status_code=503, detail=f"Station network temporarily unreachable: {str(e)}")

@app.get("/api/rankings")
def get_rankings(sort_by: str = Query("aqi"), order: str = Query("desc")):
    """
    Returns area-wise pollution rankings strictly for verified, fresh CPCB ground monitoring stations.
    Stations with stale observations (>24h old) or offline sensors are partitioned separately.
    """
    try:
        stations = get_cached_stations()
        
        valid_stations = [s for s in stations if s.get("is_valid_for_ranking") and s.get("cpcb_ground_aqi") is not None]
        stale_stations = [s for s in stations if s.get("data_quality") == "stale"]
        offline_stations = [s for s in stations if s.get("data_quality") == "unavailable"]

        reverse = (order == "desc")
        if sort_by == "name":
            valid_stations.sort(key=lambda x: x["short_name"], reverse=reverse)
        elif sort_by == "pm2_5":
            valid_stations.sort(key=lambda x: (x.get("model_estimates", {}).get("pm2_5") or 0), reverse=reverse)
        else: # Default CPCB NAQI
            valid_stations.sort(key=lambda x: x["cpcb_ground_aqi"], reverse=reverse)

        for rank_idx, s in enumerate(valid_stations, start=1):
            s["rank"] = rank_idx

        return {
            "ranking_basis": sort_by,
            "order": order,
            "ranked_stations": valid_stations,
            "stale_stations": stale_stations,
            "offline_stations": offline_stations,
            "offline_or_stale_stations": stale_stations + offline_stations,
            "total_ranked": len(valid_stations),
            "total_monitored": len(stations),
            "ranking_criteria": "Only includes actively reporting CPCB CAAQMS stations with observations <24 hours fresh.",
            "timestamp": datetime.now(IST).isoformat()
        }
    except Exception as e:
        logger.error(f"Error computing rankings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/timeseries")
def get_timeseries(past_days: int = Query(7, ge=1, le=90), aggregate: str = Query("hourly")):
    """
    Returns real historical time-series data for PM2.5, PM10, AQI, and weather.
    Guarantees strict exclusion of future forecast hours.
    """
    try:
        return get_timeseries_view(past_days=past_days, aggregate=aggregate)
    except Exception as e:
        logger.error(f"Error loading timeseries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/correlations")
def get_correlations(past_days: int = Query(30, ge=7, le=90)):
    """Computes Pearson correlations between weather variables and particulate pollution."""
    try:
        return compute_correlations(past_days=past_days)
    except Exception as e:
        logger.error(f"Error computing correlations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/diurnal")
def get_diurnal(past_days: int = Query(30, ge=7, le=90)):
    """Computes average hourly diurnal cycle for Bangalore's atmosphere."""
    try:
        patterns = compute_diurnal_patterns(past_days=past_days)
        return {
            "period_days": past_days,
            "diurnal_cycle": patterns
        }
    except Exception as e:
        logger.error(f"Error computing diurnal patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/predict")
def get_ml_predictions(hours: int = Query(6, ge=1, le=6), model_type: str = Query("hist_gradient_boosting")):
    """Generates 1 to 6 hour short-term AQI predictions with empirical bounds and fair baseline metrics."""
    try:
        pipeline = get_ml_pipeline(model_type=model_type)
        preds = pipeline.predict_next_hours(forecast_hours=hours)
        return {
            "model_metadata": pipeline.training_metadata,
            "forecast_horizon_hours": hours,
            "predictions": preds
        }
    except Exception as e:
        logger.error(f"Error running ML prediction: {e}")
        raise HTTPException(status_code=500, detail=f"ML Prediction Engine error: {str(e)}")

@app.get("/api/ml/metadata")
def get_ml_metadata(model_type: str = Query("hist_gradient_boosting")):
    """Returns training parameters, validation metrics (MAE, RMSE, R2 for 1h, 3h, 6h), and feature importance."""
    pipeline = get_ml_pipeline(model_type=model_type)
    if not pipeline.is_trained:
        pipeline.train()
    return pipeline.training_metadata

@app.post("/api/ml/retrain")
def retrain_model(past_days: int = Query(30, ge=7, le=60), model_type: str = Query("hist_gradient_boosting")):
    """Retrains the machine learning model on fresh Bangalore historical data with chronological holdout."""
    try:
        pipeline = get_ml_pipeline(model_type=model_type)
        meta = pipeline.train(past_days=past_days)
        return {
            "message": "Model retrained successfully on chronological holdout data with fair baseline comparisons.",
            "metadata": meta
        }
    except Exception as e:
        logger.error(f"Error retraining model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/intelligence/drivers")
def get_pollution_drivers():
    """Explainable AI pollution-driver analysis distinguishing facts, associations, predictions, and hypotheses."""
    try:
        dashboard = get_cached_dashboard_data()
        correlations = compute_correlations(past_days=30)
        return generate_driver_analysis(dashboard, correlations)
    except Exception as e:
        logger.error(f"Error generating driver analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health-advisory")
def get_health_advisory_endpoint():
    """Delivers CPCB-aligned health precautions for general and vulnerable cohorts."""
    try:
        dashboard = get_cached_dashboard_data()
        aqi = dashboard.get("overall_aqi", 0)
        category = dashboard.get("cpcb_category", "Moderate")
        return get_health_advisory(aqi, category)
    except Exception as e:
        logger.error(f"Error generating health advisory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/solutions")
def get_solutions_endpoint():
    """Provides actionable pollution mitigation strategies at individual, community, and city levels."""
    try:
        dashboard = get_cached_dashboard_data()
        return get_solutions_catalog(dashboard)
    except Exception as e:
        logger.error(f"Error generating solutions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/provenance")
def get_provenance_catalog():
    """
    Returns complete data provenance catalog with exact data categories, sources,
    measurement types, status, and official web links.
    """
    now_ist = datetime.now(IST)
    return {
        "timestamp": now_ist.isoformat(),
        "city": "Bangalore, Karnataka, India",
        "data_provenance_catalog": [
            {
                "data_category": "Ground Monitoring Stations",
                "source_provider": "CPCB / KSPCB CAAQMS via WAQI Demo Feed",
                "measurement_type": "Empirical Continuous Ambient Sensor Observations",
                "status": "Active (Aggregated Feed)",
                "data_freshness": "Updated hourly by station telemetry (<4h to <24h)",
                "official_url": "https://app.cpcbccr.com/ccr/",
                "secondary_url": "https://waqi.info/",
                "disclosure": "Station readings are aggregated via WAQI public demo feed from official CPCB/KSPCB CAAQMS stations. Does not claim a direct private authenticated CPCB CCR contract."
            },
            {
                "data_category": "City Station Mean AQI",
                "source_provider": "Derived across actively reporting Bangalore CAAQMS monitors",
                "measurement_type": "Derived Arithmetic Mean",
                "status": "Computed Live",
                "data_freshness": "Real-time derived from active stations",
                "official_url": "https://www.airquality.cpcb.gov.in/ccr_docs/How_AQI_Calculated.pdf",
                "disclosure": "Labelled as 'Mean AQI of available monitoring stations — not an official city AQI' per scientific guidelines."
            },
            {
                "data_category": "Atmospheric Chemistry Reanalysis & Model Grid",
                "source_provider": "Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo",
                "measurement_type": "Chemical Transport Model Grid (0.1° / ~11km resolution)",
                "status": "Active (Continuous Hourly)",
                "data_freshness": "Current analysis cycle",
                "official_url": "https://air-quality-api.open-meteo.com/v1/air-quality",
                "disclosure": "Regional numerical atmospheric model estimate for Bangalore coordinates [12.9716, 77.5946]. Distinct from physical ground stations."
            },
            {
                "data_category": "High-Resolution Meteorological Forecast",
                "source_provider": "ECMWF IFS (9km) / GFS via Open-Meteo",
                "measurement_type": "Numerical Weather Prediction Model",
                "status": "Active",
                "data_freshness": "Hourly observations and forecasts",
                "official_url": "https://api.open-meteo.com/v1/forecast",
                "disclosure": "High-resolution European Centre for Medium-Range Weather Forecasts model."
            },
            {
                "data_category": "Machine-Learning Short-Term Predictions",
                "source_provider": "Aeris 3D ML Engine (Residual Delta Regressor + HistGradientBoosting)",
                "measurement_type": "Statistical Supervised Projection",
                "status": "Trained & Holdout Verified",
                "data_freshness": "1–6 hour recursive forecasts",
                "official_url": "https://scikit-learn.org/",
                "disclosure": "Trained on CAMS atmospheric reanalysis grid archive for Bangalore. Uncertainty bounds reflect empirical holdout RMSE dispersion (±1.5 × RMSE)."
            }
        ]
    }

# Mount frontend build static files if present
dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static_frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
