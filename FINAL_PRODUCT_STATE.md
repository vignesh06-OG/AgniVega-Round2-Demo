# FINAL PRODUCT STATE

This document outlines the final technical and operational state of the AgniVega Smart Kopargaon prototype after the Hardening & QA phase.

## 1. What is Real?
- **Core AI Calculation Engine**: The `calculateOptions` and `itemiseEarnings` mathematical models that balance freight cost, spoilage risk, and gross payouts to determine Expected Net Realization (ENR) are running real mathematics, not static mock values.
- **Routing & Role Separation**: TanStack Router rigorously enforces role isolation via `beforeLoad`.
- **Booking Engine & State Machine**: The 30-minute lock window correctly executes lifecycle transitions (`DRAFT` → `HOLD` → `CONFIRMED` / `EXPIRED`). Vehicle capacity is strictly monitored and decremented.

## 2. What is Simulated? (Demo Specific)
- **Market Price Data**: Uses `canonical-demo.ts` instead of live Agmarknet API scraping for stability during the hackathon.
- **Image Quality Analysis**: Simulates an AI confidence score based on dummy data. The UI explicitly labels this as "AI Estimate" for honesty.
- **Live GPS Tracking**: Real-time vehicle coordinates are interpolated.
- **Payment Gateway**: `PaymentModal` abstracts a real payment execution (like Razorpay) and purely processes the state transition.
- **Database**: Bookings and capacities are held in an in-memory Node/Vite store (`booking.server.ts`). **Do not restart the server during the demo, or active bookings will reset.**

## 3. Core Architecture
- **Framework**: TanStack Start / React 19 / TypeScript
- **Styling**: TailwindCSS + ShadCN UI
- **Routing**: File-based TanStack Router

## 4. Required Environment Variables
The current setup operates in full "demo isolation" mode and requires NO external API keys to demonstrate the core logic. To connect to production services later, you will need:
- `VITE_MAPBOX_TOKEN` (For actual routing)
- `DATABASE_URL` (For Supabase/PostgreSQL)
- `RAZORPAY_KEY_ID` (For live transactions)

## 5. Known Limitations
- Server restarts clear active booking states and vehicle loads.
- If farmers try to book simultaneously (within the exact same millisecond), the in-memory array might experience a race condition without a proper SQL transaction lock.

**The platform is fully ready for a live presentation.**
