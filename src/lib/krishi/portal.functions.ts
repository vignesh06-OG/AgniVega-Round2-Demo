import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* In-Memory Mock Store for Prototype */
/* ------------------------------------------------------------------ */

let mockProfile = {
  id: "dummy-user-1",
  full_name: "Mock Farmer",
  phone: "+91 9876543210",
  language: "en",
  village: "Kopargaon Rural",
  dpdp_consent: true,
};

let mockShipments: any[] = [];

/* ------------------------------------------------------------------ */
/* Session + roles                                                      */
/* ------------------------------------------------------------------ */

export const getMySession = createServerFn({ method: "GET" }).handler(async () => {
  return {
    userId: "dummy-user-1",
    profile: mockProfile,
    roles: ["farmer"], // Defaults to farmer in mock
  };
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        full_name: z.string().min(1).max(120),
        phone: z.string().max(20).nullable().default(null),
        language: z.enum(["mr", "hi", "en", "es", "fr", "zh", "ar"]).catch("en" as any),
        village: z.string().max(120).nullable().default(null),
        dpdp_consent: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    mockProfile = { ...mockProfile, ...data } as any;
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* STEP 2 — Confirm. The only place a shipment is written.              */
/* ------------------------------------------------------------------ */

const confirmSchema = z.object({
  cropId: z.string().uuid().or(z.string()),
  mandiId: z.string().uuid().or(z.string()),
  villageName: z.string().min(1).max(120),
  lat: z.number(),
  lng: z.number(),
  weightKg: z.number().min(1).max(20000),
  distanceKm: z.number().min(0),
  mode: z.enum(["POOLED", "SOLO"]),
  grossPayout: z.number(),
  freightShare: z.number(),
  platformFee: z.number(),
  netPayout: z.number(),
  emergency: z.boolean().default(false),
  spoilageDeadlineIso: z.string(),
});

export const confirmShipment = createServerFn({ method: "POST" })
  .validator((input: unknown) => confirmSchema.parse(input))
  .handler(async ({ data }) => {
    const shipment = {
      id: "mock-shipment-" + Math.random().toString(36).substring(2, 9),
      farmer_id: "dummy-user-1",
      ...data,
      status: data.mode === "POOLED" ? "POOLED" : "SOLO_CONFIRMED",
      created_at: new Date().toISOString(),
    };
    mockShipments.unshift(shipment);

    const token = `KY-${shipment.id.slice(0, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return {
      shipment,
      handoverToken: token,
      poolId: data.mode === "POOLED" ? "mock-pool-1" : null,
    };
  });

export const listMyShipments = createServerFn({ method: "GET" }).handler(async () => {
  return mockShipments;
});

export const cancelShipment = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    mockShipments = mockShipments.map((s) =>
      s.id === data.id ? { ...s, status: "CANCELLED" } : s,
    );
    return { ok: true };
  });
