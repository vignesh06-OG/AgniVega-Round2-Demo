import { describe, it, expect } from "vitest";
import { allocateVehicles, type VehicleInstance } from "../lib/krishi/vehicle-select";
import { toVehicleProfile } from "../lib/krishi/vehicle-select";

const mockProfile = toVehicleProfile({
  slug: "TEST",
  name: "Test Truck",
  payload_kg: 5000,
  base_cost_per_km: 10,
  toll_allowance_per_km: 0,
  mileage_kmpl: 10,
  fuel: "diesel",
});

const instances: VehicleInstance[] = [
  {
    id: "A",
    registrationNumber: "A",
    profile: mockProfile,
    currentCommittedKg: 0,
    availableCapacityKg: 5000,
  },
  {
    id: "B",
    registrationNumber: "B",
    profile: mockProfile,
    currentCommittedKg: 4000,
    availableCapacityKg: 1000,
  },
  {
    id: "C",
    registrationNumber: "C",
    profile: mockProfile,
    currentCommittedKg: 2000,
    availableCapacityKg: 3000,
  },
];

describe("allocateVehicles", () => {
  it("allocates accurately across multiple vehicle instances", () => {
    // Total available capacity = 5000 + 1000 + 3000 = 9000
    // Request 6000
    // Should prioritize largest available capacity: A (5000) then C (3000).
    const allocations = allocateVehicles(instances, 6000);

    expect(allocations.length).toBe(2);
    expect(allocations[0].instance.id).toBe("A");
    expect(allocations[0].allocatedKg).toBe(5000);

    expect(allocations[1].instance.id).toBe("C");
    expect(allocations[1].allocatedKg).toBe(1000);
  });

  it("overflows to the largest available if capacity exceeded", () => {
    const allocations = allocateVehicles(instances, 10000);

    // Uses A(5000), C(3000), B(1000). Remaining 1000 is overflowed to A (largest).
    // Wait, the algorithm pushes the remaining to the largest (A).
    const allocA = allocations.find((a) => a.instance.id === "A");
    expect(allocA?.allocatedKg).toBe(6000); // 5000 normal + 1000 overflow
  });
});
