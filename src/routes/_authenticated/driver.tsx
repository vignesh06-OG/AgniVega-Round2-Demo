import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Truck, MapPin, Package, CheckCircle, Navigation, AlertCircle } from "lucide-react";

import { BrandHeader } from "@/components/agnivega/BrandHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  listAvailableLoads,
  acceptLoad,
  listMyTrips,
  updateTripStatus,
} from "@/lib/krishi/driver.functions";

export const Route = createFileRoute("/_authenticated/driver")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "driver" && context.user.role !== "admin") {
      toast.error("Unauthorized role access.");
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [{ title: "Driver Console — Smart Krishi-Yatra AI" }],
  }),
  component: DriverDashboard,
});

function DriverDashboard() {
  const queryClient = useQueryClient();
  const getLoads = useServerFn(listAvailableLoads);
  const getTrips = useServerFn(listMyTrips);
  const acceptLoadFn = useServerFn(acceptLoad);
  const updateStatusFn = useServerFn(updateTripStatus);

  const { data: loadsData } = useQuery({
    queryKey: ["driver-loads"],
    queryFn: () => getLoads(),
  });

  const { data: trips } = useQuery({
    queryKey: ["driver-trips"],
    queryFn: () => getTrips(),
  });

  const activeTrip = trips?.find((t) => t.status === "ACTIVE" || t.status === "PLANNED");

  const acceptMutation = useMutation({
    mutationFn: (shipmentId: string) => acceptLoadFn({ data: { shipmentId, vehicleId: null } }),
    onSuccess: () => {
      toast.success("Dispatch Accepted");
      queryClient.invalidateQueries({ queryKey: ["driver-loads"] });
      queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      tripId,
      status,
    }: {
      tripId: string;
      status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    }) => updateStatusFn({ data: { tripId, status, proofLat: null, proofLng: null } }),
    onSuccess: () => {
      toast.success("Status Updated");
      queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    },
  });

  const [sosActive, setSosActive] = useState<{ active: boolean; time: string | null }>({
    active: false,
    time: null,
  });

  const handleSos = () => {
    if (!sosActive.active) {
      const now = new Date().toLocaleTimeString();
      setSosActive({ active: true, time: now });
      toast.error(`SOS Alert Triggered at ${now}! Fleet Manager Notified.`);
    } else {
      setSosActive({ active: false, time: null });
      toast.success("SOS Alert Cancelled.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <BrandHeader active="Driver" />
      <main className="mx-auto max-w-4xl p-4 space-y-6">
        {activeTrip ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Active Dispatch</h1>
            <Card className="border-primary/20 shadow-xl overflow-hidden">
              <div className="bg-slate-900 text-white p-6 relative">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Truck className="h-32 w-32 -mt-4 -mr-4" />
                </div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold">MH-15-XY-1234</h2>
                    <p className="text-slate-300 mt-1 flex items-center gap-2">
                      <Truck className="h-4 w-4" /> Tata Ace Gold
                    </p>
                  </div>
                  <Badge
                    variant={activeTrip.status === "ACTIVE" ? "default" : "secondary"}
                    className="bg-primary/20 text-primary-foreground text-sm py-1 px-3"
                  >
                    {activeTrip.status}
                  </Badge>
                </div>
                <div className="mt-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Capacity Utilized</span>
                    <span className="font-bold">
                      {Math.round((activeTrip.total_weight_kg / 750) * 100)}% (
                      {activeTrip.total_weight_kg} / 750 kg)
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${activeTrip.total_weight_kg > 750 ? "bg-red-500" : "bg-primary"}`}
                      style={{
                        width: `${Math.min(100, (activeTrip.total_weight_kg / 750) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <CardContent className="pt-6 space-y-6 bg-card">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">
                      Destination
                    </div>
                    <div className="font-semibold text-lg">{activeTrip.mandis.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">
                      Total Load
                    </div>
                    <div className="font-semibold text-lg">{activeTrip.total_weight_kg} kg</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">
                      Distance
                    </div>
                    <div className="font-semibold text-lg">{activeTrip.total_distance_km} km</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">
                      Pickups
                    </div>
                    <div className="font-semibold text-lg">
                      {activeTrip.trip_stops.length} points
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Route Map</h3>
                  <div className="space-y-4">
                    {activeTrip.trip_stops.map((stop: any, idx: number) => (
                      <div key={stop.id} className="flex gap-4 items-start">
                        <div className="mt-1 flex flex-col items-center">
                          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          {idx < activeTrip.trip_stops.length - 1 && (
                            <div className="w-0.5 h-full bg-border my-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium text-base">Pickup {idx + 1}</p>
                          <p className="text-muted-foreground text-sm">
                            {stop.quantity_kg} kg load
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-4 items-start">
                      <div className="mt-1">
                        <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold border border-green-300">
                          <MapPin className="h-3 w-3" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-base">{activeTrip.mandis.name}</p>
                        <p className="text-muted-foreground text-sm">Final Destination</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  {activeTrip.status === "PLANNED" && (
                    <Button
                      className="flex-1 py-6 text-lg"
                      onClick={() =>
                        updateMutation.mutate({ tripId: activeTrip.id, status: "ACTIVE" })
                      }
                      disabled={updateMutation.isPending}
                    >
                      <Navigation className="w-5 h-5 mr-2" /> Start Trip
                    </Button>
                  )}
                  {activeTrip.status === "ACTIVE" && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 py-6 text-lg"
                      onClick={() =>
                        updateMutation.mutate({ tripId: activeTrip.id, status: "COMPLETED" })
                      }
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" /> Arrived & Completed
                    </Button>
                  )}
                  <Button
                    variant={sosActive.active ? "destructive" : "outline"}
                    className="flex-1 transition-all py-6 text-lg"
                    onClick={handleSos}
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {sosActive.active ? `SOS Active (${sosActive.time})` : "SOS Alert"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Available Dispatches</h2>
            {loadsData?.loads?.length === 0 ? (
              <p className="text-muted-foreground">No available loads right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {loadsData?.loads?.map((load) => (
                  <Card key={load.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{load.village_name}</CardTitle>
                        {load.emergency && <Badge variant="destructive">Urgent</Badge>}
                      </div>
                      <CardDescription>To {load.mandis.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{load.weight_kg} kg</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{load.distance_km} km</span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => acceptMutation.mutate(load.id)}
                        disabled={acceptMutation.isPending}
                      >
                        Accept Dispatch
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
