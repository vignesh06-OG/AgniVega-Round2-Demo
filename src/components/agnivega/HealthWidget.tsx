import { useQuery } from "@tanstack/react-query";
import { Activity, Database, RefreshCw, Route as RouteIcon, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthReport, HealthState } from "@/lib/health/types";

const TONE: Record<HealthState, string> = {
  ok: "bg-primary/15 text-primary border-primary/30",
  degraded: "bg-accent/20 text-accent-foreground border-accent/40",
  down: "bg-destructive/15 text-destructive border-destructive/30",
  skipped: "bg-muted text-muted-foreground border-border",
};

function iconFor(name: string) {
  if (name === "database") return Database;
  if (name.startsWith("routing:")) return RouteIcon;
  if (name === "api") return Server;
  return Activity;
}

export function HealthWidget({ compact = false }: { compact?: boolean }) {
  const { data, isFetching, refetch, error } = useQuery<HealthReport>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/public/health", { cache: "no-store" });
      return (await res.json()) as HealthReport;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const status: HealthState = error ? "down" : (data?.status ?? "skipped");

  if (compact) {
    return (
      <Badge variant="outline" className={TONE[status]}>
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current" />
        {status === "ok"
          ? "All systems normal"
          : status === "degraded"
            ? "Degraded"
            : status === "down"
              ? "Outage"
              : "Checking"}
      </Badge>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" /> System health
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={TONE[status]}>
            {status.toUpperCase()}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(data?.checks ?? []).map((check) => {
          const Icon = iconFor(check.name);
          return (
            <div
              key={check.name}
              className="flex items-start justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-xs text-muted-foreground">{check.detail}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={TONE[check.state]}>
                  {check.state}
                </Badge>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {check.latencyMs} ms
                </p>
              </div>
            </div>
          );
        })}
        {data ? (
          <p className="pt-1 text-xs text-muted-foreground">
            Build {data.version} · checked {new Date(data.checkedAt).toLocaleTimeString()}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
