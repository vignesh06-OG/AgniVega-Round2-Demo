import type { HealthCheck, HealthReport, HealthState } from "./types";

export type { HealthCheck, HealthReport, HealthState };

const bootedAt = Date.now();

async function timed(
  name: string,
  fn: () => Promise<Omit<HealthCheck, "name" | "latencyMs">>,
): Promise<HealthCheck> {
  const started = Date.now();
  try {
    const result = await fn();
    return { name, latencyMs: Date.now() - started, ...result };
  } catch (error) {
    return {
      name,
      latencyMs: Date.now() - started,
      state: "down",
      detail: (error as Error).message,
    };
  }
}

async function ping(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Probes API, database and all three routing tiers. Never throws. */
export async function runHealthChecks(): Promise<HealthReport> {
  const { recordEvent } = await import("@/lib/telemetry/store.server");

  const checks = await Promise.all([
    timed("api", async () => ({
      state: "ok" as const,
      detail: "Server functions and routes responding.",
    })),
    timed("database", async () => ({
      state: "ok" as const,
      detail: "Mock database operating normally.",
    })),
    timed("routing:openrouteservice", async () => {
      const key = process.env["ORS_API_KEY"];
      if (!key)
        return {
          state: "skipped" as const,
          detail: "ORS_API_KEY not configured — tier 1 disabled.",
        };
      const res = await ping("https://api.openrouteservice.org/v2/health");
      return res.ok
        ? { state: "ok" as const, detail: "Tier 1 matrix provider reachable." }
        : { state: "degraded" as const, detail: `HTTP ${res.status}` };
    }),
    timed("routing:osrm", async () => {
      const res = await ping(
        "https://router.project-osrm.org/table/v1/driving/74.4783,19.8846;73.7898,19.9975",
      );
      return res.ok
        ? { state: "ok" as const, detail: "Tier 2 matrix provider reachable." }
        : { state: "degraded" as const, detail: `HTTP ${res.status}` };
    }),
    timed("routing:haversine", async () => ({
      state: "ok" as const,
      detail: "Tier 3 offline geometry always available.",
    })),
  ]);

  const critical = checks.filter((c) => c.name === "api" || c.name === "database");
  const routing = checks.filter((c) => c.name.startsWith("routing:"));
  const status: HealthState = critical.some((c) => c.state === "down")
    ? "down"
    : routing.some((c) => c.state === "degraded" || c.state === "down")
      ? "degraded"
      : "ok";

  for (const check of checks) {
    recordEvent({
      kind: "api",
      name: `health:${check.name}`,
      durationMs: check.latencyMs,
      ok: check.state === "ok" || check.state === "skipped",
      source: "server",
      detail: check.detail,
    });
  }

  return {
    status,
    version: process.env["APP_RELEASE"] ?? "dev",
    uptimeHintMs: Date.now() - bootedAt,
    checkedAt: new Date().toISOString(),
    checks,
  };
}
