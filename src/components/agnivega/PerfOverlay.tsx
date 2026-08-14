import { Gauge, Trash2, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearLocalSamples,
  getLocalSamples,
  getLocalSummary,
  isPerfMode,
  setPerfMode,
  startClientProfiler,
  subscribe,
} from "@/lib/telemetry/client";
import { TELEMETRY_THRESHOLDS } from "@/lib/telemetry/types";

const EMPTY_SAMPLES: ReturnType<typeof getLocalSamples> = [];

/** Floating profiling panel. Visible only when perf mode is on (?perf=1). */
export function PerfOverlay() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (isPerfMode()) startClientProfiler();
  }, []);

  const samples = useSyncExternalStore(subscribe, getLocalSamples, () => EMPTY_SAMPLES);

  if (!mounted || !isPerfMode()) return null;
  const summary = getLocalSummary();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs shadow-lg"
      >
        <Gauge className="h-4 w-4" /> perf
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[22rem] max-w-[92vw] rounded-lg border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">
          <Gauge className="h-4 w-4" /> Profiling mode
        </span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={clearLocalSamples}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-4 gap-1 text-center">
        {[
          ["p50", `${summary.p50Ms}ms`],
          ["p95", `${summary.p95Ms}ms`],
          ["slow", String(summary.slowRenders + summary.slowApiCalls + summary.slowQueries)],
          ["err", String(summary.errors)],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-border/60 py-1">
            <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
            <div className="font-semibold tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="max-h-56 space-y-1 overflow-auto">
        {samples.slice(0, 60).map((s, i) => {
          const slow =
            (s.kind === "render" && s.durationMs >= TELEMETRY_THRESHOLDS.slowRenderMs) ||
            (s.kind === "api" && s.durationMs >= TELEMETRY_THRESHOLDS.slowApiMs) ||
            (s.kind === "query" && s.durationMs >= TELEMETRY_THRESHOLDS.slowQueryMs);
          return (
            <div key={`${s.at}-${i}`} className="flex items-center justify-between gap-2">
              <span className="truncate" title={s.detail ?? s.name}>
                <Badge variant="outline" className="mr-1 px-1 py-0 text-[10px]">
                  {s.kind}
                </Badge>
                {s.name}
              </span>
              <span
                className={`tabular-nums ${!s.ok ? "text-destructive" : slow ? "text-accent-foreground" : "text-muted-foreground"}`}
              >
                {s.durationMs}ms
              </span>
            </div>
          );
        })}
        {samples.length === 0 ? <p className="text-muted-foreground">Collecting samples…</p> : null}
      </div>

      <button
        className="mt-2 text-[11px] underline text-muted-foreground"
        onClick={() => setPerfMode(false)}
      >
        Turn profiling off
      </button>
    </div>
  );
}
