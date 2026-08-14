import { createFileRoute } from "@tanstack/react-router";

/** Public liveness/readiness probe: API, database, and routing providers. */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const { runHealthChecks } = await import("@/lib/health/health.server");
        const report = await runHealthChecks();
        return Response.json(report, {
          status: report.status === "down" ? 503 : 200,
          headers: { "cache-control": "no-store" },
        });
      },
    },
  },
});
