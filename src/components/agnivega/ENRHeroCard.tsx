/**
 * ENRHeroCard — The primary result screen component.
 *
 * Shows the net realization breakdown using the canonical ENR formula:
 *   NET = GROSS − FREIGHT − PLATFORM FEE
 *
 * Queue time is shown as context (affects arrival window + spoilage risk)
 * but is NOT shown as a monetary deduction, matching itemiseEarnings().
 *
 * All prices display a SIMULATED DEMO DATA label when not from live feed.
 */
import { Truck, Users, TrendingUp, MapPin, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataLabel } from "./DataLabel";
import { rupees } from "@/lib/krishi/constants";
import type { MandiOption } from "@/lib/krishi/types";
import type { Lang } from "@/lib/krishi/i18n";

interface Props {
  option: MandiOption;
  cropName: string;
  weightKg: number;
  routerTier: string;
  dieselPrice: number;
  commissionPercent: number;
  lang: Lang;
  onConfirmPooled: () => void;
  onConfirmSolo: () => void;
  /** Whether price data is from a live feed or simulated */
  priceDataStatus?: "LIVE" | "SIMULATED";
}

export function ENRHeroCard({
  option,
  cropName,
  weightKg,
  routerTier,
  dieselPrice,
  commissionPercent,
  lang,
  onConfirmPooled,
  onConfirmSolo,
  priceDataStatus = "SIMULATED",
}: Props) {
  const pooledNet = option.pooled.netPayout;
  const soloNet = option.solo.netPayout;
  const savings = Math.max(0, option.solo.freightCost - option.pooled.freightShare);

  const spoilageColor =
    option.spoilage.level === "critical"
      ? "text-red-600"
      : option.spoilage.level === "watch"
        ? "text-yellow-600"
        : "text-green-600";

  return (
    <Card className="border-2 border-primary/30 shadow-lg" id="enr-hero-card">
      {/* ── Header ── */}
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">⭐ {option.mandiName}</CardTitle>
              <Badge variant="default" className="text-xs">
                Best
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <MapPin className="inline h-3 w-3 mr-0.5" />
              {option.distanceKm} km ·
              <Clock className="inline h-3 w-3 mx-0.5" />
              Arrive {option.arrivalWindow} · Queue {option.queueMinutes} min
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <DataLabel status={priceDataStatus} />
            <Badge variant="outline" className="text-[10px]">
              ₹{dieselPrice}/L diesel
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {commissionPercent}% fee
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── ENR Breakdown: Pooled (primary recommendation) ── */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3">
            <Users className="h-4 w-4" />
            Pooled truck ({option.pooled.poolPartners + 1} farmers ·{" "}
            {option.pooled.utilisationPercent}% full)
          </p>

          {/* ENR formula — explicit line items */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Mandi price (₹{option.pricePerKg}/kg × {weightKg.toLocaleString("en-IN")} kg)
              </span>
              <span className="tabular-nums font-medium">{rupees(option.grossPayout)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                − Transport share
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({option.pooled.vehicle}, {option.pooled.poolPartners} partners)
                </span>
              </span>
              <span className="tabular-nums text-destructive/80">
                − {rupees(option.pooled.freightShare)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">− Platform fee ({commissionPercent}%)</span>
              <span className="tabular-nums text-destructive/80">
                − {rupees(option.pooled.platformFee)}
              </span>
            </div>
            {option.pooled.spoilageLoss > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">− Est. quality/spoilage loss</span>
                <span className="tabular-nums text-destructive/80">
                  − {rupees(option.pooled.spoilageLoss)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-primary/20 pt-2 mt-2">
              <span className="font-bold text-base">You receive</span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {rupees(pooledNet)}
              </span>
            </div>
          </div>

          {/* Spoilage signal */}
          <p className={`mt-2 text-xs font-medium ${spoilageColor}`}>
            {option.spoilage.level === "critical" &&
              "⚠️ Spoilage risk HIGH — harvest may lose value in transit"}
            {option.spoilage.level === "watch" &&
              "⚠️ Spoilage risk MODERATE — check timing before confirming"}
            {option.spoilage.level === "safe" && "✅ Spoilage risk LOW — safe within shelf life"} (
            {option.spoilage.riskPercent}% risk · {option.spoilage.hoursRemaining.toFixed(0)}h
            remaining)
          </p>

          {savings > 0 && (
            <p className="mt-1.5 text-xs text-primary font-medium">
              💡 Pool saves you {rupees(savings)} vs solo trip · {option.esg.litresSaved.toFixed(1)}
              L diesel saved
            </p>
          )}

          <Button
            id="confirm-pooled-btn"
            className="field-tap mt-4 w-full text-base"
            onClick={onConfirmPooled}
          >
            ✅ Confirm Pooled Trip
          </Button>
        </div>

        {/* ── Solo option (secondary) ── */}
        <div className="rounded-lg border p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-2">
            <Truck className="h-4 w-4" />
            Solo trip ({option.solo.vehicle} · {option.solo.utilisationPercent}% full)
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Mandi price</span>
              <span className="tabular-nums">{rupees(option.grossPayout)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>− Full freight</span>
              <span className="tabular-nums">− {rupees(option.solo.freightCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>− Platform fee</span>
              <span className="tabular-nums">− {rupees(option.solo.platformFee)}</span>
            </div>
            {option.solo.spoilageLoss > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>− Est. spoilage loss</span>
                <span className="tabular-nums">− {rupees(option.solo.spoilageLoss)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1.5 mt-1.5">
              <span className="font-semibold">You receive</span>
              <span className="text-xl font-bold tabular-nums">{rupees(soloNet)}</span>
            </div>
          </div>
          <Button
            id="confirm-solo-btn"
            variant="outline"
            className="field-tap mt-3 w-full"
            onClick={onConfirmSolo}
          >
            Confirm Solo Trip
          </Button>
        </div>

        {/* ── Queue note (informational — not a deduction) ── */}
        <p className="flex gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          Gate queue ({option.queueMinutes} min) affects your arrival time and spoilage risk, but is
          not charged separately. Router: {routerTier}.
        </p>
      </CardContent>
    </Card>
  );
}
