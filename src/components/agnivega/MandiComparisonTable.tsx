import { Check, X, MoveRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MandiComparisonTable() {
  return (
    <Card className="border-accent">
      <CardHeader>
        <CardTitle>Why NRY-OS wins</CardTitle>
        <CardDescription>An honest comparison of hackathon solutions</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Feature</th>
              <th className="px-4 py-3 bg-primary/10 text-primary">Smart Krishi-Yatra (Ours)</th>
              <th className="px-4 py-3">Mandi Dashboards</th>
              <th className="px-4 py-3 rounded-tr-lg">Truck Aggregators</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-4 py-3 font-medium">Core Metric</td>
              <td className="px-4 py-3 bg-primary/5 font-semibold text-primary">
                Farmer Net Realization (ENR)
              </td>
              <td className="px-4 py-3">Gross Price/kg</td>
              <td className="px-4 py-3">Transport Time</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Transport Cost</td>
              <td className="px-4 py-3 bg-primary/5">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" /> Fuel-Indexed + Pooled
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <X className="h-3 w-3 inline mr-1" /> Ignored
              </td>
              <td className="px-4 py-3">
                <Check className="h-3 w-3 inline mr-1 text-green-600" /> Per-km fiat rate
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Spoilage Risk</td>
              <td className="px-4 py-3 bg-primary/5">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3 mr-1" /> Yes (Transit + Queue)
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <X className="h-3 w-3 inline mr-1" /> Ignored
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <X className="h-3 w-3 inline mr-1" /> Ignored
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Farmer UI</td>
              <td className="px-4 py-3 bg-primary/5">
                <span className="font-semibold">3-screen flow + IVR Voice</span>
              </td>
              <td className="px-4 py-3">Complex tables</td>
              <td className="px-4 py-3">SaaS map dashboard</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Decision Made</td>
              <td className="px-4 py-3 bg-primary/5 text-primary">
                "Go to Nashik, earn ₹21,925 net"
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                "Nashik is ₹24.5/kg. You figure out the truck."
              </td>
              <td className="px-4 py-3 text-muted-foreground">"Truck arrives in 15m. Where to?"</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
