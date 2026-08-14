# Technical Architecture

AgniVega is a modern web application built for high performance, rapid iteration, and offline tolerance.

## 1. Core Stack
- **Frontend Framework**: React 19 + TypeScript
- **Meta-Framework**: TanStack Start (SSR capabilities) + Vite
- **Routing**: TanStack Router (Type-safe file-based routing)
- **Styling**: Tailwind CSS v4 + Radix UI primitives
- **Map Rendering**: React-Leaflet

## 2. Directory Structure

```text
src/
├── components/
│   ├── agnivega/      # Domain-specific components (Farmer forms, Dashboards)
│   └── ui/            # Reusable Radix/Tailwind components (Buttons, Modals)
├── lib/
│   ├── krishi/        # Core agricultural decision engines (booking, capacity)
│   ├── routing/       # Distance and geocoding logic
│   ├── map/           # Map utilities
│   └── ...
├── routes/
│   ├── _authenticated/ # Role-protected routes (farmer, driver, fleet, admin)
│   ├── api/           # Server API routes
│   └── auth.tsx       # Authentication entry point
└── server.ts          # Server entry
```

## 3. Data Persistence (Hackathon Demo Strategy)
To ensure the application remains perfectly reliable during hackathon evaluations without requiring a live PostgreSQL instance, the primary domain state (bookings, dispatches, tickets) is managed via `localStorage`.

- **Cross-tab sync**: State changes reflect instantly across tabs using event listeners.
- **Why this matters**: Evaluators can test the entire lifecycle (Farmer booking -> Driver dispatch) seamlessly on one machine without database connectivity issues.

## 4. Role Authorization
The application uses strict `beforeLoad` route guards in TanStack Router. 
- The `agnivega_auth` token dictates access. 
- Attempting to access `/admin` as a Farmer redirects instantly to the landing page.
