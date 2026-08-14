# AI Transparency & Product Honesty

To build trust during the hackathon evaluation, we believe in radical transparency regarding what is live, what is simulated, and how the AI interacts with the system.

## 1. AI Quality Analysis (Image Recognition)
- **Status**: Live with Fallback.
- **Implementation**: The application uses the Gemini Pro Vision API to assess crop quality from uploaded images.
- **Honesty Mechanism**: If the `.env` file does not contain a valid `GEMINI_API_KEY`, the application **does not** generate fake AI data to look impressive. Instead, it explicitly notifies the user ("AI requires API key") and gracefully falls back to a manual quality declaration form.

## 2. GPS Live Tracking & Maps
- **Status**: Simulated Telemetry on Live Maps.
- **Implementation**: The map tiles (Leaflet/Mapbox) are live and real. The GPS truck movement on the Admin Control Tower map is simulated using client-side linear interpolation between actual routing coordinates to demonstrate the UI behavior without requiring physical hardware for the demo.

## 3. Market Pricing Data
- **Status**: Seeded.
- **Implementation**: Real APMC APIs are frequently unstable or rate-limited. To guarantee reliability during presentation, the market prices are seeded with realistic data. The mathematical logic applying transport cost to these prices is 100% real and executed in real-time.

## 4. Payment Gateway
- **Status**: Simulated UI.
- **Implementation**: The payment modal separates logistics fees from crop value and mimics a real checkout flow (UPI/Wallet) for UX purposes, but does not execute actual financial transactions.
