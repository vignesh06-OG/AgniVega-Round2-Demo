import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandHeader } from "@/components/agnivega/BrandHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  TrendingUp,
  PlusCircle,
  Activity,
  BarChart3,
  AlertTriangle,
  Users,
} from "lucide-react";
import { LiveMap } from "@/components/agnivega/LiveMap";
import {
  DEMO_ENR_RESULTS,
  DEMO_WINNER,
  DEMO_INSIGHT,
  DEMO_POOLED_TOTAL_KG,
  DEMO_POOL_VEHICLE,
  DEMO_POOL_PARTNERS,
  DEMO_FARMER,
} from "@/lib/krishi/canonical-demo";
import { VEHICLE_PROFILES, rupees } from "@/lib/krishi/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Smart Krishi-Yatra AI" },
      {
        name: "description",
        content:
          "Real-time logistics command center for agricultural produce dispatch optimization.",
      },
    ],
  }),
  component: CommandCenter,
});

/* ── Animated live map with simulated driver ── */
function AnimatedLiveMap() {
  const routePoints = [
    { lat: 19.878, lng: 74.46 },
    { lat: 19.892, lng: 74.475 },
    { lat: 19.871, lng: 74.492 },
    { lat: 19.865, lng: 74.481 },
    { lat: 19.8833, lng: 74.4833 },
  ];

  const [driverPos, setDriverPos] = useState(routePoints[0]);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 20000;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % duration;
      const progress = elapsed / duration;
      const totalSegments = routePoints.length - 1;
      const segmentProgress = progress * totalSegments;
      const segmentIndex = Math.floor(segmentProgress);
      const segmentT = segmentProgress - segmentIndex;
      const p1 = routePoints[segmentIndex];
      const p2 = routePoints[Math.min(segmentIndex + 1, totalSegments)];
      if (p1 && p2) {
        setDriverPos({
          lat: p1.lat + (p2.lat - p1.lat) * segmentT,
          lng: p1.lng + (p2.lng - p1.lng) * segmentT,
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <LiveMap
      height={350}
      points={[
        {
          kind: "mandi",
          lat: 19.8833,
          lng: 74.4833,
          label: `${DEMO_WINNER.mandiName} (Dest)`,
        },
        {
          kind: "pickup",
          lat: DEMO_FARMER.lat,
          lng: DEMO_FARMER.lng,
          label: DEMO_FARMER.village,
        },
        ...DEMO_POOL_PARTNERS.map((p) => ({
          kind: "partner" as const,
          lat: p.lat,
          lng: p.lng,
          label: p.village,
        })),
        {
          kind: "driver",
          lat: driverPos?.lat ?? 19.878,
          lng: driverPos?.lng ?? 74.46,
          label: "MH15 TR 1204 (In Transit)",
        },
      ]}
      route={routePoints}
    />
  );
}

/* ── KPIs computed from real demo data ── */
const POOL_UTIL = Math.round((DEMO_POOLED_TOTAL_KG / DEMO_POOL_VEHICLE.payloadKg) * 100);
const SOLO_FREIGHT = DEMO_ENR_RESULTS.find((r) => r.mandiId === DEMO_WINNER.mandiId)!.freightCost;
const POOL_FREIGHT = DEMO_WINNER.freightCost;
const FREIGHT_SAVINGS = SOLO_FREIGHT - POOL_FREIGHT;

function StatCard({
  label,
  value,
  icon: Icon,
  detail,
  detailColor = "text-muted-foreground",
}: {
  label: string;
  value: string;
  icon: any;
  detail: string;
  detailColor?: string;
}) {
  return (
    <Card className="border-accent shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <p className={`mt-4 text-sm ${detailColor}`}>{detail}</p>
      </CardContent>
    </Card>
  );
}

function CommandCenter() {
  return (
    <div className="min-h-screen bg-secondary/20">
      <BrandHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
              Kopargaon Logistics Command
            </Badge>
            <h1 className="text-3xl font-bold">Today&apos;s Dispatch Operations</h1>
            <p className="text-muted-foreground mt-1">
              Real-time overview of fleet matching, load aggregation and market routing.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground border px-3 py-1.5 rounded-full bg-background shadow-sm">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              Simulated Demo
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shadow-md hover:scale-105 transition-transform"
            >
              <Link to="/farmer">
                <PlusCircle className="mr-2 h-5 w-5" /> New AI Dispatch
              </Link>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Markets Analyzed"
            value={String(DEMO_ENR_RESULTS.length)}
            icon={BarChart3}
            detail="Multi-market ENR comparison per dispatch"
          />
          <StatCard
            label="Fleet Vehicles"
            value={String(VEHICLE_PROFILES.length)}
            icon={Truck}
            detail="Piaggio Ape to Tata 1613 (10T)"
          />
          <StatCard
            label="Pool Utilization"
            value={`${POOL_UTIL}%`}
            icon={Users}
            detail={`${DEMO_POOLED_TOTAL_KG} kg on ${DEMO_POOL_VEHICLE.name}`}
            detailColor="text-green-700"
          />
          <StatCard
            label="ENR Advantage"
            value={rupees(DEMO_INSIGHT.enrDifferenceRs)}
            icon={TrendingUp}
            detail="vs farmer's instinct (nearest mandi)"
            detailColor="text-green-700"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live fleet map */}
          <div className="lg:col-span-2">
            <Card className="border-accent shadow-sm overflow-hidden flex flex-col h-full">
              <CardHeader className="bg-background border-b pb-4">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Live Route Intelligence (CVRP)</span>
                  <Badge variant="outline">Simulated Fleet Telemetry</Badge>
                </CardTitle>
                <CardDescription>
                  Multi-stop pooled pickup → {DEMO_WINNER.mandiName}. 2-opt optimized stop
                  sequencing.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative bg-slate-50 min-h-[350px]">
                <AnimatedLiveMap />
              </CardContent>
            </Card>
          </div>

          {/* Active dispatches */}
          <div>
            <Card className="border-accent shadow-sm h-full flex flex-col">
              <CardHeader className="bg-background border-b pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Active Dispatches
                </CardTitle>
                <CardDescription>Loads matched by the ENR decision engine.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 flex-1 overflow-auto">
                {/* Primary demo dispatch */}
                <div className="p-4 border rounded-lg border-green-200 bg-green-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      In Transit
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">KY-NSK-10</span>
                  </div>
                  <h4 className="font-bold text-green-900">
                    10q Onion (Pooled · {DEMO_POOL_PARTNERS.length + 1} farmers)
                  </h4>
                  <p className="text-sm text-green-800/80 mb-3">
                    {DEMO_FARMER.village} → {DEMO_WINNER.mandiName}
                  </p>
                  <div className="flex justify-between text-sm items-center pt-3 border-t border-green-200">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Truck className="h-4 w-4" /> {DEMO_POOL_VEHICLE.name}
                    </span>
                    <span className="font-bold text-green-700">
                      ENR: {rupees(DEMO_WINNER.netPayout)}
                    </span>
                  </div>
                </div>

                {/* Secondary dispatch — perishable */}
                <div className="p-4 border rounded-lg bg-background">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-200 bg-amber-50"
                    >
                      Pending Match
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">KY-LSG-05</span>
                  </div>
                  <h4 className="font-bold">2.5q Tomatoes</h4>
                  <p className="text-sm text-muted-foreground mb-3">Rahata → Lasalgaon</p>
                  <div className="flex justify-between text-sm items-center pt-3 border-t">
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-4 w-4" /> Perishable — 72h
                    </span>
                    <span>Awaiting vehicle</span>
                  </div>
                </div>

                {/* Third dispatch */}
                <div className="p-4 border rounded-lg bg-background">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      Loading
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">KY-RAH-08</span>
                  </div>
                  <h4 className="font-bold">4q Wheat</h4>
                  <p className="text-sm text-muted-foreground mb-3">Kopargaon → Rahuri APMC</p>
                  <div className="flex justify-between text-sm items-center pt-3 border-t">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Truck className="h-4 w-4" /> Tata Ace Gold
                    </span>
                    <span>Pooling 2 farmers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
