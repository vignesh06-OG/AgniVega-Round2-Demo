# ROUND 2 PRODUCT DATA AUDIT

## Overview
This audit examines the current data structures, state handling, and API integration capabilities of the AgniVega Krishi-Yatra platform as of the Round 2 upgrade.

## Data Classification
1. **Genuinely Calculated**:
   - ENR (Expected Net Realization) logic including freight cost calculation, platform fee deduction, and spoilage risk subtraction.
   - Haversine distance computations.
   - Capacity utilization percentages based on assigned vehicle payload.
2. **Seeded Demo Data**:
   - `canonical-demo.ts` providing deterministic loads for pooled vehicle matching.
   - Mock market prices (`krishi.functions.ts`), simulating what would be fetched from Agmarknet API.
3. **Hardcoded**:
   - Default `mockCrops` and `mockMandis`.
   - Diesel prices and base vehicle costs.
4. **API-Backed (Opportunities)**:
   - Vision API for crop quality estimation (currently simulated via `AIUploadMock`).
   - Maps API (OSRM/ORS) for real road distances (currently haversine).
   - Live APMC/Agmarknet APIs for prices.
5. **Simulated**:
   - Booking lock countdown (runs in frontend state without backend persistence).
   - Payment settlement timelines.

## Current Functionality & Reusable Code
- **ENR Engine**: Robust, isolated mathematical logic in `fuel-engine.ts`. Highly reusable.
- **Pooling/Routing Engine**: Calculates shared loads via distance clusters.
- **Farmer Flow**: `farmer.tsx` implements a 3-step state machine with interactive components for quantity, quality, and comparison.
- **Explainability Card**: Excellent UI component for displaying trade-offs.

## Broken / Missing Flows
- **Crop Catalogue**: Only supported 3 crops initially; needs expansion to 16+ relevant Maharashtra crops.
- **Market Coverage**: Only supported 3-4 mandis; needs expansion.
- **Server-Side Booking**: The 30-minute lock window is entirely client-side. If the browser is refreshed, the state resets. 
- **Offline Fallback**: Needs proper local caching of the crop/market list for complete offline viability.

## Risks
1. **Frontend State Loss**: Without a backend booking table, the farmer could lose their "Locked" booking on a page refresh.
2. **Misrepresentation of Data**: Need to be very clear that AI Quality and Live Prices are simulated demo data, not production APIs.

## Next Steps
- Expand `krishi.functions.ts` to include the full Kopargaon relevant crop catalogue.
- Add additional market data to represent real logistics decisions.
