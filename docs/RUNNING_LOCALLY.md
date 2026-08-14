# Smart Krishi-Yatra AI — Local Setup, Build & Mobile App Guide

Team Agnivega · Smart Kopargaon Hackathon 2026 · Problem Statement #041

---

## 1. Prerequisites

| Tool           | Version            | Why                        |
| -------------- | ------------------ | -------------------------- |
| Node.js        | 20 LTS or newer    | Runs Vite + TanStack Start |
| npm (or bun)   | npm 10+ / bun 1.1+ | Package manager            |
| Git            | any                | Cloning / version control  |
| Android Studio | Ladybug or newer   | Only for the mobile build  |

Check:

```bash
node -v
npm -v
```

---

## 2. Install and run the web app

```bash
# from the project root
npm install
npm run dev
```

Open http://localhost:8080

Routes:

| URL       | Portal                                       |
| --------- | -------------------------------------------- |
| `/`       | Public landing page                          |
| `/auth`   | Sign in / create account                     |
| `/farmer` | Farmer portal (voice entry, pooling, quotes) |
| `/driver` | Driver cockpit (load board, trip margin)     |
| `/fleet`  | Fleet operator console                       |
| `/admin`  | Admin control tower (role-gated)             |

---

## 3. Environment variables

The backend (database, auth, storage) is already provisioned. The values live in
`.env` at the project root and are injected automatically in the hosted editor.
When running on your own machine, make sure `.env` contains:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...

# server side (same values, unprefixed)
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
```

Optional, improves routing accuracy (the app falls back automatically if absent):

```bash
OPENROUTESERVICE_API_KEY=...
```

Never commit a service-role key or database password to the repository.

---

## 4. Production build

```bash
npm run build      # emits the optimised bundle
npm run start      # serves the production build locally
```

Deployment: The build output is a standard TanStack Start server bundle and
can run on any Node 20+ host, Vercel, Netlify, Cloudflare Workers, or in Docker.

Self-hosting: the build output is a standard TanStack Start server bundle and
can run on any Node 20 host, Cloudflare Workers, or a container.

---

## 5. Turning it into an installable phone app (fastest path)

The web app is responsive and touch-first. To make it installable:

1. Open the published URL in Chrome (Android) or Safari (iOS).
2. Menu → **Add to Home Screen**.
3. It launches full screen with its own icon — no store submission needed.

---

## 6. Native Android build (reference module)

A Jetpack Compose reference client lives under `android/`.

```bash
cd android
./gradlew assembleDebug          # debug APK
./gradlew assembleRelease        # signed release APK (needs keystore.properties)
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected phone:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

To publish on Play Store you need a Google Play Developer account, a signed
AAB (`./gradlew bundleRelease`), a privacy policy URL, and store listing
assets.

---

## 7. Python reference backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

This mirrors the freight, pooling and OR-Tools sequencing logic that the
TypeScript server functions implement in the live app. It is provided as an
algorithmic reference for the jury; the deployed product does not depend on it.

---

## 8. Performance notes

- Queries are cached for 60 seconds and are not refetched on window focus, so
  switching tabs no longer re-hits the network.
- Route data is prefetched on link hover/tap intent, so portal navigation feels
  instant.
- Routing uses a three-tier fallback (OpenRouteService → OSRM → offline
  Haversine), so quotes never hang waiting on an external service.
- The sign-in page renders client-side only, which removes a hydration
  round-trip and its flash.

---

## 9. Troubleshooting

| Symptom                                     | Fix                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Blank page after `npm run dev`              | Delete `node_modules` and reinstall                                             |
| "Administrator access required" on `/admin` | Your account lacks the admin role; grant it in the backend `user_roles` table   |
| Google sign-in fails locally                | Use email/password locally; the OAuth broker is bound to the hosted domains     |
| Quote takes long                            | External router is slow — the app falls back automatically within a few seconds |
