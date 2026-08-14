/**
 * CANONICAL DEMO DATASET — NRY-OS / SKH041
 *
 * Single source of truth for the Kopargaon demonstration scenario.
 * Every screen, component, and test must derive numbers from this
 * dataset — not from ad-hoc constants.
 *
 * DATA STATUS LEGEND
 * ─────────────────────────────────────────────────────────────────
 *   "SIMULATED"  — hand-authored for demo; not from a live source.
 *   "COMPUTED"   — deterministically derived from the ENR formula.
 *   "CONSTANT"   — sourced from a stable, verifiable real-world value.
 *   "USER_INPUT" — supplied by the farmer at runtime.
 * ─────────────────────────────────────────────────────────────────
 *
 * ECONOMIC MODEL (as implemented in fuel-engine.ts)
 * ─────────────────────────────────────────────────────────────────
 *   grossPayout    = pricePerKg × weightKg
 *   freightCost    = freightRatePerKm × distanceKm × RETURN_LEG_FACTOR
 *   freightRatePerKm = baseCostPerKm + (dieselPrice / mileageKmpl) + tollAllowancePerKm
 *   platformFee    = grossPayout × commissionPercent / 100
 *   netPayout (ENR) = grossPayout − freightCost − platformFee
 *
 * NOTE: Queue time (minutes) is NOT a monetary deduction.
 *   It is used only to compute spoilage risk level and arrival window.
 *   This matches the actual itemiseEarnings() implementation.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Infrastructure constants (CONSTANT — real Nashik belt values) ────────────
export const DEMO_DIESEL_PRICE_RS_PER_L = 99.07;
export const DEMO_ROAD_FACTOR = 1.28; // rural road winding vs straight-line
export const DEMO_RETURN_LEG_FACTOR = 1.6; // laden + 60% empty return
export const DEMO_COMMISSION_PCT = 3;
export const DEMO_AVG_SPEED_KMPH = 34;

// ─── Farmer & crop (SIMULATED) ────────────────────────────────────────────────
export const DEMO_FARMER = {
  name: "Ramesh Patil",
  village: "Pohegaon",
  taluka: "Kopargaon",
  district: "Ahmednagar",
  /** SIMULATED: lat/lng of Pohegaon village, Kopargaon taluka. */
  lat: 19.8342,
  lng: 74.5231,
  dataStatus: "SIMULATED" as const,
};

export const DEMO_CROP = {
  id: "crop-1",
  slug: "onion",
  name_en: "Onion",
  name_mr: "कांदा",
  name_hi: "प्याज़",
  perishable: false,
  /** Onions: ~14-day shelf life after harvest. SIMULATED — actual value depends on storage. */
  spoilage_hours: 336,
  crate_kg: 50,
  /** SIMULATED: Grade B/C typical for smallholder auction */
  grade: "B",
  dataStatus: "SIMULATED" as const,
};

export const DEMO_WEIGHT_KG = 1000; // USER_INPUT (10 quintals, typical)
export const DEMO_QUANTITY_QUINTALS = 10;

// ─── Pool partners (SIMULATED) ────────────────────────────────────────────────
/** Three nearby farmers in demo pool. Data: SIMULATED. */
export const DEMO_POOL_PARTNERS = [
  {
    id: "demo-partner-1",
    village: "Pohegaon Wasti",
    weightKg: 520,
    lat: 19.8453,
    lng: 74.532,
    dataStatus: "SIMULATED" as const,
  },
  {
    id: "demo-partner-2",
    village: "Pohegaon Phata",
    weightKg: 380,
    lat: 19.8251,
    lng: 74.5361,
    dataStatus: "SIMULATED" as const,
  },
  {
    id: "demo-partner-3",
    village: "Rahegaon Mala",
    weightKg: 450,
    lat: 19.8421,
    lng: 74.5089,
    dataStatus: "SIMULATED" as const,
  },
] as const;

export const DEMO_POOLED_TOTAL_KG =
  DEMO_WEIGHT_KG + DEMO_POOL_PARTNERS.reduce((s, p) => s + p.weightKg, 0);
// = 1000 + 520 + 380 + 450 = 2350 kg

// ─── Vehicle profiles (CONSTANT — from manufacturer specs) ───────────────────
export const DEMO_SOLO_VEHICLE = {
  slug: "tata-ace",
  name: "Tata Ace Gold",
  payloadKg: 1000,
  mileageKmpl: 19,
  baseCostPerKm: 6.1,
  tollAllowancePerKm: 0.8,
  fuel: "diesel" as const,
  dataStatus: "CONSTANT" as const,
};

export const DEMO_POOL_VEHICLE = {
  slug: "tata-407",
  name: "Tata LPT 407",
  payloadKg: 2500,
  mileageKmpl: 10,
  baseCostPerKm: 9.8,
  tollAllowancePerKm: 1.6,
  fuel: "diesel" as const,
  dataStatus: "CONSTANT" as const,
};

// ─── Mandis (distances: COMPUTED from haversine×ROAD_FACTOR) ─────────────────
/**
 * Distances are computed offline via Haversine × road-factor = 1.28.
 * In live operation, OSRM or ORS returns actual road distances.
 * Prices: SIMULATED DEMO DATA.
 */
export const DEMO_MANDIS = [
  {
    id: "mandi-1",
    code: "KPG",
    name: "Kopargaon APMC",
    lat: 19.8833,
    lng: 74.4833,
    /** SIMULATED DEMO DATA — actual price from Agmarknet API (future integration) */
    pricePerKg: 18.5,
    queueMinutes: 45,
    peakHours: "06:00–10:00",
    distanceKm: 9.3, // haversine(Pohegaon, KPG) × 1.28 ≈ 9.3 km
    dataStatus: "SIMULATED" as const,
    priceSource: "SIMULATED DEMO DATA — not from live Agmarknet feed",
  },
  {
    id: "mandi-2",
    code: "LSG",
    name: "Lasalgaon APMC",
    lat: 20.12,
    lng: 74.23,
    /** SIMULATED DEMO DATA */
    pricePerKg: 22.0,
    queueMinutes: 60,
    peakHours: "05:00–11:00",
    distanceKm: 56.5,
    dataStatus: "SIMULATED" as const,
    priceSource: "SIMULATED DEMO DATA — not from live Agmarknet feed",
  },
  {
    id: "mandi-3",
    code: "NSK",
    name: "Nashik APMC",
    lat: 20.0116,
    lng: 73.7908,
    /** SIMULATED DEMO DATA */
    pricePerKg: 24.5,
    queueMinutes: 75,
    peakHours: "05:00–12:00",
    distanceKm: 101.2,
    dataStatus: "SIMULATED" as const,
    priceSource: "SIMULATED DEMO DATA — not from live Agmarknet feed",
  },
  {
    id: "mandi-4",
    code: "RHR",
    name: "Rahuri APMC",
    lat: 19.392,
    lng: 74.6506,
    /** SIMULATED DEMO DATA */
    pricePerKg: 19.0,
    queueMinutes: 30,
    peakHours: "07:00–11:00",
    distanceKm: 65.2,
    dataStatus: "SIMULATED" as const,
    priceSource: "SIMULATED DEMO DATA — not from live Agmarknet feed",
  },
] as const;

import { tripFreightCost, itemiseEarnings, spoilageRisk } from "./fuel-engine";

// ─── Pre-computed ENR results (COMPUTED) ─────────────────────────────────────
/**
 * These numbers are computed from the ENR formula using the constants above.
 * They are dynamically computed at runtime to ensure mathematical reconciliation.
 */
export const DEMO_ENR_RESULTS = DEMO_MANDIS.map((mandi) => {
  const freightCost = tripFreightCost(DEMO_SOLO_VEHICLE, mandi.distanceKm, {
    diesel: DEMO_DIESEL_PRICE_RS_PER_L,
    petrol: 112.44,
  });

  const risk = spoilageRisk(
    DEMO_CROP.spoilage_hours,
    mandi.distanceKm,
    mandi.pricePerKg * DEMO_WEIGHT_KG,
    mandi.queueMinutes,
  );

  const earnings = itemiseEarnings(
    mandi.pricePerKg,
    DEMO_WEIGHT_KG,
    freightCost,
    DEMO_COMMISSION_PCT,
    risk.valueAtRisk,
  );

  const roundedGross = Math.round(earnings.grossPayout);
  const roundedFreight = Math.round(earnings.freightShare);
  const roundedFee = Math.round(earnings.platformFee);
  const roundedSpoilage = Math.round(earnings.spoilageLoss);

  return {
    mandiId: mandi.id,
    mandiName: mandi.name,
    pricePerKg: mandi.pricePerKg,
    distanceKm: mandi.distanceKm,
    grossPayout: roundedGross,
    freightCost: roundedFreight,
    platformFee: roundedFee,
    spoilageLoss: roundedSpoilage,
    netPayout: roundedGross - roundedFreight - roundedFee - roundedSpoilage,
    transitHours: Number(risk.transitHours.toFixed(1)),
    spoilageRiskPct: risk.riskPercent,
    spoilageLevel: risk.level,
    dataStatus: "COMPUTED" as const,
  };
});

/** Sorted by ENR descending — winner is index 0. */
export const DEMO_RANKED = [...DEMO_ENR_RESULTS].sort((a, b) => b.netPayout - a.netPayout);

export const DEMO_WINNER = DEMO_RANKED[0]!;

/**
 * The core "hero insight" for the demo:
 * Kopargaon has the lowest price AND is the nearest.
 * A farmer acting on instinct would go there.
 * The NRY-OS recommendation is Nashik — Rs 4,039 more in hand.
 *
 * ENR difference = Nashik(21804) − Kopargaon(17765) = 4039
 * Reason: Rs 6/kg price advantage outweighs Rs 1,781 extra freight.
 */
const instinct = DEMO_ENR_RESULTS.find((r) => r.mandiId === "mandi-1")!;
const optimized = DEMO_WINNER;
const diff = optimized.netPayout - instinct.netPayout;

export const DEMO_INSIGHT = {
  instinctChoice: instinct.mandiId,
  optimizedChoice: optimized.mandiId,
  enrDifferenceRs: diff,
  keyReason: `${optimized.mandiName}'s higher price adds ₹${optimized.grossPayout - instinct.grossPayout} gross. Extra ₹${optimized.freightCost - instinct.freightCost} freight still leaves ₹${diff} more Expected Net Realization (ENR).`,
  dataStatus: "COMPUTED" as const,
};

// ─── IVR / Voice prototype script ─────────────────────────────────────────────
/**
 * Script for the Voice/IVR PROTOTYPE.
 * This uses Web Speech API (browser TTS/STT) — NOT a real telephony service.
 * Architecture allows future integration with Twilio, Exotel, or similar.
 */
export const DEMO_IVR_SCRIPT = {
  systemType: "VOICE_IVR_PROTOTYPE" as const,
  caveat:
    "This is a browser-based voice prototype using Web Speech API. Not a live telephone service.",
  architectureNote:
    "Real IVR integration path: Twilio/Exotel → webhook → voice.functions.ts → TTS response.",
  steps: [
    {
      turn: "system",
      text: "नमस्कार! स्मार्ट कृषी-यात्रा AI मध्ये आपले स्वागत आहे. कृपया तुमचे पीक सांगा.",
    },
    { turn: "farmer", text: "कांदा" },
    { turn: "system", text: "कांदा. किती किलो आहे?" },
    { turn: "farmer", text: "दहा क्विंटल" },
    { turn: "system", text: "दहा क्विंटल, म्हणजे एक हजार किलो. तुमचे गाव?" },
    { turn: "farmer", text: "पोहेगाव, कोपरगाव" },
    {
      turn: "system",
      text: "पोहेगाव. एक मिनिट थांबा… नाशिक APMC मध्ये जा. ₹२१,८०४ मिळतील. कोपरगाव पेक्षा ₹४,०३९ जास्त. पुढे जायचे का?",
    },
    { turn: "farmer", text: "हो" },
    { turn: "system", text: "बुकिंग नोंदवली. हँडओव्हर कोड: KY-XXXXX. ड्रायव्हरला दाखवा." },
  ],
} as const;

// ─── Delay recalculation demo ─────────────────────────────────────────────────
/**
 * Demonstrates the closed-loop nature of NRY-OS.
 * A delay of 3 hours on the Nashik trip increases transit time.
 * For onion (336h spoilage), even 7h total transit keeps risk negligible.
 * The result: recommendation does NOT change. System confirms original decision.
 * For a perishable crop (grapes, 48h spoilage), a 3h delay WOULD trigger re-opt.
 */
export const DEMO_DELAY_SCENARIOS = [
  {
    delayHours: 0,
    label: "No delay",
    totalTransitHours: 4.2,
    updatedSpoilageRiskPct: 1,
    updatedSpoilageLevel: "safe" as const,
    updatedNetPayout: 21804,
    recommendationChange: false,
    note: "Original plan optimal.",
  },
  {
    delayHours: 3,
    label: "+3 hour delay",
    totalTransitHours: 7.2,
    updatedSpoilageRiskPct: 2,
    updatedSpoilageLevel: "safe" as const,
    updatedNetPayout: 21804, // No ENR change; spoilage risk still negligible for onion
    recommendationChange: false,
    note: "Onion shelf life = 336h. 7.2h transit is safe. Nashik still optimal.",
  },
  {
    delayHours: 12,
    label: "+12 hour delay",
    totalTransitHours: 16.2,
    updatedSpoilageRiskPct: 5,
    updatedSpoilageLevel: "watch" as const,
    updatedNetPayout: 21804,
    recommendationChange: false,
    note: "Still within safe range for onion. Route confirmed.",
  },
] as const;

/**
 * For perishable demo (grapes, 48h spoilage, +6h delay):
 * Shows the system recommending nearest market when spoilage risk exceeds threshold.
 */
export const DEMO_DELAY_PERISHABLE = {
  crop: "grapes",
  spoilageHours: 48,
  baseTransitHoursNashik: 4.2,
  delayHours: 6,
  totalTransitHours: 10.2,
  updatedSpoilageRiskPct: 21,
  updatedSpoilageLevel: "watch" as const,
  recommendationChange: true,
  newRecommendation: "Kopargaon APMC",
  reason:
    "Transit time of 10.2h now represents 21% of grapes' 48h shelf life. Switching to Kopargaon (9.3km, 1.0h) reduces spoilage risk to 2% and avoids estimated ₹850 value-at-risk.",
};

// ─── Confidence metadata ──────────────────────────────────────────────────────
export type DataStatus =
  "LIVE" | "SIMULATED" | "COMPUTED" | "USER_INPUT" | "CONSTANT" | "MODEL_PREDICTION";

export const DEMO_CONFIDENCE_LABELS: Record<string, { status: DataStatus; note: string }> = {
  mandiPrice: {
    status: "SIMULATED",
    note: "Live integration path: Agmarknet API (data.gov.in), eNAM portal, or APMC direct feeds.",
  },
  routeDistance: {
    status: "COMPUTED",
    note: "Haversine × road-factor offline fallback. Live: OSRM or OpenRouteService.",
  },
  queueTime: {
    status: "SIMULATED",
    note: "Modelled as fixed value. Live: time-series analysis of historical Agmarknet arrival data.",
  },
  spoilageRisk: {
    status: "COMPUTED",
    note: "Deterministic formula: transit_time / spoilage_hours × 0.35 × gross. Not an ML model.",
  },
  freightCost: {
    status: "COMPUTED",
    note: "Fuel-indexed formula using real vehicle specs and Nashik diesel baseline.",
  },
  vehicleSelection: {
    status: "COMPUTED",
    note: "Smallest vehicle by payload that can carry the load. Deterministic, not ML.",
  },
  poolMatching: {
    status: "SIMULATED",
    note: "Live: open shipment_requests within pool radius from Supabase. Demo: seeded loads.",
  },
  voiceNLP: {
    status: "MODEL_PREDICTION",
    note: "Local keyword parse (deterministic fallback) + optional LLM call (GPT-4o-mini / Gemini).",
  },
  dieselPrice: {
    status: "CONSTANT",
    note: "Nashik belt baseline ₹99.07/L. Live: IOC daily fuel price scraper (future integration).",
  },
};
