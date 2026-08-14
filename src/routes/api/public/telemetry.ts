import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { recordEvent } from "@/lib/telemetry/store.server";

const eventSchema = z.object({
  kind: z.enum(["query", "api", "render", "error", "route"]),
  name: z.string().min(1).max(120),
  durationMs: z.number().min(0).max(600_000),
  ok: z.boolean().default(true),
  detail: z.string().max(2000).optional(),
  url: z.string().max(500).optional(),
  meta: z.record(z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
});

const payloadSchema = z.object({ events: z.array(eventSchema).max(50) });

/**
 * Ingest endpoint for browser profiling samples and client errors.
 * Write-only, no PII, no reads — safe to keep unauthenticated.
 */
export const Route = createFileRoute("/api/public/telemetry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = payloadSchema.parse(await request.json());
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { captureToSentry } = await import("@/lib/monitoring/sentry.server");

        for (const event of parsed.events) {
          recordEvent({
            kind: event.kind,
            name: event.name,
            durationMs: event.durationMs,
            ok: event.ok,
            source: "client",
            detail: event.detail,
            meta: event.meta,
          });
          if (event.kind === "error") {
            await captureToSentry({
              message: event.name,
              stack: event.detail,
              source: "client",
              url: event.url,
            });
          }
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
