import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  return {
    shipments: [],
    trips: [],
    kyc: [],
    fallback: [],
    audit: [],
    config: { rate_percent: 3.5, diesel_price: 90, petrol_price: 105 },
    prices: [],
  };
});

export const reviewKyc = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        driverId: z.string().uuid().or(z.string()),
        decision: z.enum(["approved", "rejected"]),
        reason: z.string().max(300).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async () => {
    return { ok: true };
  });

export const updateCommission = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        ratePercent: z.number().min(3).max(5),
        dieselPrice: z.number().min(40).max(250),
        petrolPrice: z.number().min(40).max(300),
      })
      .parse(input),
  )
  .handler(async () => {
    return { ok: true };
  });

export const overrideMandiPrice = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({ id: z.string().uuid().or(z.string()), pricePerKg: z.number().min(0.5).max(1000) })
      .parse(input),
  )
  .handler(async () => {
    return { ok: true };
  });
