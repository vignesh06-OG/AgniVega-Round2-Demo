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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
                    <Button size="sm" variant="outline" onClick={() => service.mutate(v.id)}>
                      Log service
                    </Button>
                  </div>
                ))}
                {fleet.data.vehicles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No vehicles yet.</p>
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
