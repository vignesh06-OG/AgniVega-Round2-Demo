import type { TelemetryEvent, TelemetryKind } from "./types";
import { summarize, TELEMETRY_THRESHOLDS } from "./types";

/**
 * Browser-side profiling mode.
 * Enable with `?perf=1` (persists) or `localStorage.setItem("agnivega:perf","1")`.
 * Disable with `?perf=0`. Samples are buffered locally and flushed to
 * /api/public/telemetry in small batches.
 */

const STORAGE_KEY = "agnivega:perf";
const MAX_LOCAL = 300;

type Sample = Pick<TelemetryEvent, "kind" | "name" | "durationMs" | "ok" | "detail" | "at">;

const local: Sample[] = [];
const pending: (Sample & { url?: string | undefined })[] = [];
const listeners = new Set<() => void>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

export function isPerfMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const param = new URLSearchParams(window.location.search).get("perf");
    if (param === "1") localStorage.setItem(STORAGE_KEY, "1");
    if (param === "0") localStorage.removeItem(STORAGE_KEY);
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPerfMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
  emit();
}

function emit() {
  snapshot = null;
  version += 1;
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let snapshot: Sample[] | null = null;
let lastSnapshot: Sample[] | null = null;
let version = 0;
let lastSnapshotVersion = -1;

export function getLocalSamples(): Sample[] {
  if (!snapshot) snapshot = [...local].reverse();
  // Runtime guard: useSyncExternalStore requires a referentially stable
  // snapshot between store changes, otherwise React loops until it throws
  // "Maximum update depth exceeded".
  if (lastSnapshotVersion === version && lastSnapshot && lastSnapshot !== snapshot) {
    const message = "Telemetry snapshot changed identity without a store update";
    if (import.meta.env?.DEV) throw new Error(message);
    console.warn(message);
  }
  lastSnapshot = snapshot;
  lastSnapshotVersion = version;
  return snapshot;
}

export function getLocalSummary() {
  return summarize(
    local.map((s, i) => ({ ...s, id: String(i), source: "client" as const })) as TelemetryEvent[],
  );
}

export function clearLocalSamples(): void {
  local.length = 0;
  emit();
}

/** Record a client sample; always relays errors, relays timings only in perf mode. */
export function record(
  kind: TelemetryKind,
  name: string,
  durationMs: number,
  options: { ok?: boolean; detail?: string; alwaysSend?: boolean } = {},
): void {
  const sample: Sample = {
    kind,
    name,
    durationMs: Math.round(durationMs),
    ok: options.ok ?? true,
    detail: options.detail,
    at: Date.now(),
  };
  local.push(sample);
  if (local.length > MAX_LOCAL) local.shift();
  emit();

  if (options.alwaysSend || isPerfMode()) {
    pending.push({
      ...sample,
      url: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    scheduleFlush();
  }
}

/** Times an async client operation (server-fn call, fetch, mutation). */
export async function measure<T>(
  kind: TelemetryKind,
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  try {
    const result = await fn();
    record(kind, name, performance.now() - started);
    return result;
  } catch (error) {
    record(kind, name, performance.now() - started, {
      ok: false,
      detail: (error as Error).message,
    });
    throw error;
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 3000);
}

export function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!pending.length) return;
  const events = pending.splice(0, 50);
  void fetch("/api/public/telemetry", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ events }),
    keepalive: true,
  }).catch(() => {
    /* telemetry must never break the app */
  });
}

/** Installs PerformanceObservers for navigation, paint, long tasks and resources. */
export function startClientProfiler(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const observe = (type: string, handler: (entry: PerformanceEntry) => void) => {
    try {
      const observer = new PerformanceObserver((list) => list.getEntries().forEach(handler));
      observer.observe({ type, buffered: true } as PerformanceObserverInit);
    } catch {
      /* unsupported entry type */
    }
  };

  observe("navigation", (entry) => {
    const nav = entry as PerformanceNavigationTiming;
    record("render", "navigation:load", nav.duration, { alwaysSend: isPerfMode() });
    record("render", "navigation:ttfb", nav.responseStart);
  });
  observe("paint", (entry) => record("render", `paint:${entry.name}`, entry.startTime));
  observe("largest-contentful-paint", (entry) => record("render", "paint:lcp", entry.startTime));
  observe("longtask", (entry) => {
    if (entry.duration >= TELEMETRY_THRESHOLDS.slowRenderMs) {
      record("render", "longtask", entry.duration, { ok: false, detail: "Main thread blocked" });
    }
  });
  observe("resource", (entry) => {
    const res = entry as PerformanceResourceTiming;
    if (res.duration >= TELEMETRY_THRESHOLDS.slowApiMs && /\/(api|_serverFn)\//.test(res.name)) {
      record("api", `fetch:${new URL(res.name, window.location.origin).pathname}`, res.duration);
    }
  });

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
