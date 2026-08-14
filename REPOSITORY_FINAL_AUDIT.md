# Forensic Repository Inspection & Final Audit

**Date**: 2026-08-15
**Branch**: `round2-repository-final`

## A. Current Architecture
- **Framework**: React 19, TypeScript, Vite.
- **Routing & SSR**: TanStack Start & TanStack Router.
- **Styling**: Tailwind CSS v4, Radix UI primitives.
- **Persistence**: `localStorage` (via custom store logic) acts as the primary data store for the demo, avoiding complex database setups for the hackathon presentation while proving state management.
- **Geospatial**: React-Leaflet.

## B. Current Working Features
- **Farmer Booking Engine**: Complete flow from crop selection, quantity input, market analysis, vehicle allocation, to 30-minute booking hold and payment.
- **Multi-Vehicle Allocation Engine**: Mathematically splits large loads (e.g., 12,000 kg) across multiple vehicles respecting individual weight caps.
- **Market Comparison Logic**: Ranks mandis by "Expected Net Amount" (Value - Transport Fee).
- **Role Isolation**: Strict router-level `beforeLoad` guards preventing Farmers from seeing Driver/Fleet/Admin routes, and vice-versa.
- **Dashboard Interfaces**:
  - **Driver**: Active dispatch details, route distance, pickup points.
  - **Fleet**: Aggregated stats, vehicle capacity, simulated diagnostic modal.
  - **Admin**: Control Tower metrics, KYC queue, economics pricing config.

## C. Current Simulated Features (Truthful Boundaries)
- **Live GPS Tracking**: Real-time map animations are driven by client-side linear interpolation between route coordinates, labeled as "Simulated Fleet Telemetry."
- **Payments**: The checkout flow uses a mock UI that mimics UPI and Wallet behaviors but does not touch real payment gateways.
- **Mandi Pricing**: Driven by seeded demo data rather than live external APIs.
- **AI Image Analysis**: Has a UI for it, but will explicitly fallback to a manual form ("AI requires API key") if the Gemini API key is not present.

## D. Current Live Integrations
- **Maps**: Uses Leaflet for actual tile rendering.
- **Voice Transcription**: Has actual browser audio recording hooks intended for AI transcription (requires API key).

## E. Known Limitations
- No persistent backend database (Supabase is initialized in `supabase/` but the core demo relies on `localStorage` for ease of hackathon evaluation).
- No actual SMS/WhatsApp dispatch notifications.

## F. Broken/Dead Functionality
- *Resolved*: All critical flows were verified functional in the previous Red Team QA. There are no dead buttons blocking the golden path.
- *Acceptable Gaps*: Support ticket submission is locally persisted but doesn't trigger a real backend email. 

## G. Documentation Gaps
- The `README.md` is formatted like a pitch deck/hackathon submission rather than a serious software product.
- It contains generic "AI-powered" claims without technical depth.
- No central documentation explaining the multi-vehicle allocation math or the ENR formula.
- No `SECURITY.md` or `.env.example`.
- No visual evidence (screenshots) embedded systematically.

## H. README Gaps
- The current README uses "Expected Net Realization" and "ENR", which is internal jargon. The farmer UI uses "Expected Net Amount".
- Missing a clear "Golden Path" / Live Demo step-by-step guide.
- Missing a true feature matrix indicating exact status.

## I. Screenshot/Evidence Gaps
- The repository currently only has 3D rendered mockups (`architecture_3d.jpg`, `readme_banner_3d.jpg`) in `public/assets/`.
- It lacks actual application screenshots demonstrating the working UI. (These exist from the QA pass but need to be committed to `docs/screenshots/`).

## J. Security Concerns
- Strict role isolation is in place, but relies on client-side state. For a production app, this would require server-side session validation. This is acceptable for a hackathon demo but must be documented.
- No API keys were found exposed in the repository history.

## K. Deployment Concerns
- The app builds cleanly (`npm run build`) and generates Nitro output for edge deployment, but the README lacks clear instructions on how an evaluator should deploy or run the demo locally.
