import { PLATFORM, recommendVehicleFromTypes } from "./vehicle-select";
import { sequenceStops, type LatLng } from "./geo";
import {
  dieselBreakdown,
  esgSavings,
  itemiseEarnings,
  proportionalShares,
  spoilageRisk,
  tripFreightCost,
  utilisation,
  type FuelRates,
} from "./fuel-engine";
import { routeMatrix } from "./routing.server";
import type { CalculationResult, MandiOption } from "./types";
import type { VehicleProfile } from "./constants";

export interface PoolMember {
  id: string;
  village: string;
  weightKg: number;
  lat: number;
  lng: number;
}

export interface ComputeInput {
  requestId: string;
  cropId: string;
  cropName: string;
  spoilageHours: number;
  weightKg: number;
  village: string;
  pickup: LatLng;
  partners: PoolMember[];
  mandis: {
    id: string;
    name: string;
    code: string;
    lat: number;
    lng: number;
    queueMinutes: number;
    pricePerKg: number;
  }[];
  vehicles: VehicleProfile[];
  commissionPercent: number;
  fuel: FuelRates;
  demoMode: boolean;
  delayMinutes: number;
}

function arrivalWindow(minutes: number): string {
  const arrival = new Date(Date.now() + minutes * 60_000);
  const end = new Date(arrival.getTime() + 45 * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${fmt(arrival)} – ${fmt(end)}`;
}

/**
 * Pure calculation stage of the Calculate -> Confirm workflow.
 * NOTHING here writes to the database; it is safe to call repeatedly.
 */
export async function computeOptions(input: ComputeInput): Promise<CalculationResult> {
  const partnerPoints = input.partners.map((p) => ({ lat: p.lat, lng: p.lng }));
  const mandiPoints = input.mandis.map((m) => ({ lat: m.lat, lng: m.lng }));
  const points: LatLng[] = [input.pickup, ...partnerPoints, ...mandiPoints];

  const matrix = await routeMatrix(points);
  const partnerOffset = 1;
  const mandiOffset = 1 + partnerPoints.length;

  const pooledWeight = input.weightKg + input.partners.reduce((s, p) => s + p.weightKg, 0);

  const options: MandiOption[] = input.mandis.map((mandi, index) => {
    const mandiIdx = mandiOffset + index;
    const soloKm = matrix.distancesKm[0]?.[mandiIdx] ?? 0;
    const soloMin = matrix.durationsMin[0]?.[mandiIdx] ?? 0;

    /* ---- Solo scenario ---- */
    const soloVehicle = recommendVehicleFromTypes(input.vehicles, input.weightKg);
    const soloFreight = tripFreightCost(soloVehicle, soloKm, input.fuel);
    const soloRisk = spoilageRisk(
      input.spoilageHours,
      soloKm,
      mandi.pricePerKg * input.weightKg,
      mandi.queueMinutes + input.delayMinutes,
    );
    const soloEarnings = itemiseEarnings(
      mandi.pricePerKg,
      input.weightKg,
      soloFreight,
      input.commissionPercent,
      soloRisk.valueAtRisk,
    );

    /* ---- Pooled scenario: sequence every pickup, then the mandi ---- */
    const nodeIds = [0, ...input.partners.map((_, i) => partnerOffset + i), mandiIdx];
    const sub = nodeIds.map((from) => nodeIds.map((to) => matrix.distancesKm[from]?.[to] ?? 0));
    const subDur = nodeIds.map((from) => nodeIds.map((to) => matrix.durationsMin[from]?.[to] ?? 0));
    const order = sequenceStops(sub, 0, nodeIds.length - 1);

    let pooledKm = 0;
    let pooledMin = 0;
    for (let i = 0; i < order.length - 1; i += 1) {
      pooledKm += sub[order[i]!]?.[order[i + 1]!] ?? 0;
      pooledMin += subDur[order[i]!]?.[order[i + 1]!] ?? 0;
    }

    const poolVehicle = recommendVehicleFromTypes(input.vehicles, pooledWeight);
    const pooledFreight = tripFreightCost(poolVehicle, pooledKm, input.fuel);
    const legs = [
      { id: input.requestId, weightKg: input.weightKg, distanceKm: soloKm },
      ...input.partners.map((p) => ({
        id: p.id,
        weightKg: p.weightKg,
        distanceKm:
          matrix.distancesKm[partnerOffset + input.partners.indexOf(p)]?.[mandiIdx] ?? soloKm,
      })),
    ];
    const shares = proportionalShares(pooledFreight, legs);
    const myShare = shares[input.requestId] ?? pooledFreight;

    const detourMinutes = Math.max(0, pooledMin - soloMin);
    const risk = spoilageRisk(
      input.spoilageHours,
      pooledKm,
      mandi.pricePerKg * input.weightKg,
      mandi.queueMinutes + input.delayMinutes,
    );

    const pooledEarnings = itemiseEarnings(
      mandi.pricePerKg,
      input.weightKg,
      myShare,
      input.commissionPercent,
      risk.valueAtRisk,
    );

    const soloLitres =
      dieselBreakdown(soloVehicle, soloKm, input.fuel).litres * (1 + input.partners.length);
    const pooledLitres = dieselBreakdown(poolVehicle, pooledKm, input.fuel).litres;

    return {
      mandiId: mandi.id,
      mandiName: mandi.name,
      mandiCode: mandi.code,
      distanceKm: Number(soloKm.toFixed(1)),
      pricePerKg: mandi.pricePerKg,
      grossPayout: Math.round(pooledEarnings.grossPayout),
      queueMinutes: mandi.queueMinutes,
      arrivalWindow: arrivalWindow(pooledMin + mandi.queueMinutes + input.delayMinutes),
      pooled: {
        freightShare: Math.round(myShare),
        platformFee: Math.round(pooledEarnings.platformFee),
        spoilageLoss: Math.round(pooledEarnings.spoilageLoss),
        netPayout: Math.round(pooledEarnings.netPayout),
        vehicle: poolVehicle.name,
        poolPartners: input.partners.length,
        utilisationPercent: Math.round(utilisation(pooledWeight, poolVehicle.payloadKg) * 100),
        detourMinutes: Math.round(detourMinutes),
      },
      solo: {
        freightCost: Math.round(soloFreight),
        platformFee: Math.round(soloEarnings.platformFee),
        spoilageLoss: Math.round(soloEarnings.spoilageLoss),
        netPayout: Math.round(soloEarnings.netPayout),
        vehicle: soloVehicle.name,
        utilisationPercent: Math.round(utilisation(input.weightKg, soloVehicle.payloadKg) * 100),
      },
      savings: Math.round(pooledEarnings.netPayout - soloEarnings.netPayout),
      spoilage: {
        riskPercent: risk.riskPercent,
        level: risk.level,
        hoursRemaining: Number(risk.hoursRemaining.toFixed(1)),
        deadlineIso: new Date(Date.now() + input.spoilageHours * 3_600_000).toISOString(),
      },
      esg: esgSavings(soloLitres, pooledLitres),
    };
  });

  options.sort((a, b) => b.pooled.netPayout - a.pooled.netPayout);
  const best = options[0]!;

  return {
    requestId: input.requestId,
    cropId: input.cropId,
    cropName: input.cropName,
    weightKg: input.weightKg,
    village: input.village,
    pickup: input.pickup,
    routerTier: matrix.tier,
    routerLatencyMs: matrix.latencyMs,
    demoMode: input.demoMode,
    commissionPercent: input.commissionPercent,
    dieselPrice: input.fuel.diesel,
    best,
    options,
    nearbyPool: {
      partners: input.partners.length,
      totalWeightKg: pooledWeight,
      radiusKm: PLATFORM.poolRadiusKm,
      members: input.partners.map((p, i) => ({
        village: p.village,
        weightKg: p.weightKg,
        distanceKm: Number((matrix.distancesKm[0]?.[partnerOffset + i] ?? 0).toFixed(1)),
        lat: p.lat,
        lng: p.lng,
      })),
    },
  };
}
