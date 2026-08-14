import { createFileRoute } from "@tanstack/react-router";

/** Convenience alias for uptime monitors: GET /health. */
export const Route = createFileRoute("/health")({
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
