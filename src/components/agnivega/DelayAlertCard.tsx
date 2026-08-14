/**
 * DelayAlertCard — Closed-loop delay + recalculation UI.
 *
 * Shown when a driver reports a delay (or delay is simulated in demo mode).
 * The system re-evaluates spoilage risk and tells the farmer:
 *   a) No change needed — original plan still optimal
 *   b) Recommendation changed — here's why and what to do now
 *
 * Classification: DETERMINISTIC recalculation (not ML).
 * This is a hackathon-significant differentiator: most competitors show a
 * one-way recommendation. NRY-OS closes the loop.
 */
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rupees } from "@/lib/krishi/constants";

export type DelayLevel = "safe" | "watch" | "critical";

interface ReoptResult {
  recommendationChanged: boolean;
  newMandiName?: string;
  oldMandiName: string;
  newNetPayout?: number;
  oldNetPayout: number;
  reason: string;
  newSpoilageRisk: number;
  newSpoilageLevel: DelayLevel;
  hoursRemaining: number;
}

interface Props {
  delayMinutes: number;
  result: ReoptResult;
  onAcknowledge: () => void;
  onReconfirm?: () => void;
}

const LEVEL_STYLES: Record<DelayLevel, { card: string; badge: string; icon: string }> = {
  safe: {
    card: "border-green-200 bg-green-50/60",
    badge: "bg-green-100 text-green-800",
    icon: "text-green-600",
  },
  watch: {
    card: "border-yellow-200 bg-yellow-50/60",
    badge: "bg-yellow-100 text-yellow-800",
    icon: "text-yellow-600",
  },
  critical: {
    card: "border-red-200 bg-red-50/60",
    badge: "bg-red-100 text-red-800",
    icon: "text-red-600",
  },
};

export function DelayAlertCard({ delayMinutes, result, onAcknowledge, onReconfirm }: Props) {
  const styles = LEVEL_STYLES[result.newSpoilageLevel];
  const delayHours = (delayMinutes / 60).toFixed(1);

  return (
    <Card className={`border-2 ${styles.card}`} id="delay-alert-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {result.newSpoilageLevel === "critical" ? (
              <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            ) : (
              <RefreshCw className={`h-5 w-5 ${styles.icon}`} />
            )}
            {result.recommendationChanged ? "Re-optimised Route" : "Delay Acknowledged"}
          </CardTitle>
          <Badge className={`text-xs ${styles.badge}`}>+{delayHours}h delay</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {result.recommendationChanged ? (
          /* ── Changed: show the switch ── */
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-md bg-yellow-100 border border-yellow-300 p-2.5">
              <AlertTriangle className="h-4 w-4 text-yellow-700 mt-0.5 shrink-0" />
              <p className="text-yellow-900 font-medium">Delay changes the recommendation.</p>
            </div>
            <div className="rounded-md border bg-background/60 p-3 space-y-1.5">
              <div className="flex justify-between text-muted-foreground line-through">
                <span>Was: {result.oldMandiName}</span>
                <span>{rupees(result.oldNetPayout)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Now: {result.newMandiName}</span>
                <span className="text-primary">{rupees(result.newNetPayout ?? 0)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{result.reason}</p>
            {onReconfirm && (
              <Button id="reconfirm-btn" className="field-tap w-full" onClick={onReconfirm}>
                Confirm New Route → {result.newMandiName}
              </Button>
            )}
          </div>
        ) : (
          /* ── No change: reassure the farmer ── */
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-md bg-green-100 border border-green-300 p-2.5">
              <CheckCircle2 className="h-4 w-4 text-green-700 mt-0.5 shrink-0" />
              <p className="text-green-900 font-medium">
                Original plan still optimal — continue to {result.oldMandiName}.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{result.reason}</p>
          </div>
        )}

        {/* Spoilage status after delay */}
        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Updated spoilage risk after +{delayHours}h delay
          </span>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${styles.icon}`}>{result.newSpoilageRisk}%</span>
            <Badge variant="outline" className={`text-[10px] ${styles.badge}`}>
              {result.newSpoilageLevel}
            </Badge>
            <span className="text-muted-foreground">{result.hoursRemaining.toFixed(0)}h left</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Re-optimisation is deterministic — same ENR formula applied with updated transit time.
          This is not an ML prediction.
        </p>

        <Button variant="outline" className="field-tap w-full" onClick={onAcknowledge}>
          Acknowledge
        </Button>
      </CardContent>
    </Card>
  );
}
