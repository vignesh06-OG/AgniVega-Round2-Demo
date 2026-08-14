# AgniVega Round 2 Final Product Audit

## Execution Summary
The `feature/agni-vega-round2-farmer-intelligence-booking` branch implements the requested 41 points for the Round 2 product upgrade.

### What Was Built
1. **Comprehensive Crop & Market Catalogue**: Expanded `mockCrops` to support 17 major crops across Maharashtra and expanded `mockMandis` to 8 major regional hubs.
2. **Bilingual Farmer UI Flow (Marathi-First)**: Complete translation of the entire booking, AI estimation, and pooling options comparison screens.
3. **AI Vision Flow Mock**: Integrated `AIUploadMock.tsx` for visual quality and moisture estimation simulation, representing integration points for a future Vision API.
4. **Interactive Quality Form**: Fully dynamic quality declaration (`QualityForm.tsx`).
5. **Farmer Override Engine**: Farmers are presented with the AI's best logistics choice, but they can select alternative markets and the system dynamically recalculates pooling shares and payloads for the chosen alternative destination.
6. **30-Minute Booking Lock & State Machine**: A 5-state (`DRAFT` → `ANALYZING` → `OPTIONS_READY` → `CONFIRMED_EDITABLE` → `LOCKED`) frontend flow has been implemented that transitions to locked after a 30-minute countdown.
7. **Support System**: Implemented ticketing to obfuscate direct driver contact.

### Verification Results
- **TypeScript**: `npx tsc --noEmit` passed.
- **Unit Tests**: `npm run test` passed (79 tests).
- **Linter**: Addressed type issues. 
- **Build**: Vite production build succeeded.

---

## Top 10 Remaining Risks & Production Gaps

1. **Client-Side Booking State**: The entire state machine for booking (and the 30-minute timer) lives in React context. If the farmer refreshes their browser, the booking is lost. 
   *Mitigation for Prod*: Must integrate Supabase tables (`bookings`, `booking_status_logs`) to persist state and drive the lock timer from `created_at`.
2. **Deterministic Demo Data Limits**: The pooling logic relies on predefined companion loads from `canonical-demo.ts`. If a farmer enters an exotic weight or village, they might not find pooling partners.
   *Mitigation for Prod*: Need real-time matching via PostGIS bounding boxes.
3. **Hardcoded Vehicle Database**: Vehicles and their toll/base costs are hardcoded.
   *Mitigation for Prod*: Integrate with live logistics databases (e.g., Vahan API or fleet operator dashboards).
4. **Hardcoded Fuel Prices**: Diesel is locked at 92.5/L.
   *Mitigation for Prod*: Fetch daily local prices.
5. **Simulated Agmarknet APIs**: Prices are generated dynamically by a variation formula in `mockPrices` rather than being fetched from the actual government API.
   *Mitigation for Prod*: Create a cron job backend that pulls the daily Agmarknet XML/JSON.
6. **Haversine Distance Instead of Roads**: The system uses straight-line distances.
   *Mitigation for Prod*: Connect to OSRM or Google Maps API for real route distances.
7. **Lack of Authentication**: The farmer flow has no login barrier.
   *Mitigation for Prod*: Hook up Supabase Auth (OTP via SMS).
8. **Spoilage Risk is Linear**: The spoilage calculation assumes simple linear decay based on hours.
   *Mitigation for Prod*: Integrate real-time weather APIs to adjust spoilage dynamically (e.g., higher heat = faster spoilage).
9. **Fake AI Estimations**: The computer vision quality check is purely a frontend mock timer.
   *Mitigation for Prod*: Hook up an actual YOLO model or Google Cloud Vision API endpoint.
10. **Scalability of Calculation Engine**: The current `calculateOptions` maps over *all* mandis. At scale (thousands of mandis), this will crash the client/server.
    *Mitigation for Prod*: Implement geospatial culling (e.g., only mandis within 300km) before mapping.
