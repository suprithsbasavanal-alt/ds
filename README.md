# AERIS 3D — Bangalore Air Quality & Weather Intelligence

A complete, high-resolution environmental intelligence platform providing real-time air quality, meteorological telemetry, 3D geospatial cartography, machine-learning short-term AQI forecasting, explainable pollution driver analysis, and CPCB-aligned health advisories for Bangalore, Karnataka, India.

---

## 🚀 Key Features

1. **Live Air Quality & Weather Intelligence Command Center**:
   - City-wide National AQI (NAQI) on official Indian CPCB scale (0–500).
   - High-resolution real-time pollutants: PM2.5, PM10, NO2, SO2, CO, O3.
   - Comprehensive weather telemetry: Temperature, Relative Humidity, Apparent Temperature, Wind Speed, Wind Direction, Surface Pressure, Precipitation.
   - Automatically refreshing live data mechanism (5-minute countdown + on-demand refresh).

2. **Interactive 3D Bangalore Map**:
   - MapLibre GL 3D vector cartography with 55°–60° perspective pitch and smooth rotation.
   - Verified Central Pollution Control Board (CPCB) monitoring stations (Silk Board, Jayanagar, Hebbal, BTM Layout, Peenya, Hombegowda Nagar, Bapuji Nagar, Saneguravanahalli, KSR Majestic Railway Station, Kadabesanahalli ORR).
   - Real ground readings mapped strictly to verified coordinates.
   - Interactive station selection, 3D pulsing beacons, translucent AQI dispersion halos, camera fly-to animation, and detailed microclimate inspection drawer.

3. **Area-Wise Pollution Rankings**:
   - Live ranked leaderboard of Bangalore monitoring stations.
   - Filter by severity category, sort by AQI / PM2.5 / Station Name, and search by neighborhood.
   - Transparent attribution distinguishing official ground monitoring from atmospheric model grid.
   - Honest reporting of offline / recalibrating stations.

4. **Historical Analytics & Meteorological Correlations**:
   - Interactive multi-variable time-series charts (PM2.5, PM10, AQI, Temp, Wind, Rain) with 24h, 7d, 30d, and 90d ranges.
   - Daily and hourly aggregation views.
   - Statistical Pearson correlation matrix ($r$) and scatter plots (Temperature vs PM2.5, Wind Speed vs PM2.5, Humidity vs PM2.5).
   - 24-Hour Diurnal Cycle analysis revealing morning and evening boundary-layer pollution surges.
   - Scientific disclaimer: statistical correlation does not establish causality.

5. **Real Machine Learning Short-Term Prediction Engine**:
   - Genuine Scikit-Learn `HistGradientBoostingRegressor` and `RandomForestRegressor` models trained on Bangalore's real continuous hourly history.
   - Strict chronological train/test split (80% train, 20% test holdout) with zero forward lookahead leakage.
   - Features: Multi-step lag AQI (t-1, t-2, t-3, t-6), lag PM2.5/PM10, diurnal sine/cosine cyclical time, day-of-week, ECMWF forecasted weather features, and atmospheric stagnation index.
   - Rigorous evaluation metrics: MAE, RMSE, $R^2$, and comparison against a Naive Persistence Baseline.
   - 1–6 hour ahead forward AQI predictions with 95% confidence uncertainty ribbons.
   - Feature importance rankings and on-demand model retraining endpoint.

6. **Explainable AI Pollution-Driver Intelligence**:
   - Structured diagnostic analysis explicitly separating:
     1. Measured Physical Facts (empirical ground truth).
     2. Statistical Associations (co-variation and diurnal patterns).
     3. Model Predictions & Physics (boundary layer dynamics).
     4. Urban Source Apportionment Hypotheses (vehicular transit corridors, road silt resuspension, construction aggregate).
   - Avoids unsubstantiated legal culpability claims without chemical speciation evidence.

7. **CPCB Health Advisories & Demographic Precautions**:
   - Cohort-specific health recommendations: General Population, Children, Older Adults, Respiratory (Asthma/COPD), Cardiovascular, and Outdoor Workers.
   - Certified mask guidance (N95/FFP2), indoor ventilation guidance, exercise precautions, and clinical emergency danger signs.
   - Explicit general health advisory disclaimer.

8. **Solutions Action Center**:
   - Concrete, evidence-grounded mitigation roadmaps for:
     - Individuals (Namma Metro adoption, anti-open burning, EV transition, indoor air filtering).
     - Communities & RWAs (Green buffers along ring roads, open-burning reporting via BBMP Sahaya, shared transit).
     - Municipal & Urban Planners (Intelligent signaling at Silk Board/Majestic chokepoints, mechanized night-time wet sweeping, construction dust netting, CAAQMS expansion).

---

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, MapLibre GL JS.
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, Requests, PyTZ.
- **Real Data Sources**:
  - Central Pollution Control Board (CPCB) / Karnataka State Pollution Control Board (KSPCB) via CAAQMS telemetry.
  - Open-Meteo High-Resolution Weather API (ECMWF 9km / GFS).
  - Open-Meteo Air Quality API (Copernicus Atmosphere Monitoring Service - CAMS).

---

## 🏃 Running the Application

### Option A: Unified Server (FastAPI serves both API and built Frontend)
```bash
# 1. Activate Python virtual environment
source venv/bin/activate

# 2. Start FastAPI Server
./venv/bin/uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000`** in your browser.

### Option B: Vite Dev Server (Frontend hot-reloading)
```bash
# Terminal 1: Backend
./venv/bin/uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📡 REST API Endpoints

- `GET /api/health` — System status, providers, server time (Asia/Kolkata).
- `GET /api/dashboard` — Live Bangalore AQI, category, pollutants, weather, hotspot.
- `GET /api/stations` — 10 verified Bangalore CAAQMS monitoring stations with real coordinates and readings.
- `GET /api/rankings` — Ranked station leaderboard with sorting and filtering.
- `GET /api/analytics/timeseries?past_days=7&aggregate=hourly` — Historical continuous time-series.
- `GET /api/analytics/correlations?past_days=30` — Pearson correlation coefficients and scatter plot points.
- `GET /api/analytics/diurnal?past_days=30` — 24-hour diurnal cycle aggregations.
- `GET /api/ml/predict?hours=6` — 1 to 6 hour AQI forecast with confidence bounds.
- `GET /api/ml/metadata` — Model training status, MAE, RMSE, $R^2$, and feature importance.
- `POST /api/ml/retrain?past_days=30` — Trigger model retraining on chronological holdout data.
- `GET /api/intelligence/drivers` — Explainable 4-pillar AI pollution driver analysis.
- `GET /api/health-advisory` — CPCB health guidelines and vulnerable cohort precautions.
- `GET /api/solutions` — Multi-tier actionable pollution mitigation roadmaps.
