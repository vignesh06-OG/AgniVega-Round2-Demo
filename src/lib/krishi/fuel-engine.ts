import { FUEL_BASELINE, PLATFORM, type VehicleProfile, smallestVehicleFor } from "./constants";

export interface FuelRates {
  diesel: number;
  petrol: number;
}

export const DEFAULT_FUEL_RATES: FuelRates = {
  diesel: FUEL_BASELINE.diesel,
  petrol: FUEL_BASELINE.petrol,
};

/**
 * Dynamic freight rate per kilometre.
 *
 *   rate = vehicle_base_cost + (local_fuel_price / vehicle_mileage) + toll_allowance
 */
export function freightRatePerKm(
  vehicle: VehicleProfile,
  rates: FuelRates = DEFAULT_FUEL_RATES,
): number {
  const fuelPrice = vehicle.fuel === "petrol" ? rates.petrol : rates.diesel;
  return vehicle.baseCostPerKm + fuelPrice / vehicle.mileageKmpl + vehicle.tollAllowancePerKm;
}

/**
 * A truck has to come back. Freight is billed on the laden leg plus an empty
 * return leg charged at 60% (no load, but the diesel and driver hours are real).
 */
export const RETURN_LEG_FACTOR = 1.6;

export function tripFreightCost(
  vehicle: VehicleProfile,
  distanceKm: number,
  rates: FuelRates = DEFAULT_FUEL_RATES,
): number {
  return freightRatePerKm(vehicle, rates) * distanceKm * RETURN_LEG_FACTOR;
}

export interface PoolLeg {
  id: string;
  weightKg: number;
  distanceKm: number;
}

/**
 * Proportional cost share.
 *
 *   share_i = total_freight * (w_i * d_i) / SUM(w_j * d_j)
 */
export function proportionalShares(totalFreight: number, legs: PoolLeg[]): Record<string, number> {
  const weighted = legs.map((leg) => Math.max(0, leg.weightKg * leg.distanceKm));
  const denominator = weighted.reduce((sum, value) => sum + value, 0);
  const result: Record<string, number> = {};
  legs.forEach((leg, index) => {
    result[leg.id] = denominator === 0 ? 0 : totalFreight * ((weighted[index] ?? 0) / denominator);
  });
  return result;
}

export interface DieselBreakdown {
  litres: number;
  cost: number;
  tolls: number;
}

export function dieselBreakdown(
  vehicle: VehicleProfile,
  distanceKm: number,
  rates: FuelRates = DEFAULT_FUEL_RATES,
): DieselBreakdown {
  const litres = distanceKm / vehicle.mileageKmpl;
  const fuelPrice = vehicle.fuel === "petrol" ? rates.petrol : rates.diesel;
  return {
    litres,
    cost: litres * fuelPrice,
    tolls: vehicle.tollAllowancePerKm * distanceKm,
  };
}

/** Driver_Net = Gross_Freight - Diesel - Tolls */
export function driverNetMargin(
  grossFreight: number,
  vehicle: VehicleProfile,
  distanceKm: number,
  rates: FuelRates = DEFAULT_FUEL_RATES,
): { grossFreight: number; diesel: number; tolls: number; net: number } {
  const { cost, tolls } = dieselBreakdown(vehicle, distanceKm, rates);
  return { grossFreight, diesel: cost, tolls, net: grossFreight - cost - tolls };
}

export interface EarningsItemisation {
  grossPayout: number;
  freightShare: number;
  platformFee: number;
  spoilageLoss: number;
  netPayout: number;
  commissionPercent: number;
}

/** Net = (mandi_price * weight) - freight_share - platform_fee - spoilage_loss */
export function itemiseEarnings(
  pricePerKg: number,
  weightKg: number,
  freightShare: number,
  commissionPercent: number,
  spoilageLoss: number = 0,
): EarningsItemisation {
  const grossPayout = pricePerKg * weightKg;
  const platformFee = (grossPayout * commissionPercent) / 100;
  return {
    grossPayout,
    freightShare,
    platformFee,
    spoilageLoss,
    netPayout: grossPayout - freightShare - platformFee - spoilageLoss,
    commissionPercent,
  };
}

export interface SpoilageRisk {
  hoursRemaining: number;
  transitHours: number;
  riskPercent: number;
  level: "safe" | "watch" | "critical";
  valueAtRisk: number;
}

export function spoilageRisk(
  spoilageHours: number,
  distanceKm: number,
  grossPayout: number,
  queueMinutes: number,
): SpoilageRisk {
  const transitHours = distanceKm / PLATFORM.averageSpeedKmph + queueMinutes / 60;
  const hoursRemaining = Math.max(0, spoilageHours - transitHours);
  const ratio = spoilageHours === 0 ? 1 : Math.min(1, transitHours / spoilageHours);
  const riskPercent = Math.round(ratio * 100);
  const level: SpoilageRisk["level"] =
    riskPercent >= 60 ? "critical" : riskPercent >= 30 ? "watch" : "safe";
  return {
    hoursRemaining,
    transitHours,
    riskPercent,
    level,
    valueAtRisk: grossPayout * ratio * 0.35,
  };
}

export function utilisation(weightKg: number, payloadKg: number): number {
  if (payloadKg <= 0) return 0;
  return Math.min(2, weightKg / payloadKg);
}

export function isOverloaded(weightKg: number, payloadKg: number): boolean {
  return weightKg > payloadKg;
}

export function recommendVehicle(weightKg: number): VehicleProfile {
  return smallestVehicleFor(weightKg);
}

/** Litres of diesel and kg of CO2 avoided by pooling instead of running solo. */
export function esgSavings(
  soloLitres: number,
  pooledLitres: number,
): { litresSaved: number; co2Saved: number } {
  const litresSaved = Math.max(0, soloLitres - pooledLitres);
  return { litresSaved, co2Saved: litresSaved * PLATFORM.co2PerLitre };
}
