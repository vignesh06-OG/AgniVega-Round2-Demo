# API SETUP GUIDE

This document explains how to set up the necessary APIs for the full AI and real-time data functionality of the AgniVega logistics platform.

## 1. Image AI Quality Assessment (Google Gemini Vision)

**API**: Google Gemini Pro Vision
**Purpose**: To analyze farmer-uploaded crop photos and output a structured visual quality estimate (surface condition, foreign material, visible damage) to act as a secondary verification against manually declared quality.
**Key Required?**: YES
**Environment Variable**: `GEMINI_API_KEY`
**How to obtain**: 
1. Go to Google AI Studio (https://aistudio.google.com/)
2. Sign in and click "Get API Key".
3. Create a key and copy it.
**Fallback behavior**: If the API key is missing or the call fails, the UI gracefully degrades, stating: "AI quality analysis unavailable. You can continue with manually declared quality." The farmer's manually entered quality remains authoritative.

## 2. Weather & Transit Risk (OpenWeatherMap)

**API**: OpenWeatherMap API
**Purpose**: To evaluate weather along the route and dynamically adjust the risk score (spoilage acceleration due to extreme heat/rain).
**Key Required?**: YES
**Environment Variable**: `OPENWEATHER_API_KEY`
**How to obtain**:
1. Go to OpenWeatherMap (https://openweathermap.org/api)
2. Sign up for a free account.
3. Generate an API key from the dashboard.
**Fallback behavior**: If the API is missing/unreachable, the system assumes normal/clear transit conditions and proceeds with baseline spoilage calculations.

## 3. Map & Routing API (OpenRouteService)

**API**: OpenRouteService (ORS)
**Purpose**: Multi-stop CVRP (Capacitated Vehicle Routing Problem) calculations for farmer pooling logic. Provides realistic ETA and accurate road distances for freight calculations.
**Key Required?**: YES
**Environment Variable**: `ORS_API_KEY`
**How to obtain**:
1. Go to OpenRouteService (https://openrouteservice.org/dev/#/signup)
2. Sign up and request a standard token.
**Fallback behavior**: The `routing.server.ts` engine is already built to degrade to a local OSRM endpoint (if running) or fallback to mathematically computed Haversine straight-line distance if ORS is unreachable.

## Local `.env` Setup
Create a `.env` file in the root directory (do not commit this file):

```env
GEMINI_API_KEY=your_key_here
OPENWEATHER_API_KEY=your_key_here
ORS_API_KEY=your_key_here
```

Ensure the server-side functions read from `process.env` securely and do not leak these keys to the client payload.
