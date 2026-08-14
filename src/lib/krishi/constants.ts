/**
 * Real-world fuel and freight constants for the Nashik / Ahmednagar belt.
 * These mirror `backend/app/config.py` in the reference repository so the
 * TypeScript engine and the FastAPI engine always agree.
 */
export const FUEL_BASELINE = {
  /** Nashik belt retail diesel rate, rupees per litre. */
  diesel: 99.07,
  /** Nashik belt retail petrol rate, rupees per litre. */
  petrol: 112.44,
} as const;

export const PLATFORM = {
  minCommissionPercent: 3,
  maxCommissionPercent: 5,
  defaultCommissionPercent: 3,
  /** Hard cap on pooled detour time, in minutes. */
  maxDetourMinutes: 15,
  /** Target payload utilisation before a pool is considered efficient. */
  targetUtilisation: 0.85,
  /** Average rural convoy speed used for ETA maths, km/h. */
  averageSpeedKmph: 34,
  /** Diesel CO2 factor, kg CO2 per litre burnt. */
  co2PerLitre: 2.68,
} as const;

export type FuelKind = "diesel" | "petrol";

export interface VehicleProfile {
  slug: string;
  name: string;
  payloadKg: number;
  mileageKmpl: number;
  baseCostPerKm: number;
  tollAllowancePerKm: number;
  fuel: FuelKind;
}

/** Fallback vehicle catalogue used when the database is unreachable. */
export const VEHICLE_PROFILES: VehicleProfile[] = [
  {
    slug: "piaggio-ape",
    name: "Piaggio Ape Xtra LDX",
    payloadKg: 750,
    mileageKmpl: 28,
    baseCostPerKm: 4.2,
    tollAllowancePerKm: 0.4,
    fuel: "diesel",
  },
  {
    slug: "tata-ace",
    name: "Tata Ace Gold",
    payloadKg: 1000,
    mileageKmpl: 19,
    baseCostPerKm: 6.1,
    tollAllowancePerKm: 0.8,
    fuel: "diesel",
  },
  {
    slug: "bolero-pickup",
    name: "Mahindra Bolero Pickup",
    payloadKg: 1700,
    mileageKmpl: 15,
    baseCostPerKm: 7.4,
    tollAllowancePerKm: 1.2,
    fuel: "diesel",
  },
  {
    slug: "tata-407",
    name: "Tata LPT 407",
    payloadKg: 2500,
    mileageKmpl: 10,
    baseCostPerKm: 9.8,
    tollAllowancePerKm: 1.6,
    fuel: "diesel",
  },
  {
    slug: "eicher-1110",
    name: "Eicher Pro 1110",
    payloadKg: 7500,
    mileageKmpl: 7,
    baseCostPerKm: 14.5,
    tollAllowancePerKm: 2.4,
    fuel: "diesel",
  },
  {
    slug: "tata-1613",
    name: "Tata LPT 1613 (10T)",
    payloadKg: 10000,
    mileageKmpl: 5,
    baseCostPerKm: 19.2,
    tollAllowancePerKm: 3.2,
    fuel: "diesel",
  },
];

export function vehicleBySlug(slug: string): VehicleProfile {
  return VEHICLE_PROFILES.find((v) => v.slug === slug) ?? VEHICLE_PROFILES[2]!;
}

/** Smallest vehicle that can legally carry the given payload. */
export function smallestVehicleFor(weightKg: number): VehicleProfile {
  const sorted = [...VEHICLE_PROFILES].sort((a, b) => a.payloadKg - b.payloadKg);
  return sorted.find((v) => v.payloadKg >= weightKg) ?? sorted[sorted.length - 1]!;
}

export const UNITS = {
  kg: { label: "Kilogram (kg)", toKg: 1 },
  quintal: { label: "Quintal (100 kg)", toKg: 100 },
  tonne: { label: "Metric Tonne (1000 kg)", toKg: 1000 },
  crate: { label: "Standard Crate", toKg: 25 },
} as const;
export type UnitKey = keyof typeof UNITS;

export function toKilograms(value: number, unit: UnitKey, crateKg = 25): number {
  if (unit === "crate") return value * crateKg;
  return value * UNITS[unit].toKg;
}

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function rupees(value: number): string {
  return INR.format(Math.round(value));
}
