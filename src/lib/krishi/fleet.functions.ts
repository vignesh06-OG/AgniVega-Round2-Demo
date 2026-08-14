import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DEMO_WINNER, DEMO_POOL_PARTNERS } from "./canonical-demo";

export const getMyFleet = createServerFn({ method: "GET" }).handler(async () => {
  return {
    company: { id: "mock-company-1", name: "Mock Fleet Operator" },
    vehicles: [
      {
        id: "veh-1",
        registration: "MH-15-DC-9876",
        vehicle_types: { name: "Tata 407" },
        status: "available",
        odometer_km: 45000,
        axle_health: "good",
      },
      {
        id: "veh-2",
        registration: "MH-15-XY-1234",
        vehicle_types: { name: "Bolero Pik-Up" },
        status: "in_transit",
        odometer_km: 112000,
        axle_health: "watch",
      },
    ] as any[],
    drivers: [
      {
        id: "drv-1",
        full_name: "Suresh Patil",
        phone: "+91 9876543210",
        kyc_status: "approved",
      },
      {
        id: "drv-2",
        full_name: "Ramesh Pawar",
        phone: "+91 8765432109",
        kyc_status: "approved",
      },
    ],
    trips: [
      {
        id: "trip-1",
        status: "ACTIVE",
        total_distance_km: DEMO_WINNER.distanceKm,
        total_weight_kg: 1000 + DEMO_POOL_PARTNERS.reduce((a, p) => a + p.weightKg, 0),
        gross_freight: DEMO_WINNER.freightCost * 1.5, // Total truck freight
        driver: { full_name: "Suresh Patil" },
        vehicle: { registration: "MH-15-XY-1234" },
      },
    ],
    payouts: [
      {
        id: "pay-1",
        amount_inr: Math.round(DEMO_WINNER.freightCost * 1.5), // Total truck freight
        commission: Math.round(DEMO_WINNER.freightCost * 1.5 * 0.05), // 5% fleet commission
        net_amount: Math.round(DEMO_WINNER.freightCost * 1.5 * 0.95),
        status: "PAID",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ] as any[],
  };
});

export const registerFleet = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        name: z.string().min(2).max(120),
        tax_id: z.string().min(1).max(40),
        contact_phone: z.string().max(20).nullable().default(null),
        base_taluka: z.string().max(80).nullable().default(null),
        geofence_radius_km: z.number().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return { id: "mock-company-1", ...data };
  });

export const addVehicle = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        companyId: z.string().uuid().or(z.string()).nullable().default(null),
        vehicleTypeId: z.string().uuid().or(z.string()),
        registration: z.string().min(4).max(20),
        odometerKm: z.number().min(0),
        observedKmpl: z.number().min(1).max(60),
        axleHealth: z.enum(["good", "watch", "service_due"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return { id: "mock-vehicle-1", ...data };
  });

export const logMaintenance = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        vehicleId: z.string().uuid().or(z.string()),
        note: z.string().min(2).max(400),
        odometerKm: z.number().min(0),
        cost: z.number().min(0),
      })
      .parse(input),
  )
  .handler(async () => {
    return { ok: true };
  });
