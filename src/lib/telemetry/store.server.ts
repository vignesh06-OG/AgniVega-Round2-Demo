import {
  summarize,
  TELEMETRY_THRESHOLDS,
  type TelemetryEvent,
  type TelemetrySnapshot,
} from "./types";

/**
 * In-memory ring buffer for the profiling mode. Lives per server isolate, so it
 * is a troubleshooting aid (not durable analytics). No PII is ever stored here.
 */
const MAX_EVENTS = 500;
const buffer: TelemetryEvent[] = [];

/** Profiling is always recording server-side; it is cheap (one array push). */
export function isProfilingEnabled(): boolean {
  return process.env["PROFILING_DISABLED"] !== "true";
}

export function recordEvent(event: Omit<TelemetryEvent, "id" | "at"> & { at?: number }): void {
  if (!isProfilingEnabled()) return;
  buffer.push({
    ...event,
    at: event.at ?? Date.now(),
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  });
  if (buffer.length > MAX_EVENTS) buffer.splice(0, buffer.length - MAX_EVENTS);
}

/** Times any async operation and records it under the given kind/name. */
export async function profile<T>(
  kind: TelemetryEvent["kind"],
  name: string,
  fn: () => Promise<T>,
  meta?: TelemetryEvent["meta"],
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    recordEvent({ kind, name, durationMs: Date.now() - started, ok: true, source: "server", meta });
    return result;
  } catch (error) {
    recordEvent({
      kind,
      name,
      durationMs: Date.now() - started,
      ok: false,
      source: "server",
      detail: (error as Error).message,
      meta,
    });
    throw error;
  }
}

export function snapshot(limit = 200): TelemetrySnapshot {
  const events = buffer.slice(-limit).reverse();
  return {
    enabled: isProfilingEnabled(),
    thresholds: TELEMETRY_THRESHOLDS,
    capturedAt: Date.now(),
    events,
    summary: summarize(events),
  };
}

export function clearEvents(): void {
  buffer.length = 0;
}
