# Operations Guide — Smart Krishi-Yatra AI

## 1. One-command local setup

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh            # install, create .env, start http://localhost:8080
./scripts/setup.sh --no-start # prepare only
./scripts/setup.sh --docker   # everything inside Docker Compose
```

Docker Compose directly:

```bash
cp .env.example .env
docker compose up --build                    # frontend + SSR on :8080
docker compose --profile reference up        # also runs the Python reference backend on :8000
```

Environment variables live in `.env` (see `.env.example`). Only
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are required for the UI;
`ORS_API_KEY` and `SENTRY_DSN` are optional.

## 2. Health checks

| Endpoint                 | Purpose                       |
| ------------------------ | ----------------------------- |
| `GET /health`            | Uptime-monitor friendly alias |
| `GET /api/public/health` | Same payload, canonical path  |

Returns HTTP 200 when healthy or degraded, 503 when the API or database is down:

```json
{
  "status": "ok",
  "version": "dev",
  "checkedAt": "2026-01-01T00:00:00.000Z",
  "checks": [
    { "name": "api", "state": "ok", "latencyMs": 1, "detail": "..." },
    { "name": "database", "state": "ok", "latencyMs": 42, "detail": "..." },
    { "name": "routing:openrouteservice", "state": "skipped", "latencyMs": 0, "detail": "..." },
    { "name": "routing:osrm", "state": "ok", "latencyMs": 210, "detail": "..." },
    { "name": "routing:haversine", "state": "ok", "latencyMs": 0, "detail": "..." }
  ]
}
```

In-app: the **Diagnostics** page (`/diagnostics`, signed in) renders the same
checks live, auto-refreshing every 60s. `<HealthWidget compact />` drops a status
pill into any header.

## 3. Performance profiling mode

**Server side** (always on unless `PROFILING_DISABLED=true`): every request is
timed, slow database queries (>300 ms) and outbound API calls (>800 ms) are
recorded into a 500-entry in-memory ring buffer. Routing fallbacks to Haversine
are recorded as degraded API events.

**Browser side**: append `?perf=1` to any URL (or toggle it on the Diagnostics
page). A floating panel shows p50/p95, long tasks, LCP/paint timings and slow
fetches; samples are batched to `/api/public/telemetry`.
Turn it off with `?perf=0`.

Thresholds live in `src/lib/telemetry/types.ts`.

Instrument your own code:

```ts
import { profile } from "@/lib/telemetry/store.server"; // server
await profile("query", "db:trips.select", () => supabase.from("trips").select("*"));

import { measure } from "@/lib/telemetry/client"; // browser
await measure("api", "confirm-pool", () => confirmPool({ data }));
```

## 4. Error monitoring (Sentry compatible)

Set `SENTRY_DSN` (Sentry, GlitchTip or any Sentry-protocol endpoint) and
`APP_RELEASE`. Client errors are relayed through `/api/public/telemetry` so the
DSN never reaches the browser; server errors are captured by the request
middleware. Source maps are emitted on every production build
(`build.sourcemap: true`), so upload `.output/**/*.map` to your monitoring
service on release:

```bash
npx @sentry/cli releases files "$APP_RELEASE" upload-sourcemaps .output --url-prefix '~/'
```

With no DSN configured, errors still appear on the Diagnostics page.

## 5. Offline support

- A generated service worker (`/sw.js`, `vite-plugin-pwa`) caches the app shell
  and hashed assets. HTML navigations are **network-first** with a 4s timeout, so
  a cached page appears only when the network is genuinely slow or absent.
- Never registers in development mode. Kill switch: append
  `?sw=off` to unregister.
- Confirmation-step transactions can be queued offline:

```ts
import { registerHandler, runOrQueue } from "@/lib/offline/queue";

registerHandler("confirm-pool", (payload) => confirmPool({ data: payload }));
const { queued } = await runOrQueue("confirm-pool", "Pool confirmation", payload);
```

Queued items persist in `localStorage`, are shown in the sync tray (bottom-left)
and replay automatically on reconnect and every 30s while online.

## 6. Troubleshooting quick table

| Symptom               | Where to look                                                                |
| --------------------- | ---------------------------------------------------------------------------- |
| Slow page             | `/diagnostics` → Profiling → Renders; enable `?perf=1`                       |
| Slow data             | Profiling → Queries (db: entries over 300 ms)                                |
| Wrong distances       | Health → `routing:*`; a Haversine fallback event means both providers failed |
| Errors in the field   | Profiling → Errors, plus your Sentry project                                 |
| Stale UI after deploy | Load once with `?sw=off`, then reload                                        |
