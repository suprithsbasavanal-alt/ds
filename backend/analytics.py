"""
Analytics Module for Aeris 3D
Computes rigorous statistical correlations, diurnal aggregations,
time-series trendlines, and meteorological relationships using real Bangalore data.
Adheres strictly to scientific principles: correlation does not imply causation.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from data_service import fetch_historical_dataset

logger = logging.getLogger("aeris.analytics")

def compute_correlations(past_days: int = 30) -> Dict[str, Any]:
    """
    Computes Pearson correlation coefficients between atmospheric variables
    and particulate concentrations.
    """
    dataset = fetch_historical_dataset(past_days=past_days)
    records = dataset.get("records", [])
    if not records:
        return {"error": "No historical records available for correlation analysis."}

    df = pd.DataFrame(records)
    num_cols = ["pm2_5", "pm10", "aqi", "temperature", "relative_humidity", "wind_speed", "surface_pressure", "precipitation"]
    for c in num_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    clean_df = df.dropna(subset=["pm2_5", "temperature", "relative_humidity", "wind_speed"])

    if len(clean_df) < 24:
        return {"error": "Insufficient valid observations for statistical correlation."}

    corr_matrix = clean_df[num_cols].corr().round(3).to_dict()

    # Formulate scientific interpretations without causal claims
    def interpret_corr(r: float, var_name: str) -> Dict[str, Any]:
        direction = "negative" if r < 0 else "positive"
        mag = abs(r)
        if mag > 0.7:
            strength = "strong"
        elif mag > 0.4:
            strength = "moderate"
        elif mag > 0.2:
            strength = "weak"
        else:
            strength = "negligible"

        return {
            "r": r,
            "strength": strength,
            "direction": direction,
            "statistical_summary": f"Observed a {strength} {direction} association (r = {r}) between {var_name} and PM2.5 in Bangalore's monitored atmosphere."
        }

    temp_pm25 = corr_matrix.get("temperature", {}).get("pm2_5", 0.0)
    rh_pm25 = corr_matrix.get("relative_humidity", {}).get("pm2_5", 0.0)
    wind_pm25 = corr_matrix.get("wind_speed", {}).get("pm2_5", 0.0)
    precip_pm25 = corr_matrix.get("precipitation", {}).get("pm2_5", 0.0)

    # Calculate scatter plot pairs for frontend rendering
    scatter_temp = [{"x": round(row["temperature"], 1), "y": round(row["pm2_5"], 1), "time": row["timestamp"]} 
                    for _, row in clean_df.sample(min(120, len(clean_df)), random_state=42).iterrows()]
    scatter_humidity = [{"x": round(row["relative_humidity"], 1), "y": round(row["pm2_5"], 1), "time": row["timestamp"]} 
                        for _, row in clean_df.sample(min(120, len(clean_df)), random_state=42).iterrows()]
    scatter_wind = [{"x": round(row["wind_speed"], 1), "y": round(row["pm2_5"], 1), "time": row["timestamp"]} 
                    for _, row in clean_df.sample(min(120, len(clean_df)), random_state=42).iterrows()]

    return {
        "analysis_period_days": past_days,
        "sample_size": len(clean_df),
        "correlation_matrix": corr_matrix,
        "key_associations": {
            "temperature_vs_pm25": interpret_corr(temp_pm25, "ambient temperature"),
            "humidity_vs_pm25": interpret_corr(rh_pm25, "relative humidity"),
            "wind_speed_vs_pm25": interpret_corr(wind_pm25, "wind speed (ventilation)"),
            "precipitation_vs_pm25": interpret_corr(precip_pm25, "precipitation (wet deposition)")
        },
        "scatter_samples": {
            "temperature": scatter_temp,
            "humidity": scatter_humidity,
            "wind": scatter_wind
        },
        "scientific_disclaimer": "Statistical associations indicate co-variation only and do not establish direct causality. Local microclimates and emission fluxes also govern ambient concentrations."
    }


def compute_diurnal_patterns(past_days: int = 30) -> List[Dict[str, Any]]:
    """
    Computes average hourly diurnal cycle of PM2.5, PM10, AQI, temperature, and wind.
    Reveals morning and evening peaks typical of urban boundary layer shifts and traffic patterns.
    """
    dataset = fetch_historical_dataset(past_days=past_days)
    records = dataset.get("records", [])
    if not records:
        return []

    df = pd.DataFrame(records)
    df["dt"] = pd.to_datetime(df["timestamp"])
    df["hour"] = df["dt"].dt.hour

    for c in ["pm2_5", "pm10", "aqi", "temperature", "wind_speed", "relative_humidity"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    diurnal = df.groupby("hour").agg({
        "pm2_5": "mean",
        "pm10": "mean",
        "aqi": "mean",
        "temperature": "mean",
        "wind_speed": "mean",
        "relative_humidity": "mean"
    }).reset_index()

    output = []
    for _, row in diurnal.iterrows():
        h = int(row["hour"])
        ampm = "AM" if h < 12 else "PM"
        display_h = 12 if h in (0, 12) else h % 12
        output.append({
            "hour": h,
            "display_hour": f"{display_h} {ampm}",
            "pm2_5": round(float(row["pm2_5"]), 1) if not pd.isna(row["pm2_5"]) else None,
            "pm10": round(float(row["pm10"]), 1) if not pd.isna(row["pm10"]) else None,
            "aqi": round(float(row["aqi"]), 1) if not pd.isna(row["aqi"]) else None,
            "temperature": round(float(row["temperature"]), 1) if not pd.isna(row["temperature"]) else None,
            "wind_speed": round(float(row["wind_speed"]), 1) if not pd.isna(row["wind_speed"]) else None,
            "relative_humidity": round(float(row["relative_humidity"]), 1) if not pd.isna(row["relative_humidity"]) else None,
        })
    return output


def get_timeseries_view(past_days: int = 7, aggregate: str = "hourly") -> Dict[str, Any]:
    """
    Provides aggregated or raw hourly time-series data for interactive charting.
    """
    dataset = fetch_historical_dataset(past_days=past_days)
    records = dataset.get("records", [])
    if not records:
        return {"records": [], "count": 0}

    df = pd.DataFrame(records)
    df["dt"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("dt").reset_index(drop=True)

    if aggregate == "daily":
        df["date"] = df["dt"].dt.strftime("%Y-%m-%d")
        daily = df.groupby("date").agg({
            "pm2_5": ["mean", "min", "max"],
            "pm10": ["mean", "min", "max"],
            "aqi": ["mean", "min", "max"],
            "temperature": "mean",
            "wind_speed": "mean",
            "relative_humidity": "mean",
            "precipitation": "sum"
        }).reset_index()

        daily_records = []
        for _, row in daily.iterrows():
            daily_records.append({
                "date": row["date"].values[0] if hasattr(row["date"], "values") else str(row["date"]),
                "pm2_5": round(float(row["pm2_5"]["mean"]), 1) if not pd.isna(row["pm2_5"]["mean"]) else None,
                "pm2_5_min": round(float(row["pm2_5"]["min"]), 1) if not pd.isna(row["pm2_5"]["min"]) else None,
                "pm2_5_max": round(float(row["pm2_5"]["max"]), 1) if not pd.isna(row["pm2_5"]["max"]) else None,
                "pm10": round(float(row["pm10"]["mean"]), 1) if not pd.isna(row["pm10"]["mean"]) else None,
                "aqi": round(float(row["aqi"]["mean"]), 1) if not pd.isna(row["aqi"]["mean"]) else None,
                "temperature": round(float(row["temperature"]["mean"]), 1) if not pd.isna(row["temperature"]["mean"]) else None,
                "wind_speed": round(float(row["wind_speed"]["mean"]), 1) if not pd.isna(row["wind_speed"]["mean"]) else None,
                "relative_humidity": round(float(row["relative_humidity"]["mean"]), 1) if not pd.isna(row["relative_humidity"]["mean"]) else None,
                "precipitation": round(float(row["precipitation"]["sum"]), 1) if not pd.isna(row["precipitation"]["sum"]) else 0.0,
            })
        return {
            "aggregate": "daily",
            "period_days": past_days,
            "count": len(daily_records),
            "records": daily_records
        }

    # Hourly (limit to past_days)
    hourly_records = []
    for r in records[-min(len(records), past_days * 24):]:
        hourly_records.append({
            "timestamp": r["timestamp"],
            "display_time": r["timestamp"].replace("T", " "),
            "pm2_5": round(r["pm2_5"], 1) if r.get("pm2_5") is not None else None,
            "pm10": round(r["pm10"], 1) if r.get("pm10") is not None else None,
            "aqi": round(r["aqi"], 1) if r.get("aqi") is not None else None,
            "no2": round(r["no2"], 1) if r.get("no2") is not None else None,
            "so2": round(r["so2"], 1) if r.get("so2") is not None else None,
            "co": round(r["co"], 1) if r.get("co") is not None else None,
            "ozone": round(r["ozone"], 1) if r.get("ozone") is not None else None,
            "temperature": round(r["temperature"], 1) if r.get("temperature") is not None else None,
            "relative_humidity": round(r["relative_humidity"], 1) if r.get("relative_humidity") is not None else None,
            "wind_speed": round(r["wind_speed"], 1) if r.get("wind_speed") is not None else None,
            "precipitation": round(r["precipitation"], 1) if r.get("precipitation") is not None else 0.0,
        })

    return {
        "aggregate": "hourly",
        "period_days": past_days,
        "count": len(hourly_records),
        "records": hourly_records
    }
