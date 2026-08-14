import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type BookingState =
  | "DRAFT"
  | "ANALYSIS"
  | "VEHICLE_SELECTED"
  | "BOOKING_HELD"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "DISPATCH_SCHEDULED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED_BY_FARMER"
  | "CANCELLED_PAYMENT_TIMEOUT"
  | "CANCELLED_BY_OPERATOR"
  | "EXPIRED";

export interface BookingRecord {
  bookingId: string;
  dispatchId?: string;
  farmerId: string;
  crop: string;
  quantityKg: number;
  quality: any;
  destination: string;
  vehicleAllocations: { vehicleId: string; quantityKg: number }[];
  platformFee: number;
  expectedNetRealization: number;
  status: BookingState;
  createdAt: number;
  expiresAt: number | null;
}

// In-memory mock database for the hackathon
const BOOKINGS: Record<string, BookingRecord> = {};

// Mock Vehicle DB for capacity validation
export const VEHICLE_CAPACITIES: Record<string, { total: number; booked: number }> = {
  "TATA-ACE-01": { total: 750, booked: 400 },
  "MAHINDRA-PICKUP-02": { total: 1500, booked: 1200 },
  "EICHER-1110-03": { total: 7000, booked: 5000 },
  "TATA-1109-04": { total: 7000, booked: 0 },
  "BHARATBENZ-1215-05": { total: 12000, booked: 2000 },
  "PIAGGIO-APE-06": { total: 500, booked: 450 },
};

export const getVehicleCapacity = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ vehicleId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    // If not found in mock, return a large default so it doesn't block demo arbitrarily
    return VEHICLE_CAPACITIES[data.vehicleId] || { total: 2500, booked: 0 };
  });

function expireOldBookings() {
  const now = Date.now();
  Object.values(BOOKINGS).forEach((b) => {
    if (b.status === "BOOKING_HELD" && b.expiresAt && now > b.expiresAt) {
      b.status = "CANCELLED_PAYMENT_TIMEOUT";
      // Release capacity
      b.vehicleAllocations.forEach(alloc => {
        if (VEHICLE_CAPACITIES[alloc.vehicleId]) {
          VEHICLE_CAPACITIES[alloc.vehicleId].booked -= alloc.quantityKg;
        }
      });
    }
  });
}

export const createBookingHold = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        farmerId: z.string(),
        crop: z.string(),
        quantityKg: z.number(),
        quality: z.any(),
        destination: z.string(),
        vehicleAllocations: z.array(z.object({ vehicleId: z.string(), quantityKg: z.number() })),
        platformFee: z.number(),
        expectedNetRealization: z.number(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    expireOldBookings();

    // Verify Capacity for all allocations
    for (const alloc of data.vehicleAllocations) {
      const cap = VEHICLE_CAPACITIES[alloc.vehicleId] || { total: 2500, booked: 0 };
      const remaining = cap.total - cap.booked;
      if (alloc.quantityKg > remaining) {
        throw new Error(`Overbooking prevented. Only ${remaining.toLocaleString()} kg capacity remains on vehicle ${alloc.vehicleId}.`);
      }
    }

    // Reserve Capacity
    for (const alloc of data.vehicleAllocations) {
      if (VEHICLE_CAPACITIES[alloc.vehicleId]) {
        VEHICLE_CAPACITIES[alloc.vehicleId].booked += alloc.quantityKg;
      }
    }

    const bookingId = `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const dispatchId = `DSP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const record: BookingRecord = {
      bookingId,
      dispatchId,
      farmerId: data.farmerId,
      crop: data.crop,
      quantityKg: data.quantityKg,
      quality: data.quality,
      destination: data.destination,
      vehicleAllocations: data.vehicleAllocations,
      platformFee: data.platformFee,
      expectedNetRealization: data.expectedNetRealization,
      status: "BOOKING_HELD",
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
    };

    BOOKINGS[bookingId] = record;
    return record;
  });

export const getBooking = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ bookingId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    expireOldBookings();
    return BOOKINGS[data.bookingId] || null;
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ bookingId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const record = BOOKINGS[data.bookingId];
    if (record) {
      if (record.status !== "CANCELLED_BY_FARMER" && record.status !== "CANCELLED_PAYMENT_TIMEOUT" && record.status !== "EXPIRED") {
        // Release capacity
        record.vehicleAllocations.forEach(alloc => {
          if (VEHICLE_CAPACITIES[alloc.vehicleId]) {
            VEHICLE_CAPACITIES[alloc.vehicleId].booked -= alloc.quantityKg;
          }
        });
      }
      record.status = "CANCELLED_BY_FARMER";
      return record;
    }
    throw new Error("Booking not found");
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ bookingId: z.string(), paymentMethod: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    expireOldBookings();
    const record = BOOKINGS[data.bookingId];
    
    if (!record) throw new Error("Booking not found");
    if (record.status === "CANCELLED_PAYMENT_TIMEOUT") {
      throw new Error("Booking expired due to payment timeout");
    }

    record.status = "CONFIRMED";
    record.expiresAt = null; // No longer expires
    return record;
  });
