import { PLATFORM as BASE, type VehicleProfile } from "./constants";

export const PLATFORM = { ...BASE, poolRadiusKm: 12 };

export interface VehicleRow {
  id?: string;
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
    id: row.id || row.slug,
    slug: row.slug,
    name: row.name,
    payloadKg: Number(row.payload_kg),
    mileageKmpl: Number(row.mileage_kmpl),
    baseCostPerKm: Number(row.base_cost_per_km),
    tollAllowancePerKm: Number(row.toll_allowance_per_km),
    fuel: row.fuel === "petrol" ? "petrol" : "diesel",
  };
}

export interface VehicleAllocation {
  vehicle: VehicleProfile;
  allocatedKg: number;
}

/** 
 * Recommends one or more vehicles to carry the payload. 
 * If weight exceeds the largest vehicle, it splits the load.
 */
export function recommendVehicleFromTypes(
  vehicles: VehicleProfile[],
  weightKg: number,
): VehicleAllocation[] {
  const sorted = [...vehicles].sort((a, b) => b.payloadKg - a.payloadKg);
  const largest = sorted[0];
  if (!largest) return [];

  const allocations: VehicleAllocation[] = [];
  let remaining = weightKg;

  while (remaining > 0) {
    const nextVehicle = sorted.slice().reverse().find((v) => v.payloadKg >= remaining);
    
    if (nextVehicle) {
      allocations.push({ vehicle: nextVehicle, allocatedKg: remaining });
      remaining = 0;
    } else {
      allocations.push({ vehicle: largest, allocatedKg: largest.payloadKg });
      remaining -= largest.payloadKg;
    }
  }

  return allocations;
}
