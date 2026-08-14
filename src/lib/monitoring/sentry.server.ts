/**
 * Minimal Sentry-compatible transport. Sends the standard envelope so any
 * Sentry (or GlitchTip / self-hosted) DSN works without shipping the SDK to the
 * browser. The DSN stays server-side: browsers report to /api/public/telemetry
 * and the server relays.
 */

interface ParsedDsn {
  url: string;
  key: string;
}

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "");
    if (!projectId || !u.username) return null;
    return {
      url: `${u.protocol}//${u.host}/api/${projectId}/envelope/`,
      key: u.username,
    };
  } catch {
    return null;
  }
}

export interface MonitoredError {
  message: string;
  stack?: string | undefined;
  type?: string | undefined;
  source: "server" | "client";
  url?: string | undefined;
  release?: string | undefined;
  tags?: Record<string, string> | undefined;
}

export async function captureToSentry(error: MonitoredError): Promise<boolean> {
  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) return false;
  const parsed = parseDsn(dsn);
  if (!parsed) return false;

  const eventId = crypto.randomUUID().replace(/-/g, "");
  const sentAt = new Date().toISOString();
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    logger: error.source,
    release: error.release ?? process.env["APP_RELEASE"] ?? "dev",
    environment: process.env["NODE_ENV"] ?? "production",
    tags: { runtime: error.source, ...(error.tags ?? {}) },
    request: error.url ? { url: error.url } : undefined,
    exception: {
      values: [
        {
          type: error.type ?? "Error",
          value: error.message,
          stacktrace: error.stack
            ? { frames: [{ filename: error.url ?? "app", function: error.stack.slice(0, 900) }] }
            : undefined,
        },
      ],
    },
  };

  const envelope =
    `${JSON.stringify({ event_id: eventId, sent_at: sentAt })}\n` +
    `${JSON.stringify({ type: "event" })}\n` +
    `${JSON.stringify(event)}\n`;

  try {
    const res = await fetch(parsed.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=agnivega/1.0, sentry_key=${parsed.key}`,
      },
      body: envelope,
    });
    return res.ok;
  } catch {
    return false;
  }
}
