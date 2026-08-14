# Smart Krishi-Yatra AI — Operator Guide

Team Agnivega · Smart Kopargaon Hackathon 2026 (PS #041)

---

## 1. What this app is

A voice-first, fuel-indexed agri-logistics platform with four decoupled portals:

| Route     | Portal                                                    | Who uses it  |
| --------- | --------------------------------------------------------- | ------------ |
| `/farmer` | Voice load entry, pooling comparison, spoilage clock      | Farmers      |
| `/driver` | Job cockpit, margins, GPS proof, searchable queue         | Drivers      |
| `/fleet`  | Vehicles, driver roster, payouts                          | Fleet owners |
| `/admin`  | KYC queue, platform tuning, **Demo control**, diagnostics | Admins       |

Core engines: fuel-indexed freight (Nashik diesel ₹99.07/L), triple-fallback routing
(OpenRouteService → OSRM → Haversine), calculate-then-confirm pooling, 22-language i18n.

---

## 2. Running locally

```bash
git clone <your-repo> && cd smart-krishi-yatra-ai
./scripts/setup.sh          # installs deps, writes .env, runs checks
npm run dev                 # http://localhost:8080
```

Docker route:

```bash
docker compose up --build
```

Detailed environment/PWA/Android notes live in `docs/RUNNING_LOCALLY.md`;
operations and monitoring live in `docs/OPERATIONS.md`.

Useful scripts:

```bash
npm run dev            # dev server
npm run build          # production build
npx vitest run         # regression suite
```

---

## 3. Admin demo control tab

Open `/admin` → **Demo control panel** (admin role only).

### Running a shift

1. **Start shift simulation** — seeds a Kopargaon–Nashik job queue and begins ticking.
2. **Speed 1× / 2× / 4×** — simulated minutes per real second.
3. **Step** — advance one tick manually (good for jury narration).
4. **Assign all jobs** — apply the current rules to every queued job immediately.
5. **Stop simulation** — clears jobs, keeps demo mode.
6. **Close demo** — wipes simulation, transcripts and demo storage, returns to live data.

### Auto-assign rules

| Rule                   | Meaning                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| Max distance (km)      | Reject drivers farther than this from the pickup                 |
| Max ETA (min)          | Reject drivers who cannot arrive in time                         |
| Hours-of-service cap   | Duty-hour ceiling per driver                                     |
| Hours per job          | Duty hours each accepted job adds                                |
| Max jobs per driver    | Concurrent undelivered jobs allowed                              |
| Look-ahead horizon (h) | Schedule drivers who free up within N hours instead of rejecting |
| Strategy               | `nearest`, `fastest`, or `balanced` (ETA + load + fatigue)       |
| Require skill tags     | Enforce `reefer` / `heavy` / `priority` matching                 |
| Emergency override     | Urgent loads ignore distance & ETA caps                          |

### Presets

One tap switches the whole rule set:

- **Emergency** — widest radius, fastest driver, caps relaxed, 4h look-ahead.
- **Balanced** — default shift profile, spreads work across the roster.
- **Cost-optimized** — short hauls only, strict skills, 6h look-ahead.

### Importing custom presets

- **Download template** produces a CSV of the built-in profiles.
- Edit it (or write JSON) and use **Import presets (CSV / JSON)**.
- Imported profiles appear alongside the built-ins marked `↑`; **Clear imported** removes them.

CSV columns: `key,label,description,maxDistanceKm,maxEtaMinutes,maxHoursOfService,hoursPerJob,maxJobsPerDriver,lookAheadHours,requireSkillMatch,emergencyOverridesLimits,strategy`

JSON form:

```json
[
  {
    "key": "monsoon",
    "label": "Monsoon",
    "description": "Short hauls, unpaved-capable drivers only",
    "maxDistanceKm": 18,
    "maxEtaMinutes": 45,
    "requireSkillMatch": true,
    "strategy": "nearest"
  }
]
```

Missing fields fall back to defaults; unknown columns are ignored.

### Real-time conflict alerts

Alerts are recomputed **before** anything is applied, so rules can be adjusted first.

- **Blocked** (red) — no driver can take the job; the message names the failing rule.
- **Advisory** (outline) — the assignment is legal but close to a limit.

Thresholds are configurable in **Alert thresholds**:

| Threshold             | Effect                                                           |
| --------------------- | ---------------------------------------------------------------- |
| HOS buffer (h)        | Warn when the chosen driver comes within N hours of the duty cap |
| Min skill match (0–1) | Warn when matched skill share falls below this                   |
| ETA buffer (min)      | Warn when the ETA is within N minutes of the cap                 |

### Exports

| Button        | Output                                                                |
| ------------- | --------------------------------------------------------------------- |
| Export CSV    | Full shift log — driver, job, ETA, distance, decision, all rejections |
| Export PDF    | Same log in a print-ready landscape sheet (browser "Save as PDF")     |
| Conflicts CSV | Rejected/flagged jobs only, with the exact blocking rule              |
| Conflicts PDF | Print-ready conflicts report, blocked rows highlighted                |

PDF exports open a new tab and trigger the print dialog — allow pop-ups.

---

## 4. Other admin tools

- **Profiling mode** (`?perf=1`) — slow queries, slow API calls, client render timings. Admin-only.
- **Diagnostics** (`/diagnostics`) — telemetry samples and error monitor feed.
- **Health widget** — probes database, API and routing providers; raw JSON at `/health`.
- **Offline** — routes are cached and transactions queue while offline, replaying on reconnect.

---

## 5. Troubleshooting

| Symptom                                                 | Fix                                                      |
| ------------------------------------------------------- | -------------------------------------------------------- |
| No PDF appears                                          | Allow pop-ups for the site                               |
| Every job shows "no driver satisfies the current rules" | Widen max distance/ETA or switch to the Emergency preset |
| Jobs stay queued despite free drivers                   | Raise the look-ahead horizon or max jobs per driver      |
| Too many advisory alerts                                | Lower the HOS/ETA buffers and min skill match            |
| Demo data lingering                                     | Press **Close demo**                                     |
| Routing falls back to straight-line                     | External provider unreachable — check the health widget  |

---

## 6. Tests

```bash
npx vitest run
```

Covers demo mode lifecycle, live map rendering, voice transcription, admin gating,
map performance, auto-assign rules, look-ahead, presets, imports, alert thresholds
and both export formats.
