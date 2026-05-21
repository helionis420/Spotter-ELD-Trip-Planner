# Spotter ELD Trip Planner

Full-stack HOS-compliant trip planner with route mapping and DOT-standard ELD log generation.

## Stack
- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + Vite + Tailwind CSS + Leaflet (OpenStreetMap)
- **Routing/Geocoding**: OSRM (free, no API key) + Nominatim

## Features
- Geocodes any US address using OpenStreetMap Nominatim
- Calculates driving route via OSRM public routing API
- Full HOS calculation: 11-hr drive, 14-hr window, 30-min break, 10-hr rest, 70-hr/8-day cycle
- Fuel stops automatically inserted every 1,000 miles
- 1-hour pickup/dropoff on-duty time
- Interactive Leaflet map with route polyline
- Stop timeline with day grouping
- Canvas-rendered DOT 395.8 ELD log sheets (one per day, downloadable as PNG, printable)

## Local Development

### Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```
Backend runs at http://127.0.0.1:8000

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend runs at http://localhost:5173

## Deployment

### Single deployment → Vercel (frontend + backend together)

The `vercel.json` at the repo root handles everything in one deploy:
- React frontend is built and served statically
- Django backend runs as a Python serverless function at `/api/*`
- No CORS needed — same domain, no extra env vars required

```bash
npm i -g vercel       
vercel                 
```

That's it. Vercel auto-detects `vercel.json`, builds `frontend/`, and deploys `api/index.py` as a serverless function.

> **Optional env vars on Vercel dashboard:**
> - `SECRET_KEY` 
> - `DEBUG` — set to `False` 

### Alternative: Backend → Render.com + Frontend → Vercel (separate)
If you prefer a persistent server for the backend:
1. Render Web Service → root dir `backend/`, build: `pip install -r requirements.txt && python manage.py migrate --run-syncdb`, start: `gunicorn spotter.wsgi`
2. Vercel → root dir `frontend/`, add env var `VITE_API_URL=https://your-render-url.onrender.com`

## HOS Ruleset Applied
| Rule | Value |
|------|-------|
| Max driving per window | 11 hours |
| Duty window | 14 hours |
| Mandatory break after | 8 hours driving |
| Break duration | 30 minutes |
| Mandatory rest | 10 hours |
| Cycle limit | 70 hours / 8 days |
| Cycle restart | 34 hours off-duty |
| Fuel stop interval | Every 1,000 miles |
| Pickup/dropoff time | 1 hour each |
| Avg speed assumed | 55 mph |
