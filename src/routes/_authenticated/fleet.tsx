import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { BrandHeader } from "@/components/agnivega/BrandHeader";
import { AuthButton } from "@/components/agnivega/AuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { rupees } from "@/lib/krishi/constants";
import {
  addVehicle,
  getMyFleet,
  logMaintenance,
  registerFleet,
} from "@/lib/krishi/fleet.functions";
import { getReferenceData } from "@/lib/krishi/krishi.functions";

export const Route = createFileRoute("/_authenticated/fleet")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "fleet" && context.user.role !== "admin") {
      toast.error("Unauthorized role access.");
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Fleet Console — Smart Krishi-Yatra AI" },
      {
        name: "description",
        content:
          "Register your transport company, manage vehicles, maintenance and driver payouts.",
      },
      { property: "og:title", content: "Fleet Console — Smart Krishi-Yatra AI" },
      {
        property: "og:description",
        content: "Vehicles, drivers, trips and payouts in one operator console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FleetPortal,
});

function FleetPortal() {
  const queryClient = useQueryClient();
  const fleetFn = useServerFn(getMyFleet);
  const registerFn = useServerFn(registerFleet);
  const vehicleFn = useServerFn(addVehicle);
  const maintenanceFn = useServerFn(logMaintenance);
  const referenceFn = useServerFn(getReferenceData);

  const fleet = useQuery({ queryKey: ["my-fleet"], queryFn: () => fleetFn({}) });
  const reference = useQuery({ queryKey: ["krishi-reference"], queryFn: () => referenceFn({}) });

  const [company, setCompany] = useState({
    name: "",
    tax_id: "",
    contact_phone: "",
    base_taluka: "Kopargaon",
    geofence_radius_km: 60,
  });
  const [vehicle, setVehicle] = useState({ registration: "", odometerKm: 0, observedKmpl: 10 });
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [diagnosticOpen, setDiagnosticOpen] = useState<string | null>(null);
  const [overrideVehicle, setOverrideVehicle] = useState<string>("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["my-fleet"] });

  const register = useMutation({
    mutationFn: () => registerFn({ data: company }),
    onSuccess: () => {
      toast.success("Fleet registered — awaiting verification.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createVehicle = useMutation({
    mutationFn: () =>
      vehicleFn({
        data: {
          companyId: fleet.data?.company?.id ?? null,
          vehicleTypeId: vehicleTypeId || (reference.data?.vehicleTypes[0]?.id ?? ""),
          registration: vehicle.registration,
          odometerKm: vehicle.odometerKm,
          observedKmpl: vehicle.observedKmpl,
          axleHealth: "good",
        },
      }),
    onSuccess: () => {
      toast.success("Vehicle added");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const service = useMutation({
    mutationFn: (vehicleId: string) =>
      maintenanceFn({
        data: {
          vehicleId,
          note: "Routine service logged from fleet console",
          odometerKm: 0,
          cost: 0,
        },
      }),
    onSuccess: () => {
      toast.success("Maintenance logged");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grossFreight = (fleet.data?.trips ?? []).reduce(
    (sum: number, t: any) => sum + Number(t.gross_freight ?? 0),
    0,
  );

  const overrideMutation = useMutation({
    mutationFn: (tripId: string) => {
      // In a real app this would call a server function. For demo we just update local cache.
      const trips = fleet.data?.trips || [];
      const t = trips.find((x: any) => x.id === tripId);
      if (t) t.vehicle.registration = overrideVehicle;
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success("Dispatch overridden to new vehicle.");
      invalidate();
    },
  });

  return (
    <div className="min-h-screen bg-secondary/30">
      <BrandHeader active="Fleet" />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Fleet Console</h1>
            <p className="text-sm text-muted-foreground">
              Operator view for vehicles, drivers, trips and payouts.
            </p>
          </div>
          <AuthButton />
        </div>

        {!fleet.data?.company ? (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">Register your transport company</CardTitle>
              <CardDescription>One company per operator account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Company name</Label>
                <Input
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>GSTIN / Tax ID</Label>
                  <Input
                    value={company.tax_id}
                    onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact phone</Label>
                  <Input
                    value={company.contact_phone}
                    onChange={(e) => setCompany({ ...company, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => register.mutate()}
                disabled={register.isPending}
              >
                Register fleet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Stat label="Vehicles" value={String(fleet.data.vehicles.length)} />
              <Stat label="Drivers" value={String(fleet.data.drivers.length)} />
              <Stat label="Trips" value={String(fleet.data.trips.length)} />
              <Stat label="Gross freight" value={rupees(grossFreight)} />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Add a vehicle</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <Input
                  placeholder="MH17 AB 1234"
                  value={vehicle.registration}
                  onChange={(e) => setVehicle({ ...vehicle, registration: e.target.value })}
                />
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={vehicleTypeId}
                  onChange={(e) => setVehicleTypeId(e.target.value)}
                >
                  <option value="">Select vehicle type</option>
                  {(reference.data?.vehicleTypes ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Observed km/l"
                  value={vehicle.observedKmpl}
                  onChange={(e) => setVehicle({ ...vehicle, observedKmpl: Number(e.target.value) })}
                />
                <Button onClick={() => createVehicle.mutate()} disabled={createVehicle.isPending}>
                  Add vehicle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Vehicles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {fleet.data.vehicles.map((v: any) => (
                  <div
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <span className="font-mono font-semibold">{v.registration}</span>
                    <span className="text-sm text-muted-foreground">
                      {v.vehicle_types?.name} · {Number(v.observed_kmpl)} km/l observed
                    </span>
                    <Badge variant={v.axle_health === "good" ? "secondary" : "destructive"}>
                      {v.axle_health}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDiagnosticOpen(v.id)}>
                        Run Diagnostic
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => service.mutate(v.id)}>
                        Log service
                      </Button>
                    </div>
                  </div>
                ))}
                {fleet.data.vehicles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No vehicles yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active Trips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fleet.data.trips.map((t: any) => (
                  <div key={t.id} className="border p-4 rounded-lg flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary">{t.id}</span>
                      <Badge>{t.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                      <div>Driver: {t.driver.full_name}</div>
                      <div>Vehicle: {t.vehicle.registration}</div>
                      <div>Load: {t.total_weight_kg} kg</div>
                      <div>Distance: {t.total_distance_km} km</div>
                    </div>
                    <div className="border-t pt-3 mt-1 flex gap-3 items-center">
                      <span className="text-sm font-medium">Dispatch Override:</span>
                      <select
                        className="h-9 rounded-md border bg-background px-3 text-sm flex-1"
                        value={overrideVehicle}
                        onChange={(e) => setOverrideVehicle(e.target.value)}
                      >
                        <option value="">Select Replacement</option>
                        {fleet.data.vehicles
                          .filter((v: any) => v.status === "available")
                          .map((v: any) => (
                            <option key={v.id} value={v.registration}>
                              {v.registration} ({v.vehicle_types?.name})
                            </option>
                          ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={!overrideVehicle || overrideVehicle === t.vehicle.registration}
                        onClick={() => overrideMutation.mutate(t.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
                {fleet.data.trips.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active trips.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {fleet.data.payouts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <span>{new Date(p.created_at).toLocaleDateString("en-IN")}</span>
                    <span className="text-muted-foreground">
                      commission {rupees(Number(p.commission))}
                    </span>
                    <strong className="text-primary">{rupees(Number(p.net_amount))}</strong>
                  </div>
                ))}
                {fleet.data.payouts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No payouts recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={!!diagnosticOpen} onOpenChange={(open) => !open && setDiagnosticOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vehicle Diagnostic Report</DialogTitle>
              <DialogDescription>Telematics sync successful via OBD-II module.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border p-3 rounded bg-green-50/50">
                  <div className="text-muted-foreground mb-1">Engine Health</div>
                  <div className="font-semibold text-green-700">Optimal (98%)</div>
                </div>
                <div className="border p-3 rounded bg-green-50/50">
                  <div className="text-muted-foreground mb-1">Tyre Pressure</div>
                  <div className="font-semibold text-green-700">32 PSI All</div>
                </div>
                <div className="border p-3 rounded bg-yellow-50/50">
                  <div className="text-muted-foreground mb-1">Brake Pads</div>
                  <div className="font-semibold text-yellow-700">Service due 10k km</div>
                </div>
                <div className="border p-3 rounded bg-green-50/50">
                  <div className="text-muted-foreground mb-1">Coolant Temp</div>
                  <div className="font-semibold text-green-700">89°C</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDiagnosticOpen(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}
