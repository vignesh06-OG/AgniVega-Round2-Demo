import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getDriverProfile = createServerFn({ method: "GET" }).handler(async () => {
  return {
    driver: {
      id: "mock-driver-1",
      full_name: "Mock Driver",
      kyc_status: "approved",
      radius_km: 40,
      home_lat: 19.8,
      home_lng: 74.4,
      rejection_reason: null as string | null,
    },
    kyc: [{ status: "approved" }],
    vehicles: [
      { id: "mock-vehicle-1", plate_number: "MH-12-AB-1234", vehicle_types: { name: "Pickup" } },
    ],
  };
});

export const upsertDriverProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(120),
        phone: z.string().min(6).max(20),
        license_number: z.string().min(4).max(40),
        home_lat: z.number(),
        home_lng: z.number(),
        radius_km: z.number().min(1).max(200),
        night_mode: z.boolean(),
      })
      .parse(input),
  )
  .handler(async () => {
    return { id: "mock-driver-1" };
  });

import { DEMO_ENR_RESULTS, DEMO_POOL_PARTNERS, DEMO_WINNER } from "./canonical-demo";

export const listAvailableLoads = createServerFn({ method: "GET" }).handler(async () => {
  return {
    blocked: false,
    reason: null,
    loads: [
      {
        id: "load-1",
        freight_share: DEMO_WINNER.freightCost,
        distance_km: DEMO_WINNER.distanceKm,
        weight_kg: 1000,
        village_name: "Pohegaon",
        crops: { name_en: "Onion" },
        mandis: { name: DEMO_WINNER.mandiName },
        emergency: true,
      },
      ...DEMO_POOL_PARTNERS.map((p, i) => ({
        id: `load-pool-${i}`,
        freight_share: Math.round(DEMO_WINNER.freightCost * (p.weightKg / 1000)),
        distance_km: DEMO_WINNER.distanceKm + i * 1.2,
        weight_kg: p.weightKg,
        village_name: p.village,
        crops: { name_en: "Onion" },
        mandis: { name: DEMO_WINNER.mandiName },
        emergency: false,
      })),
    ],
  };
});

export const acceptLoad = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        shipmentId: z.string().uuid().or(z.string()),
        vehicleId: z.string().uuid().or(z.string()).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async () => {
    return { id: "mock-trip-1", status: "PLANNED" };
  });

export const listMyTrips = createServerFn({ method: "GET" }).handler(async () => {
  return [
    {
      id: "trip-1",
      mandis: { name: DEMO_WINNER.mandiName },
      total_weight_kg: 1000 + DEMO_POOL_PARTNERS.reduce((a, p) => a + p.weightKg, 0),
      total_distance_km: DEMO_WINNER.distanceKm,
      trip_stops: [{}, {}, {}, {}], // 1 pickup + 3 partners
      status: "ACTIVE",
    },
  ];
});

export const updateTripStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        tripId: z.string().uuid().or(z.string()),
        status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]),
        proofLat: z.number().nullable().default(null),
        proofLng: z.number().nullable().default(null),
      })
      .parse(input),
  )
  .handler(async () => {
    return { ok: true };
  });

export const redeemHandoverToken = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ token: z.string().min(6).max(64) }).parse(input))
  .handler(async () => {
    return { ok: true, shipmentId: "mock-shipment-1" };
  });
