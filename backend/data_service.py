"""
Data Service for Aeris 3D - Bangalore Environmental Intelligence
Fetches, validates, and caches real-time and historical air quality and weather data
from Open-Meteo, CPCB via WAQI search, and historical archives.
"""

import time
import json
import logging
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
import pytz

logger = logging.getLogger("aeris.data")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

BANGALORE_COORDS = {"latitude": 12.9716, "longitude": 77.5946}
TIMEZONE = "Asia/Kolkata"
IST = pytz.timezone(TIMEZONE)

# Verified CPCB monitoring stations in Bangalore with known official locations
VERIFIED_STATIONS = [
    {
        "id": "silk-board",
        "name": "Silk Board, Bengaluru",
        "short_name": "Silk Board",
        "latitude": 12.917348,
        "longitude": 77.622813,
        "type": "Traffic Hotspot / Heavy Congestion Corridor",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "South-East Bangalore",
        "elevation_m": 898
    },
    {
        "id": "jayanagar",
        "name": "Jayanagar 5th Block, Bengaluru",
        "short_name": "Jayanagar",
        "latitude": 12.920984,
        "longitude": 77.584908,
        "type": "Commercial & Residential Zone",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "South Bangalore",
        "elevation_m": 920
    },
    {
        "id": "btm-layout",
        "name": "BTM Layout, Bangalore",
        "short_name": "BTM Layout",
        "latitude": 12.9135218,
        "longitude": 77.5950804,
        "type": "Dense Residential / Commercial",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "South Bangalore",
        "elevation_m": 910
    },
    {
        "id": "hebbal",
        "name": "Hebbal, Bengaluru",
        "short_name": "Hebbal",
        "latitude": 13.029152,
        "longitude": 77.585901,
        "type": "Transit Arterial / Airport Corridor",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "North Bangalore",
        "elevation_m": 915
    },
    {
        "id": "peenya",
        "name": "Peenya Industrial Area, Bangalore",
        "short_name": "Peenya",
        "latitude": 13.0270199,
        "longitude": 77.494094,
        "type": "Major Industrial Manufacturing Hub",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "North-West Bangalore",
        "elevation_m": 940
    },
    {
        "id": "hombegowda",
        "name": "Hombegowda Nagar, Bengaluru",
        "short_name": "Hombegowda Nagar",
        "latitude": 12.938539,
        "longitude": 77.5901,
        "type": "Urban Mixed Residential",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "Central South Bangalore",
        "elevation_m": 905
    },
    {
        "id": "bapuji-nagar",
        "name": "Bapuji Nagar, Bengaluru",
        "short_name": "Bapuji Nagar",
        "latitude": 12.951913,
        "longitude": 77.539784,
        "type": "Dense Residential & Transit",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "West Bangalore",
        "elevation_m": 880
    },
    {
        "id": "saneguravahalli",
        "name": "SaneguravaHalli, Bangalore",
        "short_name": "Saneguravahalli",
        "latitude": 12.990328,
        "longitude": 77.5431385,
        "type": "Residential Neighborhood",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "West-Central Bangalore",
        "elevation_m": 930
    },
    {
        "id": "city-railway-station",
        "name": "City Railway Station (KSR Majestic), Bangalore",
        "short_name": "City Railway Station",
        "latitude": 12.9756843,
        "longitude": 77.5660749,
        "type": "Central Transit Terminal & Rail Hub",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "Central Bangalore",
        "elevation_m": 915
    },
    {
        "id": "bwssb-kadabesanahalli",
        "name": "BWSSB Kadabesanahalli (Outer Ring Road)",
        "short_name": "Kadabesanahalli (ORR)",
        "latitude": 12.9352049,
        "longitude": 77.6814488,
        "type": "Tech Corridor & Outer Ring Road",
        "source": "CPCB / KSPCB Ground Monitor",
        "zone": "East Bangalore (IT Corridor)",
        "elevation_m": 885
    }
]

# Cache container with TTL
_cache = {
    "live_dashboard": {"data": None, "timestamp": 0, "ttl": 300},  # 5 minutes
    "stations": {"data": None, "timestamp": 0, "ttl": 300},
    "historical": {"data": None, "timestamp": 0, "ttl": 1800},     # 30 minutes
}

def get_cpcb_category(aqi_val: Optional[float]) -> Dict[str, str]:
    """Returns official Indian CPCB National Air Quality Index category, color, and health implication."""
    if aqi_val is None or aqi_val < 0:
        return {
            "category": "Unavailable",
            "color": "#6B7280",
            "description": "Insufficient continuous monitoring data available.",
            "severity_level": 0
        }
    if aqi_val <= 50:
        return {
            "category": "Good",
            "color": "#10B981", # green
            "description": "Minimal impact. Clean air ideal for all outdoor activities.",
            "severity_level": 1
        }
    elif aqi_val <= 100:
        return {
            "category": "Satisfactory",
            "color": "#84CC16", # light green/lime
            "description": "Minor breathing discomfort to sensitive individuals.",
            "severity_level": 2
        }
    elif aqi_val <= 200:
        return {
            "category": "Moderate",
            "color": "#FBBF24", # yellow/amber
            "description": "Breathing discomfort to people with lungs, asthma and heart diseases.",
            "severity_level": 3
        }
    elif aqi_val <= 300:
        return {
            "category": "Poor",
            "color": "#F97316", # orange
            "description": "Breathing discomfort to most people on prolonged outdoor exposure.",
            "severity_level": 4
        }
    elif aqi_val <= 400:
        return {
            "category": "Very Poor",
            "color": "#EF4444", # red
            "description": "Respiratory illness on prolonged exposure. Significant risk for elders and children.",
            "severity_level": 5
        }
    else:
        return {
            "category": "Severe",
            "color": "#991B1B", # dark maroon
            "description": "Affects healthy people and seriously impacts those with existing diseases.",
            "severity_level": 6
        }


def fetch_live_weather(lat: float = BANGALORE_COORDS["latitude"], lon: float = BANGALORE_COORDS["longitude"]) -> Dict[str, Any]:
    """Fetches real weather from Open-Meteo Weather API."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,"
        f"wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover&"
        f"timezone=Asia/Kolkata"
    )
    headers = {"User-Agent": "Aeris3D-BangaloreIntelligence/1.0"}
    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    curr = data.get("current", {})
    return {
        "temperature": curr.get("temperature_2m"),
        "apparent_temperature": curr.get("apparent_temperature"),
        "relative_humidity": curr.get("relative_humidity_2m"),
        "precipitation": curr.get("precipitation"),
        "rain": curr.get("rain"),
        "wind_speed": curr.get("wind_speed_10m"),
        "wind_direction": curr.get("wind_direction_10m"),
        "wind_gusts": curr.get("wind_gusts_10m"),
        "surface_pressure": curr.get("surface_pressure"),
        "cloud_cover": curr.get("cloud_cover"),
        "timestamp": curr.get("time"),
        "source": "Open-Meteo High-Resolution Weather Model (ECMWF/GFS)"
    }


def fetch_live_air_quality(lat: float = BANGALORE_COORDS["latitude"], lon: float = BANGALORE_COORDS["longitude"]) -> Dict[str, Any]:
    """Fetches real atmospheric air quality from Open-Meteo Air Quality API."""
    url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&"
        f"current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi&"
        f"timezone=Asia/Kolkata"
    )
    headers = {"User-Agent": "Aeris3D-BangaloreIntelligence/1.0"}
    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    curr = data.get("current", {})
    return {
        "pm2_5": curr.get("pm2_5"),
        "pm10": curr.get("pm10"),
        "co": curr.get("carbon_monoxide"),
        "no2": curr.get("nitrogen_dioxide"),
        "so2": curr.get("sulphur_dioxide"),
        "ozone": curr.get("ozone"),
        "us_aqi": curr.get("us_aqi"),
        "european_aqi": curr.get("european_aqi"),
        "timestamp": curr.get("time"),
        "source": "Open-Meteo CAMS Atmospheric Model (Copernicus Atmosphere Service)"
    }


def fetch_cpcb_stations_data() -> List[Dict[str, Any]]:
    """
    Fetches real ground observations from CPCB stations in Bangalore via the live public monitoring feed,
    matched with verified station coordinates and cross-referenced with local Open-Meteo atmospheric estimates.
    """
    # 1. Fetch live ground readings from WAQI public search feed for Bengaluru
    live_ground_map = {}
    try:
        waqi_url = "https://api.waqi.info/search/?token=demo&keyword=bengaluru"
        resp = requests.get(waqi_url, headers={"User-Agent": "Aeris3D-Bangalore/1.0"}, timeout=10)
        if resp.status_code == 200:
            res_data = resp.json()
            if res_data.get("status") == "ok":
                for item in res_data.get("data", []):
                    st_name = item.get("station", {}).get("name", "").lower()
                    raw_aqi = item.get("aqi")
                    obs_time = item.get("time", {}).get("stime")
                    try:
                        aqi_val = float(raw_aqi) if raw_aqi not in ("-", None, "") else None
                    except (ValueError, TypeError):
                        aqi_val = None
                    live_ground_map[st_name] = {
                        "aqi": aqi_val,
                        "time": obs_time,
                        "raw_name": item.get("station", {}).get("name"),
                        "geo": item.get("station", {}).get("geo")
                    }
    except Exception as e:
        logger.warning(f"Error fetching WAQI Bangalore ground feed: {e}")

    stations_output = []

    # 2. Iterate verified stations and enrich (concurrently fetch localized model grid)
    from concurrent.futures import ThreadPoolExecutor

    def enrich_station(v):
        st_id = v["id"]
        st_short = v["short_name"].lower()

        # Match with ground reading
        ground_match = None
        for k, gdata in live_ground_map.items():
            if st_short in k or (st_id == "city-railway-station" and "railway" in k) or (st_id == "bwssb-kadabesanahalli" and "bwssb" in k):
                ground_match = gdata
                break

        ground_aqi = ground_match["aqi"] if ground_match else None
        ground_time = ground_match["time"] if ground_match else None
        
        # Check if ground observation is valid or stale
        is_ground_valid = ground_aqi is not None and ground_aqi > 0

        # Fetch localized atmospheric pollutant estimate for station coordinates from Open-Meteo
        model_pollutants = {}
        try:
            m_aq = fetch_live_air_quality(lat=v["latitude"], lon=v["longitude"])
            model_pollutants = m_aq
        except Exception as e:
            logger.debug(f"Could not fetch localized grid for station {st_id}: {e}")

        # Determine effective AQI:
        # CPCB ground observation is preferred for official station ranking if valid;
        # Model CAMS estimate is separately provided for pollutant breakdown.
        effective_aqi = ground_aqi if is_ground_valid else model_pollutants.get("us_aqi")
        effective_source = "CPCB Ground Sensor (CAAQMS)" if is_ground_valid else "Open-Meteo CAMS Model Grid"
        data_type = "Ground Observation" if is_ground_valid else "Atmospheric Model"

        cat_info = get_cpcb_category(effective_aqi)

        return {
            "id": v["id"],
            "name": v["name"],
            "short_name": v["short_name"],
            "latitude": v["latitude"],
            "longitude": v["longitude"],
            "elevation_m": v["elevation_m"],
            "zone": v["zone"],
            "station_type": v["type"],
            "aqi": effective_aqi,
            "cpcb_ground_aqi": ground_aqi,
            "cpcb_observation_time": ground_time,
            "category": cat_info["category"],
            "color": cat_info["color"],
            "severity_level": cat_info["severity_level"],
            "description": cat_info["description"],
            "pm2_5": model_pollutants.get("pm2_5"),
            "pm10": model_pollutants.get("pm10"),
            "no2": model_pollutants.get("no2"),
            "so2": model_pollutants.get("so2"),
            "co": model_pollutants.get("co"),
            "ozone": model_pollutants.get("ozone"),
            "effective_source": effective_source,
            "data_type": data_type,
            "is_ground_monitoring_active": is_ground_valid,
            "last_updated": ground_time if (is_ground_valid and ground_time) else datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")
        }

    with ThreadPoolExecutor(max_workers=5) as executor:
        stations_output = list(executor.map(enrich_station, VERIFIED_STATIONS))

    return stations_output


def get_cached_dashboard_data() -> Dict[str, Any]:
    """Retrieves or refreshes cached live dashboard and city-wide overview."""
    now = time.time()
    if _cache["live_dashboard"]["data"] and (now - _cache["live_dashboard"]["timestamp"] < _cache["live_dashboard"]["ttl"]):
        return _cache["live_dashboard"]["data"]

    logger.info("Refreshing live dashboard cache from real APIs...")
    try:
        weather = fetch_live_weather()
        air_quality = fetch_live_air_quality()
        stations = fetch_cpcb_stations_data()

        # Compute city aggregated statistics from valid ground stations and model
        valid_station_aqis = [s["aqi"] for s in stations if s["aqi"] is not None and s["aqi"] > 0]
        avg_aqi = round(sum(valid_station_aqis) / len(valid_station_aqis), 1) if valid_station_aqis else air_quality.get("us_aqi")
        max_station = max([s for s in stations if s["aqi"] is not None], key=lambda x: x["aqi"], default=None)
        min_station = min([s for s in stations if s["aqi"] is not None and s["aqi"] > 0], key=lambda x: x["aqi"], default=None)

        city_cat = get_cpcb_category(avg_aqi)

        dashboard_data = {
            "city": "Bangalore (Bengaluru)",
            "state": "Karnataka",
            "country": "India",
            "coordinates": BANGALORE_COORDS,
            "timezone": TIMEZONE,
            "last_updated": datetime.now(IST).isoformat(),
            "last_updated_human": datetime.now(IST).strftime("%d %b %Y, %I:%M %p IST"),
            "overall_aqi": avg_aqi,
            "cpcb_category": city_cat["category"],
            "cpcb_color": city_cat["color"],
            "cpcb_severity_level": city_cat["severity_level"],
            "health_summary": city_cat["description"],
            "dominant_pollutant": "PM2.5" if (air_quality.get("pm2_5", 0) or 0) > 25 else "PM10",
            "pollutants": {
                "pm2_5": {"value": air_quality.get("pm2_5"), "unit": "µg/m³", "label": "Particulate Matter 2.5"},
                "pm10": {"value": air_quality.get("pm10"), "unit": "µg/m³", "label": "Particulate Matter 10"},
                "no2": {"value": air_quality.get("no2"), "unit": "µg/m³", "label": "Nitrogen Dioxide"},
                "so2": {"value": air_quality.get("so2"), "unit": "µg/m³", "label": "Sulphur Dioxide"},
                "co": {"value": air_quality.get("co"), "unit": "µg/m³", "label": "Carbon Monoxide"},
                "ozone": {"value": air_quality.get("ozone"), "unit": "µg/m³", "label": "Ground-Level Ozone"}
            },
            "weather": {
                "temperature": {"value": weather.get("temperature"), "unit": "°C"},
                "apparent_temperature": {"value": weather.get("apparent_temperature"), "unit": "°C"},
                "relative_humidity": {"value": weather.get("relative_humidity"), "unit": "%"},
                "wind_speed": {"value": weather.get("wind_speed"), "unit": "km/h"},
                "wind_direction": {"value": weather.get("wind_direction"), "unit": "°"},
                "precipitation": {"value": weather.get("precipitation"), "unit": "mm"},
                "surface_pressure": {"value": weather.get("surface_pressure"), "unit": "hPa"},
                "cloud_cover": {"value": weather.get("cloud_cover"), "unit": "%"}
            },
            "hotspot_station": max_station,
            "cleanest_station": min_station,
            "total_stations_monitored": len(stations),
            "active_ground_stations": len([s for s in stations if s["is_ground_monitoring_active"]]),
            "sources": {
                "ground_monitoring": "Central Pollution Control Board (CPCB) / KSPCB via CAAQMS Network",
                "atmospheric_model": "Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo",
                "weather_model": "European Centre for Medium-Range Weather Forecasts (ECMWF) / Open-Meteo"
            }
        }

        _cache["live_dashboard"]["data"] = dashboard_data
        _cache["live_dashboard"]["timestamp"] = now
        _cache["stations"]["data"] = stations
        _cache["stations"]["timestamp"] = now

        return dashboard_data
    except Exception as e:
        logger.error(f"Error refreshing live dashboard: {e}")
        if _cache["live_dashboard"]["data"]:
            stale_data = dict(_cache["live_dashboard"]["data"])
            stale_data["is_stale"] = True
            stale_data["stale_reason"] = str(e)
            return stale_data
        raise


def get_cached_stations() -> List[Dict[str, Any]]:
    """Retrieves cached station list or updates it."""
    now = time.time()
    if _cache["stations"]["data"] and (now - _cache["stations"]["timestamp"] < _cache["stations"]["ttl"]):
        return _cache["stations"]["data"]
    get_cached_dashboard_data()
    return _cache["stations"]["data"] or fetch_cpcb_stations_data()


def fetch_historical_dataset(past_days: int = 30) -> Dict[str, Any]:
    """
    Fetches real continuous hourly historical data for Bangalore:
    - Air Quality: PM2.5, PM10, CO, NO2, SO2, O3, US AQI
    - Weather: Temperature, Relative Humidity, Wind Speed, Wind Direction, Surface Pressure, Precipitation
    Returns aligned chronological dataset suitable for pandas processing and ML.
    """
    now = time.time()
    cache_key = f"hist_{past_days}"
    if _cache["historical"].get(cache_key) and (now - _cache["historical"][cache_key]["timestamp"] < _cache["historical"]["ttl"]):
        return _cache["historical"][cache_key]["data"]

    logger.info(f"Fetching real historical dataset for Bangalore (past {past_days} days)...")
    
    # 1. Open-Meteo Historical / Forecast Air Quality
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={BANGALORE_COORDS['latitude']}&longitude={BANGALORE_COORDS['longitude']}&"
        f"hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&"
        f"past_days={past_days}&forecast_days=2&timezone=Asia/Kolkata"
    )
    # 2. Open-Meteo Historical / Forecast Weather
    weather_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={BANGALORE_COORDS['latitude']}&longitude={BANGALORE_COORDS['longitude']}&"
        f"hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,surface_pressure&"
        f"past_days={past_days}&forecast_days=2&timezone=Asia/Kolkata"
    )

    headers = {"User-Agent": "Aeris3D-BangaloreIntelligence/1.0"}
    aq_resp = requests.get(aq_url, headers=headers, timeout=20)
    aq_resp.raise_for_status()
    aq_data = aq_resp.json().get("hourly", {})

    weather_resp = requests.get(weather_url, headers=headers, timeout=20)
    weather_resp.raise_for_status()
    weather_data = weather_resp.json().get("hourly", {})

    times = aq_data.get("time", [])
    records = []

    pm25_list = aq_data.get("pm2_5", [])
    pm10_list = aq_data.get("pm10", [])
    aqi_list = aq_data.get("us_aqi", [])
    no2_list = aq_data.get("nitrogen_dioxide", [])
    so2_list = aq_data.get("sulphur_dioxide", [])
    co_list = aq_data.get("carbon_monoxide", [])
    o3_list = aq_data.get("ozone", [])

    w_times = weather_data.get("time", [])
    w_time_idx = {t: idx for idx, t in enumerate(w_times)}

    temp_list = weather_data.get("temperature_2m", [])
    rh_list = weather_data.get("relative_humidity_2m", [])
    wind_list = weather_data.get("wind_speed_10m", [])
    wind_dir_list = weather_data.get("wind_direction_10m", [])
    press_list = weather_data.get("surface_pressure", [])
    precip_list = weather_data.get("precipitation", [])

    for i, t_str in enumerate(times):
        pm25 = pm25_list[i] if i < len(pm25_list) else None
        pm10 = pm10_list[i] if i < len(pm10_list) else None
        aqi = aqi_list[i] if i < len(aqi_list) else None

        w_idx = w_time_idx.get(t_str)
        temp = temp_list[w_idx] if w_idx is not None and w_idx < len(temp_list) else None
        rh = rh_list[w_idx] if w_idx is not None and w_idx < len(rh_list) else None
        wind = wind_list[w_idx] if w_idx is not None and w_idx < len(wind_list) else None
        wind_dir = wind_dir_list[w_idx] if w_idx is not None and w_idx < len(wind_dir_list) else None
        press = press_list[w_idx] if w_idx is not None and w_idx < len(press_list) else None
        precip = precip_list[w_idx] if w_idx is not None and w_idx < len(precip_list) else 0.0

        records.append({
            "timestamp": t_str,
            "pm2_5": pm25,
            "pm10": pm10,
            "aqi": aqi,
            "no2": no2_list[i] if i < len(no2_list) else None,
            "so2": so2_list[i] if i < len(so2_list) else None,
            "co": co_list[i] if i < len(co_list) else None,
            "ozone": o3_list[i] if i < len(o3_list) else None,
            "temperature": temp,
            "relative_humidity": rh,
            "wind_speed": wind,
            "wind_direction": wind_dir,
            "surface_pressure": press,
            "precipitation": precip
        })

    result = {
        "city": "Bangalore",
        "past_days": past_days,
        "record_count": len(records),
        "start_time": records[0]["timestamp"] if records else None,
        "end_time": records[-1]["timestamp"] if records else None,
        "records": records
    }

    _cache["historical"][cache_key] = {"data": result, "timestamp": now}
    return result
