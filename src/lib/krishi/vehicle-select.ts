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

export interface VehicleInstance {
  id: string; // e.g., MH-15-XY-1234
  registrationNumber: string;
  profile: VehicleProfile;
  currentCommittedKg: number;
  availableCapacityKg: number; // profile.payloadKg - currentCommittedKg
  routeId?: string; // Optional: tie to a specific mandi/route
}

export interface InstanceAllocation {
  instance: VehicleInstance;
  allocatedKg: number;
}

/**
 * Recommends one or more vehicles to carry the payload.
 * If weight exceeds the largest vehicle, it splits the load.
 * NOTE: This is the old type-based allocation.
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
    const nextVehicle = sorted
      .slice()
      .reverse()
      .find((v) => v.payloadKg >= remaining);

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

/**
 * Recommends vehicles from specific instances.
 * Prioritizes vehicles with the largest available capacity to minimize the number of vehicles used.
 */
export function allocateVehicles(
  instances: VehicleInstance[],
  weightKg: number,
): InstanceAllocation[] {
  // Sort by available capacity descending to minimize number of vehicles
  const sorted = [...instances].sort((a, b) => b.availableCapacityKg - a.availableCapacityKg);
  const allocations: InstanceAllocation[] = [];
  let remaining = weightKg;

  for (const instance of sorted) {
    if (remaining <= 0) break;
    if (instance.availableCapacityKg <= 0) continue;

    const allocateAmount = Math.min(remaining, instance.availableCapacityKg);
    allocations.push({ instance, allocatedKg: allocateAmount });
    remaining -= allocateAmount;
  }

  // If there's still remaining weight, it means we don't have enough capacity
  // in the available fleet for this specific route/pool.
  // We will NOT over-allocate the overflow to the largest truck. We will return 
  // exactly what we can safely accommodate. The UI and booking logic will handle partial dispatch.

  return allocations;
}
