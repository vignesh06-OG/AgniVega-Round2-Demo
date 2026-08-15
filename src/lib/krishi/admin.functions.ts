import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TICKETS = [
  {
    id: "TKT-1234",
    subject: "Payment delayed",
    status: "OPEN",
    user: "FARMER-123",
    priority: "HIGH",
  },
  {
    id: "TKT-5678",
    subject: "Driver didn't arrive",
    status: "RESOLVED",
    user: "FARMER-456",
    priority: "URGENT",
  },
];

const USERS = [
  { id: "FARMER-123", name: "Ramesh Patil", role: "farmer", status: "ACTIVE" },
  { id: "DRIVER-789", name: "Suresh Pawar", role: "driver", status: "BANNED" },
];

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  return {
    shipments: [],
    trips: [],
    kyc: [
      {
        id: "kyc-1",
        driver_id: "DRV-999",
        drivers: { full_name: "Ganesh Kadam" },
        doc_type: "Aadhar",
        status: "PENDING",
      },
    ],
    fallback: [],
    audit: [],
    config: { rate_percent: 3.5, diesel_price: 90, petrol_price: 105 },
    prices: [],
    tickets: TICKETS,
    users: USERS,
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

export const resolveTicket = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ ticketId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const t = TICKETS.find((x) => x.id === data.ticketId);
    if (t) t.status = "RESOLVED";
    return { ok: true };
  });

export const toggleUserStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ userId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const u = USERS.find((x) => x.id === data.userId);
    if (u) {
      u.status = u.status === "ACTIVE" ? "BANNED" : "ACTIVE";
    }
    return { ok: true };
  });
