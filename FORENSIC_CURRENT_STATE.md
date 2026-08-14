# AgniVega Round 2: Forensic Current State Report

This report documents the actual, current state of the `AgniVega-Round2-Demo` repository against the strict hackathon requirements. 

| Feature | Expected | Actual | Broken? | Root Cause | File(s) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Crop Catalogue** | 16+ crops, searchable, English/Marathi | Only 10 crops defined in icons, 6 in colors, missing full Marathi translation for all 16. | **YES** | Hardcoded partial list in `CropSelector.tsx`. | `CropSelector.tsx`, `canonical-demo.ts` |
| **Quality Input / Camera** | Take Photo invokes device camera, Upload opens file picker. | `<input type="file" capture="environment">` implemented. | **NO** | Fixed in previous pass. | `AIUploadMock.tsx` |
| **AI Quality Gate** | Cannot proceed to market comparison without photo. | User might be able to bypass if `farmer.tsx` doesn't strictly gate the next step. | **YES** | Missing strict validation gate in step transition. | `farmer.tsx` |
| **Market Terminology** | "Estimated Net Amount", no internal "ENR" jargon. | UI still uses "Estimated Net Realization". | **YES** | Incomplete terminology replacement. | `farmer.tsx`, `ENRHeroCard.tsx` |
| **Vehicle Capacity/Utilisation** | Cap at 100%, split load into Option A/B for overflow. | Displays >100% (e.g. 142%) with a red warning instead of actively splitting into multiple UI choices. | **YES** | `pooling.server.ts` calculates theoretical utilisation without strictly chunking into discrete "Available Capacity" options in UI. | `pooling.server.ts`, `farmer.tsx` |
| **Recalculation on Market Change** | Changing destination re-queries vehicles and capacity. | Vehicles/capacity tied to static demo data per market. Needs true reactive re-fetch. | **YES** | Client state doesn't fully trigger backend vehicle reassignment. | `farmer.tsx`, `booking.server.ts` |
| **Hold Booking Error** | Meaningful errors (e.g., "Vehicle has only 800kg left"). | Generic `toast.error("Failed to hold booking")` shown. | **YES** | Catch block swallows backend errors. | `farmer.tsx` |
| **Booking Completion** | Payment confirmation locks booking, updates status to CONFIRMED. | Payment modal exists and triggers API, but final "Tracking" step needs verification. | **PARTIAL** | Modal added, but end-to-end lock needs test. | `farmer.tsx`, `PaymentModal.tsx` |
| **Back Navigation** | Back buttons present in booking flow. | Basic back button added to "DRAFT", but flow needs a robust step-wizard back mechanism. | **PARTIAL** | Limited back navigation implemented. | `farmer.tsx` |
| **Farmer Dashboard** | Shows active tracking, market highlights, support. | Basic UI, but lacks true "Today's Highlights" and robust active dispatch tracking. | **YES** | Dashboard is missing rich operational data. | `farmer.tsx` |
| **Driver Dashboard** | Lifecycle state, SOS button. | SOS and Status transitions added. | **NO** | Fixed in previous pass. | `driver.tsx` |
| **Fleet Dashboard** | Active Trips, Dispatch Override, Diagnostics. | Diagnostics modal and override implemented. | **NO** | Fixed in previous pass. | `fleet.tsx` |
| **Admin Dashboard** | Manage Users (Ban/Unban), Resolve Tickets, Interactive Map. | Toggles and Map node filtering added. | **NO** | Fixed in previous pass. | `admin.tsx` |
| **Support System** | Users can raise tickets with priority. | Admin sees tickets, but Farmer/Driver cannot *raise* them yet. | **YES** | Missing farmer/driver support ticket creation UI. | `farmer.tsx`, `driver.tsx` |

## Conclusion of Phase 0 Audit
While the Admin, Fleet, and Driver dashboards were successfully hardened in the previous pass, the **Farmer Booking Flow (Phases 1-14)** remains heavily flawed. Specifically, the vehicle capacity engine (142% utilisation), the crop catalogue, and the generic error handling require a fundamental rebuild to meet the "Zero Broken Flows" standard for the demo.
