import { PLATFORM as BASE, type VehicleProfile } from "./constants";

export const PLATFORM = { ...BASE, poolRadiusKm: 12 };

export interface VehicleRow {
  slug: string;
  name: string;
  payload_kg: number | string;
  mileage_kmpl: number | string;
  base_cost_per_km: number | string;
  toll_allowance_per_km: number | string;
  fuel: string;
}

export function toVehicleProfile(row: VehicleRow): VehicleProfile {
  return {
    slug: row.slug,
    name: row.name,
    payloadKg: Number(row.payload_kg),
    mileageKmpl: Number(row.mileage_kmpl),
    baseCostPerKm: Number(row.base_cost_per_km),
    tollAllowancePerKm: Number(row.toll_allowance_per_km),
    fuel: row.fuel === "petrol" ? "petrol" : "diesel",
  };
}

/** Smallest vehicle in the live fleet catalogue that can carry the payload. */
export function recommendVehicleFromTypes(
  vehicles: VehicleProfile[],
  weightKg: number,
): VehicleProfile {
  const sorted = [...vehicles].sort((a, b) => a.payloadKg - b.payloadKg);
  return sorted.find((v) => v.payloadKg >= weightKg) ?? sorted[sorted.length - 1]!;
}
