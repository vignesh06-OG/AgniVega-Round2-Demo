export type PortalRole = "farmer" | "driver" | "fleet" | "admin";

export interface Village {
  id: string;
  name: string;
  taluka: string;
  district: string;
  lat: number;
  lng: number;
  unpaved_access: boolean;
}

export interface Mandi {
  id: string;
  name: string;
  code: string;
  taluka: string;
  district: string;
  lat: number;
  lng: number;
  avg_gate_queue_minutes: number;
  peak_hours: string;
}

export interface Crop {
  id: string;
  slug: string;
  name_en: string;
  name_mr: string;
  name_hi: string;
  spoilage_hours: number;
  crate_kg: number;
  perishable: boolean;
}

export interface MandiPrice {
  id: string;
  mandi_id: string;
  crop_id: string;
  price_per_kg: number;
  source: string;
}

export interface VehicleType {
  id: string;
  slug: string;
  name: string;
  payload_kg: number;
  mileage_kmpl: number;
  base_cost_per_km: number;
  toll_allowance_per_km: number;
  fuel: string;
}

export interface ReferenceData {
  villages: Village[];
  mandis: Mandi[];
  crops: Crop[];
  prices: MandiPrice[];
  vehicleTypes: VehicleType[];
  commissionPercent: number;
  fuel: { diesel: number; petrol: number };
  demoMode: boolean;
}

export interface MandiOption {
  mandiId: string;
  mandiName: string;
  mandiCode: string;
  distanceKm: number;
  pricePerKg: number;
  grossPayout: number;
  queueMinutes: number;
  arrivalWindow: string;
  pooled: {
    freightShare: number;
    platformFee: number;
    spoilageLoss: number;
    netPayout: number;
    vehicle: string;
    poolPartners: number;
    utilisationPercent: number;
    detourMinutes: number;
  };
  solo: {
    freightCost: number;
    platformFee: number;
    spoilageLoss: number;
    netPayout: number;
    vehicle: string;
    utilisationPercent: number;
  };
  savings: number;
  spoilage: {
    riskPercent: number;
    level: "safe" | "watch" | "critical";
    hoursRemaining: number;
    deadlineIso: string;
  };
  esg: { litresSaved: number; co2Saved: number };
}

export interface CalculationResult {
  requestId: string;
  cropId: string;
  cropName: string;
  weightKg: number;
  village: string;
  pickup: { lat: number; lng: number };
  routerTier: string;
  routerLatencyMs: number;
  demoMode: boolean;
  commissionPercent: number;
  dieselPrice: number;
  best: MandiOption;
  options: MandiOption[];
  nearbyPool: {
    partners: number;
    totalWeightKg: number;
    radiusKm: number;
    members: { village: string; weightKg: number; distanceKm: number; lat: number; lng: number }[];
  };
}
