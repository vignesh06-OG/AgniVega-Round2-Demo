import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface SpoilageClockProps {
  deadlineIso: string;
  totalHours: number;
  level: "safe" | "watch" | "critical";
  label: string;
}

export function SpoilageClock({ deadlineIso, totalHours, level, label }: SpoilageClockProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const msLeft = Math.max(0, new Date(deadlineIso).getTime() - now);
  const hoursLeft = msLeft / 3_600_000;
  const percent = Math.max(0, Math.min(100, (hoursLeft / Math.max(1, totalHours)) * 100));
  const tone =
    level === "critical" ? "text-destructive" : level === "watch" ? "text-warn" : "text-success";

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={`text-sm font-bold tabular-nums ${tone}`}>
          {Math.floor(hoursLeft)}h {Math.floor((hoursLeft % 1) * 60)}m left
        </span>
      </div>
      <Progress value={percent} className="mt-2 h-2" />
    </div>
  );
}
