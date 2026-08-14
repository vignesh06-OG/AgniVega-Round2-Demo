import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Gauge, ShieldAlert } from "lucide-react";

import { useMyRoles } from "@/lib/krishi/useRole";
import { HealthWidget } from "@/components/agnivega/HealthWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isPerfMode, setPerfMode } from "@/lib/telemetry/client";
import { clearTelemetry, getTelemetrySnapshot } from "@/lib/telemetry/telemetry.functions";
import { TELEMETRY_THRESHOLDS, type TelemetryEvent } from "@/lib/telemetry/types";

export const Route = createFileRoute("/_authenticated/diagnostics")({
  head: () => ({
    meta: [
      { title: "Diagnostics — Smart Krishi-Yatra AI" },
      {
        name: "description",
        content:
          "Live health checks, slow query and API profiling, client render timings and error monitoring for Smart Krishi-Yatra AI.",
      },
      { property: "og:title", content: "Diagnostics — Smart Krishi-Yatra AI" },
      { property: "og:description", content: "Health, profiling and error monitoring console." },
    ],
  }),
  component: DiagnosticsGate,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm">
      {error.message}
    </div>
  ),
});

/** Profiling is an operator tool: farmers and drivers never see it. */
function DiagnosticsGate() {
  const { isAdmin, ready } = useMyRoles();
  if (!ready) return <div className="p-6 text-sm text-muted-foreground">Checking access…</div>;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">Admins only</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Diagnostics and profiling are restricted to platform administrators.
          </p>
        </div>
      </div>
    );
  }
  return <DiagnosticsPage />;
}

function isSlow(event: TelemetryEvent): boolean {
  if (event.kind === "query") return event.durationMs >= TELEMETRY_THRESHOLDS.slowQueryMs;
  if (event.kind === "api") return event.durationMs >= TELEMETRY_THRESHOLDS.slowApiMs;
  if (event.kind === "render") return event.durationMs >= TELEMETRY_THRESHOLDS.slowRenderMs;
  return false;
}

function EventTable({ events }: { events: TelemetryEvent[] }) {
  if (events.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">No samples recorded yet.</p>;
  }
  return (
    <div className="divide-y divide-border/60">
      {events.map((event) => (
        <div key={event.id} className="flex items-start justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">
              <Badge variant="outline" className="mr-2 px-1 py-0 text-[10px]">
                {event.source}
              </Badge>
              {event.name}
            </p>
            {event.detail ? (
              <p className="truncate text-xs text-muted-foreground" title={event.detail}>
                {event.detail}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <span
              className={`tabular-nums ${!event.ok ? "text-destructive" : isSlow(event) ? "text-accent-foreground" : "text-muted-foreground"}`}
            >
              {event.durationMs} ms
            </span>
            <p className="text-[11px] text-muted-foreground">
              {new Date(event.at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiagnosticsPage() {
  const fetchSnapshot = useServerFn(getTelemetrySnapshot);
  const reset = useServerFn(clearTelemetry);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["telemetry-snapshot"],
    queryFn: () => fetchSnapshot(),
    refetchInterval: 15_000,
  });

  const events = data?.events ?? [];
  const summary = data?.summary;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Activity className="h-6 w-6 text-primary" /> Diagnostics
        </h1>
        <p className="text-sm text-muted-foreground">
          Health probes, slow query/API profiling, client render timings and captured errors.
        </p>
      </header>

      <HealthWidget />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4" /> Profiling
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPerfMode(!isPerfMode())}>
              {isPerfMode() ? "Disable" : "Enable"} browser profiling
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void reset().then(() =>
                  queryClient.invalidateQueries({ queryKey: ["telemetry-snapshot"] }),
                )
              }
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            {[
              ["Samples", summary?.total ?? 0],
              ["Slow queries", summary?.slowQueries ?? 0],
              ["Slow APIs", summary?.slowApiCalls ?? 0],
              ["Slow renders", summary?.slowRenders ?? 0],
              ["p95", `${summary?.p95Ms ?? 0} ms`],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-md border border-border/60 p-2 text-center"
              >
                <p className="text-xs uppercase text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="queries">
            <TabsList>
              <TabsTrigger value="queries">Queries</TabsTrigger>
              <TabsTrigger value="api">API calls</TabsTrigger>
              <TabsTrigger value="render">Renders</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>
            <TabsContent value="queries">
              <EventTable events={events.filter((e: TelemetryEvent) => e.kind === "query")} />
            </TabsContent>
            <TabsContent value="api">
              <EventTable
                events={events.filter(
                  (e: TelemetryEvent) => e.kind === "api" || e.kind === "route",
                )}
              />
            </TabsContent>
            <TabsContent value="render">
              <EventTable events={events.filter((e: TelemetryEvent) => e.kind === "render")} />
            </TabsContent>
            <TabsContent value="errors">
              <EventTable
                events={events.filter((e: TelemetryEvent) => e.kind === "error" || !e.ok)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5" />
        Samples live in server memory only (last 500) and contain no personal data. Errors are
        relayed to your monitoring service when SENTRY_DSN is configured.
      </p>
    </div>
  );
}
