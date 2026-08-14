/**
 * ExplainabilityCard — "Why this destination?" reasoning box.
 *
 * Shows the farmer exactly why the recommended mandi beats the instinct choice
 * (usually the nearest or highest-priced mandi).
 *
 * This is the core differentiator from a mandi price board:
 * - Mandi price board: shows ₹24.5/kg at Nashik
 * - ExplainabilityCard: shows WHY going to Nashik puts Rs 4,039 MORE in hand
 *   despite higher freight cost
 *
 * Classification: DETERMINISTIC logic (no ML).
 */
import { TrendingUp, TrendingDown, Minus, MapPin, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rupees } from "@/lib/krishi/constants";
import type { MandiOption } from "@/lib/krishi/types";

interface MandiSummary {
  mandiId: string;
  mandiName: string;
  distanceKm: number;
  pricePerKg: number;
  netPayout: number; // pooled
}

interface Props {
  winner: MandiOption;
  allOptions: MandiOption[];
  weightKg: number;
}

interface Factor {
  label: string;
  direction: "positive" | "negative" | "neutral";
  value: string;
}

function computeFactors(winner: MandiOption, reference: MandiOption, weightKg: number): Factor[] {
  const factors: Factor[] = [];

  // Price difference
  const priceDiff = winner.pricePerKg - reference.pricePerKg;
  const grossDiff = priceDiff * weightKg;
  if (Math.abs(priceDiff) > 0.5) {
    factors.push({
      label: `Mandi price: ₹${winner.pricePerKg}/kg vs ₹${reference.pricePerKg}/kg`,
      direction: priceDiff > 0 ? "positive" : "negative",
      value: `${priceDiff > 0 ? "+" : ""}${rupees(grossDiff)} gross`,
    });
  }

  // Freight difference
  const freightDiff = reference.pooled.freightShare - winner.pooled.freightShare;
  if (Math.abs(freightDiff) > 50) {
    factors.push({
      label: `Transport cost: ${rupees(winner.pooled.freightShare)} vs ${rupees(reference.pooled.freightShare)}`,
      direction: freightDiff > 0 ? "positive" : "negative",
      value: `${freightDiff > 0 ? "save" : "extra"} ${rupees(Math.abs(freightDiff))}`,
    });
  }

  // Distance context
  const distDiff = winner.distanceKm - reference.distanceKm;
  if (Math.abs(distDiff) > 5) {
    factors.push({
      label: `Distance: ${winner.distanceKm} km vs ${reference.distanceKm} km`,
      direction: distDiff < 0 ? "positive" : "neutral",
      value: `${Math.abs(distDiff).toFixed(0)} km ${distDiff > 0 ? "farther" : "nearer"}`,
    });
  }

  // Queue impact on timing
  const queueDiff = winner.queueMinutes - reference.queueMinutes;
  if (Math.abs(queueDiff) > 10) {
    factors.push({
      label: `Gate queue: ${winner.queueMinutes} min vs ${reference.queueMinutes} min`,
      direction: queueDiff < 0 ? "positive" : "neutral",
      value: `${Math.abs(queueDiff)} min ${queueDiff > 0 ? "longer" : "shorter"} wait`,
    });
  }

  return factors;
}

export function ExplainabilityCard({ winner, allOptions, weightKg }: Props) {
  if (allOptions.length < 2) return null;

  // The "instinct choice" — nearest mandi (lowest distance)
  const byDistance = [...allOptions].sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = byDistance[0]!;
  const isWinnerNearest = winner.mandiId === nearest.mandiId;

  // The "price instinct" — highest mandi price
  const byPrice = [...allOptions].sort((a, b) => b.pricePerKg - a.pricePerKg);
  const highestPrice = byPrice[0]!;
  const isWinnerHighestPrice = winner.mandiId === highestPrice.mandiId;

  const netDiffVsNearest = winner.pooled.netPayout - nearest.pooled.netPayout;
  const netDiffVsHighestPrice = winner.pooled.netPayout - highestPrice.pooled.netPayout;

  const factors = isWinnerNearest ? [] : computeFactors(winner, nearest, weightKg);

  return (
    <Card className="border-accent/30 bg-accent/5" id="why-this-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <IndianRupee className="h-4 w-4 text-accent-foreground" />
          Why {winner.mandiName}?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Hero numbers */}
        <div className="rounded-lg bg-background/60 border p-3 space-y-1">
          {!isWinnerNearest && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Nearest mandi ({nearest.mandiName})
              </span>
              <span className="font-medium">{rupees(nearest.pooled.netPayout)}</span>
            </div>
          )}
          {!isWinnerHighestPrice && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Highest price (₹{highestPrice.pricePerKg}/kg at {highestPrice.mandiName})
              </span>
              <span className="font-medium">{rupees(highestPrice.pooled.netPayout)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-1.5 mt-1.5">
            <span className="font-semibold">Recommended ({winner.mandiName})</span>
            <span className="font-bold text-primary">{rupees(winner.pooled.netPayout)}</span>
          </div>
        </div>

        {/* Advantage statement */}
        {!isWinnerNearest && netDiffVsNearest > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-2.5">
            <TrendingUp className="h-4 w-4 text-green-700 mt-0.5 shrink-0" />
            <p className="text-green-800 font-medium">
              Going to {winner.mandiName} puts <strong>{rupees(netDiffVsNearest)} more</strong> in
              your hands compared to {nearest.mandiName}, even though it's{" "}
              {(winner.distanceKm - nearest.distanceKm).toFixed(0)} km farther.
            </p>
          </div>
        )}

        {/* Factor breakdown */}
        {factors.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Key factors
            </p>
            <div className="space-y-1.5">
              {factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span
                    className={`font-semibold shrink-0 ${
                      f.direction === "positive"
                        ? "text-green-700"
                        : f.direction === "negative"
                          ? "text-red-700"
                          : "text-foreground"
                    }`}
                  >
                    {f.direction === "positive" && <TrendingUp className="inline h-3 w-3 mr-0.5" />}
                    {f.direction === "negative" && (
                      <TrendingDown className="inline h-3 w-3 mr-0.5" />
                    )}
                    {f.direction === "neutral" && <Minus className="inline h-3 w-3 mr-0.5" />}
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edge case: winner IS the nearest */}
        {isWinnerNearest && (
          <p className="text-muted-foreground">
            ✅ The nearest mandi is also the best net option today. No trade-off required.
          </p>
        )}

        <p className="text-[10px] text-muted-foreground border-t pt-2">
          Recommendation is based on: gross mandi payout − fuel-indexed freight share − platform
          fee. Queue time affects arrival window only. Prices: SIMULATED DEMO DATA.
        </p>
      </CardContent>
    </Card>
  );
}
