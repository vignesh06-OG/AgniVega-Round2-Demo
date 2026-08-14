# FINAL ROUND 2 HARDENING AUDIT

## CRITICAL 🔴
- **Capacity Overbooking (booking.server.ts)**: Currently, `booking.server.ts` blindly accepts bookings without actually checking if the requested capacity exceeds the remaining vehicle capacity. A vehicle's capacity can be overbooked if two farmers book simultaneously.
- **Hardcoded Capacity Visuals (farmer.tsx)**: The UI hardcodes "2,500 kg" for vehicle capacity instead of surfacing the dynamically calculated `vehicle.payloadKg` from the backend pool logic.
- **AI Override Transparency (farmer.tsx)**: The farmer is allowed to select an alternative market, but the system does not display an explicit override warning confirming their deviation from the AI-recommended highest ENR.

## HIGH 🟠
- **Image Analysis Honesty**: The image analysis modal needs a clear "AI-assisted estimate" label to prevent users from thinking it's a real laboratory grade assessment.
- **Bilingual Flow Quality**: While parts of the app are translated, some technical jargon like "Vehicle Allocation & Pooling" needs a more farmer-friendly localized version.
- **Missing Loading States**: Submitting a booking or recalculating markets needs better spinner states to prevent users from thinking the app froze.

## MEDIUM 🟡
- **Data Honesty Badges**: Simulated data (like market prices and live telemetry tracking) needs visible "DEMO DATA" or "LIVE" badges so judges aren't misled.
- **Vehicle Selection Lock**: If a user hits "Back" to edit quantity after holding a booking, the hold should be visibly cancelled or properly managed to prevent stale locks.
- **E2E Testing**: Missing automated tests for the full farmer workflow, specifically around capacity blocking and timeouts.

## LOW 🟢
- **Payment Success Handling**: Need to ensure the payment success doesn't just show a toast but guarantees the UI updates to CONFIRMED.
- **Mobile Responsiveness**: Verify no overflow on the multi-market comparison cards.
