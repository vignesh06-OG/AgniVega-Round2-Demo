# LIVE DATA REQUIREMENTS

This document details the real-world APIs and data sources required to turn the AgniVega logistics platform from a seeded-data prototype into a live operational system.

| SERVICE | PURPOSE | API/ENDPOINT | API KEY REQUIRED? | WHERE TO GET IT | ENV VARIABLE NAME | RATE LIMIT | FALLBACK | DATA FRESHNESS |
|---|---|---|---|---|---|---|---|---|
| **AGMARKNET / eNAM** | Daily mandi prices, arrivals, modal/min/max prices for commodities | `data.gov.in` Data API (e.g., "Current Daily Price of Various Commodities") or CEDA API | YES (for data.gov.in) | data.gov.in registration | `VITE_AGMARKNET_API_KEY` (if client) or `AGMARKNET_API_KEY` (server) | Varies (often 100-500 calls/day depending on tier) | Use cached/seeded `canonical-demo.ts` data | Daily |
| **OpenRouteService (ORS)** | Route optimization, distance matrix, and CVRP (multi-stop pooling) | `api.openrouteservice.org/v2/matrix/driving-hgv` | YES | openrouteservice.org | `ORS_API_KEY` | 500 requests/day (free tier) | Local OSRM or Haversine distance | Real-time |
| **Weather API** | Route weather, transit risk, and potential spoilage acceleration due to extreme heat/rain | OpenWeatherMap API (`api.openweathermap.org/data/2.5/weather`) | YES | openweathermap.org | `OPENWEATHER_API_KEY` | 1000 calls/day (free) | Assume "clear" weather | Real-time / Hourly |
| **Google Gemini Vision** | AI visual crop quality assessment from farmer-uploaded photos | `generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision` | YES | Google AI Studio | `GEMINI_API_KEY` | 60 QPM (free tier) | Manual quality declaration only | Real-time inference |
| **Supabase** | Backend state machine, user auth, live booking tracking, and pooling queues | `[project-id].supabase.co` | YES | supabase.com | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` | Tier-dependent | Offline cache via Workbox | Real-time |

### Notes on Implementation
- **NEVER** commit these keys into Git. They must reside in a `.env` file (for local development) or be securely injected via the hosting provider (e.g., Vercel/Netlify/Cloudflare secrets).
- **Graceful Degradation:** If a live API fails, the system must immediately fall back to the most recent cached data or the deterministic demo data, explicitly labeling the UI with "Data Status: UN-SYNCED / FALLBACK".
