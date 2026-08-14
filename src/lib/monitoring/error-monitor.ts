import { record, flush } from "@/lib/telemetry/client";

/**
 * Client error monitoring. Captures uncaught errors, unhandled promise
 * rejections and console.error, then relays them (with stack) to the server,
 * which forwards to Sentry when SENTRY_DSN is configured.
 */

let installed = false;
const seen = new Set<string>();

export function captureError(error: unknown, context?: Record<string, string>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const key = `${err.name}:${err.message}`.slice(0, 200);
  if (seen.has(key)) return; // de-duplicate error storms
  seen.add(key);
  if (seen.size > 100) seen.clear();

  const detail = [err.stack ?? err.message, context ? JSON.stringify(context) : ""]
    .filter(Boolean)
    .join("\n");
  record("error", `${err.name}: ${err.message}`.slice(0, 120), 0, {
    ok: false,
    detail: detail.slice(0, 2000),
    alwaysSend: true,
  });
  flush();
}

export function installErrorMonitor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    captureError(event.error ?? event.message, {
      file: `${event.filename}:${event.lineno}:${event.colno}`,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    captureError(event.reason, { kind: "unhandledrejection" });
  });
}
