"""
Aeris 3D - Bangalore Environmental Intelligence
FastAPI REST Application
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
    TIMEZONE,
    BANGALORE_COORDS
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

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("aeris.api")

app = FastAPI(
    title="Aeris 3D - Bangalore Environmental Intelligence API",
    description="High-resolution live air quality, weather intelligence, 3D geospatial telemetry, and machine-learning forecasting for Bangalore, India.",
    version="1.0.0"
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
    """System and data pipeline health status."""
    now_ist = datetime.now(pytz.timezone(TIMEZONE))
    return {
        "status": "healthy",
        "service": "Aeris 3D Environmental Intelligence Platform",
        "city": "Bangalore",
        "coordinates": BANGALORE_COORDS,
        "server_time_ist": now_ist.isoformat(),
        "timezone": TIMEZONE,
        "version": "1.0.0",
        "providers": {
            "cpcb_ground_stations": "Connected via Public CAAQMS Telemetry",
            "open_meteo_atmospheric_model": "Connected (CAMS Grid)",
            "open_meteo_weather": "Connected (ECMWF High-Res)",
            "ml_inference_engine": "Operational"
        }
    }

@app.get("/api/dashboard")
def get_dashboard():
    """Returns real-time city-wide environmental overview, current AQI, weather, and active alerts."""
    try:
        return get_cached_dashboard_data()
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=503, detail=f"Data provider temporarily unreachable: {str(e)}")

@app.get("/api/stations")
def get_stations():
    """Returns verified Bangalore CPCB monitoring stations with coordinates, real AQI, and localized pollutants."""
    try:
        stations = get_cached_stations()
        return {
            "count": len(stations),
            "stations": stations
        }
    except Exception as e:
        logger.error(f"Error fetching station data: {e}")
        raise HTTPException(status_code=503, detail=f"Station network temporarily unreachable: {str(e)}")

@app.get("/api/rankings")
def get_rankings(sort_by: str = Query("aqi", enum=["aqi", "pm2_5", "name"]), order: str = Query("desc", enum=["asc", "desc"])):
    """Returns area-wise pollution rankings for verified Bangalore stations."""
    try:
        stations = get_cached_stations()
        
        # Filter valid stations for ranking
        valid_stations = [s for s in stations if s["aqi"] is not None and s["aqi"] > 0]
        stale_stations = [s for s in stations if s["aqi"] is None or s["aqi"] <= 0]

        reverse = (order == "desc")
        if sort_by == "name":
            valid_stations.sort(key=lambda x: x["short_name"], reverse=reverse)
        elif sort_by == "pm2_5":
            valid_stations.sort(key=lambda x: (x.get("pm2_5") or 0), reverse=reverse)
        else: # Default aqi
            valid_stations.sort(key=lambda x: x["aqi"], reverse=reverse)

        # Assign rank numbers
        for rank_idx, s in enumerate(valid_stations, start=1):
            s["rank"] = rank_idx

        return {
            "ranking_basis": sort_by,
            "order": order,
            "ranked_stations": valid_stations,
            "offline_or_stale_stations": stale_stations,
            "total_ranked": len(valid_stations),
            "total_monitored": len(stations),
            "timestamp": datetime.now(pytz.timezone(TIMEZONE)).isoformat()
        }
    except Exception as e:
        logger.error(f"Error computing rankings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/timeseries")
def get_timeseries(past_days: int = Query(7, ge=1, le=90), aggregate: str = Query("hourly", enum=["hourly", "daily"])):
    """Returns real historical time-series data for PM2.5, PM10, AQI, and weather."""
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
def get_ml_predictions(hours: int = Query(6, ge=1, le=6), model_type: str = Query("hist_gradient_boosting", enum=["hist_gradient_boosting", "random_forest"])):
    """Generates 1 to 6 hour short-term AQI predictions using trained machine learning models."""
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
def get_ml_metadata(model_type: str = Query("hist_gradient_boosting", enum=["hist_gradient_boosting", "random_forest"])):
    """Returns training parameters, validation metrics (MAE, RMSE, R2), and feature importance."""
    pipeline = get_ml_pipeline(model_type=model_type)
    if not pipeline.is_trained:
        pipeline.train()
    return pipeline.training_metadata

@app.post("/api/ml/retrain")
def retrain_model(past_days: int = Query(30, ge=7, le=60), model_type: str = Query("hist_gradient_boosting", enum=["hist_gradient_boosting", "random_forest"])):
    """Retrains the machine learning model on fresh Bangalore historical data."""
    try:
        pipeline = get_ml_pipeline(model_type=model_type)
        meta = pipeline.train(past_days=past_days)
        return {
            "message": "Model retrained successfully on chronological holdout data.",
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
