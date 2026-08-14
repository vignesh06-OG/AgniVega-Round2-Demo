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

import { listAvailableLoads, acceptLoad, listMyTrips, updateTripStatus } from "@/lib/krishi/driver.functions";

export const Route = createFileRoute("/_authenticated/driver")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "driver" && context.user.role !== "admin") {
      toast.error("Unauthorized role access.");
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Driver Console — Smart Krishi-Yatra AI" },
    ],
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

  const activeTrip = trips?.find(t => t.status === "ACTIVE" || t.status === "PLANNED");

  const acceptMutation = useMutation({
    mutationFn: (shipmentId: string) => acceptLoadFn({ data: { shipmentId, vehicleId: null } }),
    onSuccess: () => {
      toast.success("Dispatch Accepted");
      queryClient.invalidateQueries({ queryKey: ["driver-loads"] });
      queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ tripId, status }: { tripId: string; status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED" }) =>
      updateStatusFn({ data: { tripId, status, proofLat: null, proofLng: null } }),
    onSuccess: () => {
      toast.success("Status Updated");
      queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    },
  });

  const [sosActive, setSosActive] = useState<{ active: boolean; time: string | null }>({ active: false, time: null });

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
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" /> Active Dispatch
                  </CardTitle>
                  <CardDescription className="mt-1">Trip ID: {activeTrip.id}</CardDescription>
                </div>
                <Badge variant={activeTrip.status === "ACTIVE" ? "default" : "secondary"}>
                  {activeTrip.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Destination</div>
                  <div className="font-semibold">{activeTrip.mandis.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Total Load</div>
                  <div className="font-semibold">{activeTrip.total_weight_kg} kg</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Distance</div>
                  <div className="font-semibold">{activeTrip.total_distance_km} km</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Pickups</div>
                  <div className="font-semibold">{activeTrip.trip_stops.length} points</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                {activeTrip.status === "PLANNED" && (
                  <Button 
                    className="flex-1" 
                    onClick={() => updateMutation.mutate({ tripId: activeTrip.id, status: "ACTIVE" })}
                    disabled={updateMutation.isPending}
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Start Trip
                  </Button>
                )}
                {activeTrip.status === "ACTIVE" && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    onClick={() => updateMutation.mutate({ tripId: activeTrip.id, status: "COMPLETED" })}
                    disabled={updateMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Arrived & Completed
                  </Button>
                )}
                <Button 
                  variant={sosActive.active ? "destructive" : "outline"} 
                  className="flex-1 transition-all"
                  onClick={handleSos}
                >
                  <AlertCircle className="w-4 h-4 mr-2" /> 
                  {sosActive.active ? `SOS Active (${sosActive.time})` : "SOS Alert"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
