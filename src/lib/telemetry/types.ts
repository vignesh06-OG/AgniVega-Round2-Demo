/** Shared, client-safe telemetry contracts. */

export type TelemetryKind = "query" | "api" | "render" | "error" | "route";

export interface TelemetryEvent {
  id: string;
  kind: TelemetryKind;
  /** Short operation label, e.g. "db:shipment_requests.select" or "ors:matrix". */
  name: string;
  /** Duration in milliseconds (0 for errors). */
  durationMs: number;
  /** Wall clock, epoch ms. */
  at: number;
  ok: boolean;
  source: "server" | "client";
  detail?: string | undefined;
  meta?: Record<string, string | number | boolean | null> | undefined;
}

export interface TelemetryThresholds {
  /** Above this a database query is considered slow. */
  slowQueryMs: number;
  /** Above this an outbound API/server call is considered slow. */
  slowApiMs: number;
  /** Above this a client render/navigation is considered slow. */
  slowRenderMs: number;
}

export const TELEMETRY_THRESHOLDS: TelemetryThresholds = {
  slowQueryMs: 300,
  slowApiMs: 800,
  slowRenderMs: 200,
};

export interface TelemetrySnapshot {
  enabled: boolean;
  thresholds: TelemetryThresholds;
  capturedAt: number;
  events: TelemetryEvent[];
  summary: {
    total: number;
    slowQueries: number;
    slowApiCalls: number;
    slowRenders: number;
    errors: number;
    p50Ms: number;
    p95Ms: number;
    worst: TelemetryEvent | null;
  };
}

export function summarize(events: TelemetryEvent[]): TelemetrySnapshot["summary"] {
  const timed = events.filter((e) => e.kind !== "error").map((e) => e.durationMs);
  const sorted = [...timed].sort((a, b) => a - b);
  const pick = (p: number) =>
    sorted.length ? (sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0) : 0;
  const worst = events.reduce<TelemetryEvent | null>(
    (acc, e) => (acc == null || e.durationMs > acc.durationMs ? e : acc),
    null,
  );
  return {
    total: events.length,
    slowQueries: events.filter(
      (e) => e.kind === "query" && e.durationMs >= TELEMETRY_THRESHOLDS.slowQueryMs,
    ).length,
    slowApiCalls: events.filter(
      (e) => e.kind === "api" && e.durationMs >= TELEMETRY_THRESHOLDS.slowApiMs,
    ).length,
    slowRenders: events.filter(
      (e) => e.kind === "render" && e.durationMs >= TELEMETRY_THRESHOLDS.slowRenderMs,
    ).length,
    errors: events.filter((e) => e.kind === "error" || !e.ok).length,
    p50Ms: Math.round(pick(0.5)),
    p95Ms: Math.round(pick(0.95)),
    worst,
  };
}
