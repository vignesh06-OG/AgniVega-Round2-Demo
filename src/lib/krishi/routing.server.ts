import { haversineMatrix, ROAD_FACTOR, type LatLng } from "./geo";
import { PLATFORM } from "./constants";
import { recordEvent } from "@/lib/telemetry/store.server";

export type RouterTier = "openrouteservice" | "osrm" | "haversine";

export interface RouteMatrix {
  tier: RouterTier;
  distancesKm: number[][];
  durationsMin: number[][];
  latencyMs: number;
  degraded: boolean;
  note: string;
}

const TIMEOUT_MS = 3000;

/* Matrices for the same stop set are requested repeatedly while a farmer tries
 * different crops and weights. A short-lived in-process cache keeps the second
 * calculation instant instead of paying another provider round trip. */
const CACHE_TTL_MS = 5 * 60_000;
const matrixCache = new Map<
  string,
  { at: number; value: RouteMatrix & { telemetry: FallbackTelemetry } }
>();

function cacheKey(points: LatLng[]): string {
  return points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");
}

async function withTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Tier 1 — OpenRouteService matrix API (requires ORS_API_KEY). */
async function tryOpenRouteService(
  points: LatLng[],
): Promise<Omit<RouteMatrix, "latencyMs"> | null> {
  const key = process.env["ORS_API_KEY"];
  if (!key) return null;
  const response = await withTimeout("https://api.openrouteservice.org/v2/matrix/driving-hgv", {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({
      locations: points.map((p) => [p.lng, p.lat]),
      metrics: ["distance", "duration"],
      units: "km",
    }),
  });
  if (!response.ok) throw new Error(`ORS ${response.status}`);
  const json = (await response.json()) as { distances?: number[][]; durations?: number[][] };
  if (!json.distances || !json.durations) throw new Error("ORS returned no matrix");
  return {
    tier: "openrouteservice",
    distancesKm: json.distances,
    durationsMin: json.durations.map((row) => row.map((s) => s / 60)),
    degraded: false,
    note: "Live heavy-goods-vehicle road matrix from OpenRouteService.",
  };
}

/** Tier 2 — public OSRM demo server table service. */
async function tryOsrm(points: LatLng[]): Promise<Omit<RouteMatrix, "latencyMs">> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration`;
  const response = await withTimeout(url, { method: "GET" });
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const json = (await response.json()) as { distances?: number[][]; durations?: number[][] };
  if (!json.distances || !json.durations) throw new Error("OSRM returned no matrix");
  return {
    tier: "osrm",
    distancesKm: json.distances.map((row) => row.map((m) => m / 1000)),
    durationsMin: json.durations.map((row) => row.map((s) => s / 60)),
    degraded: false,
    note: "Live road matrix from the public OSRM routing service.",
  };
}

/** Tier 3 — offline Haversine great-circle maths with a rural road factor. */
function haversineFallback(points: LatLng[]): Omit<RouteMatrix, "latencyMs"> {
  const raw = haversineMatrix(points);
  const distancesKm = raw.map((row) => row.map((km) => km * ROAD_FACTOR));
  return {
    tier: "haversine",
    distancesKm,
    durationsMin: distancesKm.map((row) => row.map((km) => (km / PLATFORM.averageSpeedKmph) * 60)),
    degraded: true,
    note: "Routing providers unreachable — distances estimated offline via Haversine geometry.",
  };
}

export interface FallbackTelemetry {
  tier: RouterTier;
  attempted: { tier: RouterTier; ok: boolean; error?: string }[];
}

/**
 * Triple-fallback distance matrix.
 * OpenRouteService -> OSRM -> Haversine. Never throws.
 */
export async function routeMatrix(
  points: LatLng[],
): Promise<RouteMatrix & { telemetry: FallbackTelemetry }> {
  const started = Date.now();
  const key = cacheKey(points);
  const hit = matrixCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.value, latencyMs: 0 };
  }
  const attempted: FallbackTelemetry["attempted"] = [];

  try {
    const ors = await tryOpenRouteService(points);
    if (ors) {
      attempted.push({ tier: "openrouteservice", ok: true });
      const value = {
        ...ors,
        latencyMs: Date.now() - started,
        telemetry: { tier: "openrouteservice" as const, attempted },
      };
      matrixCache.set(key, { at: Date.now(), value });
      return value;
    }
    attempted.push({ tier: "openrouteservice", ok: false, error: "ORS_API_KEY not configured" });
  } catch (error) {
    attempted.push({ tier: "openrouteservice", ok: false, error: (error as Error).message });
  }

  try {
    const osrm = await tryOsrm(points);
    attempted.push({ tier: "osrm", ok: true });
    const value = {
      ...osrm,
      latencyMs: Date.now() - started,
      telemetry: { tier: "osrm" as const, attempted },
    };
    matrixCache.set(key, { at: Date.now(), value });
    return value;
  } catch (error) {
    attempted.push({ tier: "osrm", ok: false, error: (error as Error).message });
  }

  const fallback = haversineFallback(points);
  attempted.push({ tier: "haversine", ok: true });
  recordEvent({
    kind: "api",
    name: "routing:fallback-to-haversine",
    durationMs: Date.now() - started,
    ok: false,
    source: "server",
    detail: attempted.map((a) => `${a.tier}:${a.ok ? "ok" : (a.error ?? "failed")}`).join(" | "),
  });
  return {
    ...fallback,
    latencyMs: Date.now() - started,
    telemetry: { tier: "haversine", attempted },
  };
}
