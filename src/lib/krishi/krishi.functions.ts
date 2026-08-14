import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { CalculationResult, ReferenceData } from "./types";

const calcSchema = z.object({
  cropId: z.string().uuid().or(z.string()),
  weightKg: z.number().min(1).max(20000),
  villageName: z.string().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  demoMode: z.boolean().default(true),
  emergency: z.boolean().default(false),
  delayMinutes: z.number().default(0),
});

export type CalcInput = z.infer<typeof calcSchema>;

const mockCrops: Crop[] = [
  { id: "crop-1", name_en: "Onion", name_hi: "Pyaaz", name_mr: "कांदा", slug: "onion", perishable: false, spoilage_hours: 336, crate_kg: 50, category: "vegetable", season: "Rabi", isHighDemand: true, qualityParams: ["size", "color", "sprouting"] },
  { id: "crop-2", name_en: "Grapes", name_hi: "Angoor", name_mr: "द्राक्षे", slug: "grapes", perishable: true, spoilage_hours: 48, crate_kg: 20, category: "fruit", season: "Rabi", qualityParams: ["color", "sweetness", "firmness"] },
  { id: "crop-3", name_en: "Tomato", name_hi: "Tamatar", name_mr: "टोमॅटो", slug: "tomato", perishable: true, spoilage_hours: 72, crate_kg: 25, category: "vegetable", season: "Year-round", isHighDemand: true, qualityParams: ["color", "firmness", "damage"] },
  { id: "crop-4", name_en: "Soybean", name_hi: "Soyabean", name_mr: "सोयाबीन", slug: "soybean", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "oilseed", season: "Kharif", isHighDemand: true, qualityParams: ["moisture", "foreign_matter", "grain_damage"] },
  { id: "crop-5", name_en: "Cotton", name_hi: "Kapas", name_mr: "कापूस", slug: "cotton", perishable: false, spoilage_hours: 1440, crate_kg: 50, category: "cash_crop", season: "Kharif", isHighDemand: true, qualityParams: ["staple_length", "moisture", "trash_content"] },
  { id: "crop-6", name_en: "Tur", name_hi: "Arhar", name_mr: "तूर", slug: "tur", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "pulse", season: "Kharif", qualityParams: ["moisture", "foreign_matter", "weevil_damage"] },
  { id: "crop-7", name_en: "Chana", name_hi: "Chana", name_mr: "हरभरा", slug: "chana", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "pulse", season: "Rabi", qualityParams: ["moisture", "size", "split_grains"] },
  { id: "crop-8", name_en: "Moong", name_hi: "Moong", name_mr: "मूग", slug: "moong", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "pulse", season: "Kharif", qualityParams: ["moisture", "foreign_matter", "color"] },
  { id: "crop-9", name_en: "Wheat", name_hi: "Gehu", name_mr: "गहू", slug: "wheat", perishable: false, spoilage_hours: 1440, crate_kg: 50, category: "cereal", season: "Rabi", qualityParams: ["moisture", "shrivelled_grains", "foreign_matter"] },
  { id: "crop-10", name_en: "Jowar", name_hi: "Jowar", name_mr: "ज्वारी", slug: "jowar", perishable: false, spoilage_hours: 1440, crate_kg: 50, category: "cereal", season: "Kharif", qualityParams: ["moisture", "color", "foreign_matter"] },
  { id: "crop-11", name_en: "Bajra", name_hi: "Bajra", name_mr: "बाजरी", slug: "bajra", perishable: false, spoilage_hours: 1440, crate_kg: 50, category: "cereal", season: "Kharif", qualityParams: ["moisture", "foreign_matter"] },
  { id: "crop-12", name_en: "Maize", name_hi: "Makka", name_mr: "मका", slug: "maize", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "cereal", season: "Kharif", qualityParams: ["moisture", "broken_grains", "fungus_damage"] },
  { id: "crop-13", name_en: "Potato", name_hi: "Aloo", name_mr: "बटाटा", slug: "potato", perishable: false, spoilage_hours: 480, crate_kg: 50, category: "vegetable", season: "Rabi", qualityParams: ["size", "sprouting", "green_color"] },
  { id: "crop-14", name_en: "Groundnut", name_hi: "Mungfali", name_mr: "भुईमूग", slug: "groundnut", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "oilseed", season: "Kharif", qualityParams: ["moisture", "pod_size", "kernel_ratio"] },
  { id: "crop-15", name_en: "Sunflower", name_hi: "Surajmukhi", name_mr: "सूर्यफूल", slug: "sunflower", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "oilseed", season: "Kharif", qualityParams: ["moisture", "oil_content"] },
  { id: "crop-16", name_en: "Mustard", name_hi: "Sarson", name_mr: "मोहरी", slug: "mustard", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "oilseed", season: "Rabi", qualityParams: ["moisture", "foreign_matter"] },
  { id: "crop-17", name_en: "Urad", name_hi: "Urad", name_mr: "उडीद", slug: "urad", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "pulse", season: "Kharif", qualityParams: ["moisture", "foreign_matter"] },
  { id: "crop-18", name_en: "Rice", name_hi: "Chawal", name_mr: "तांदूळ", slug: "rice", perishable: false, spoilage_hours: 1440, crate_kg: 50, category: "cereal", season: "Kharif", qualityParams: ["moisture", "broken_grains", "foreign_matter"] },
  { id: "crop-19", name_en: "Sugarcane", name_hi: "Ganna", name_mr: "ऊस", slug: "sugarcane", perishable: true, spoilage_hours: 72, crate_kg: 1000, category: "cash_crop", season: "Year-round", isHighDemand: true, qualityParams: ["sugar_recovery", "freshness"] },
  { id: "crop-20", name_en: "Turmeric", name_hi: "Haldi", name_mr: "हळद", slug: "turmeric", perishable: false, spoilage_hours: 720, crate_kg: 50, category: "spice", season: "Kharif", qualityParams: ["curcumin_content", "moisture", "size"] },
  { id: "crop-21", name_en: "Ginger", name_hi: "Adrak", name_mr: "आले", slug: "ginger", perishable: true, spoilage_hours: 168, crate_kg: 50, category: "spice", season: "Kharif", qualityParams: ["fiber_content", "moisture", "size"] },
];

const mockVillages = [
  {
    id: "vil-1",
    name: "Kopargaon Rural",
    district: "Ahmednagar",
    taluka: "Kopargaon",
    lat: 19.8833,
    lng: 74.4833,
    unpaved_access: false,
  },
  {
    id: "vil-2",
    name: "Rahuri Rural",
    district: "Ahmednagar",
    taluka: "Rahuri",
    lat: 19.4833,
    lng: 74.4833,
    unpaved_access: false,
  },
];

const mockMandis = [
  {
    id: "mandi-1",
    code: "KOP",
    name: "Kopargaon APMC",
    lat: 19.8833,
    lng: 74.4833,
    peak_hours: "06:00-10:00",
    avg_gate_queue_minutes: 45,
    district: "Ahmednagar",
    taluka: "Kopargaon",
  },
  {
    id: "mandi-2",
    code: "RAH",
    name: "Rahuri APMC",
    lat: 19.4833,
    lng: 74.4833,
    peak_hours: "07:00-11:00",
    avg_gate_queue_minutes: 30,
    district: "Ahmednagar",
    taluka: "Rahuri",
  },
  {
    id: "mandi-3",
    code: "NSK",
    name: "Nashik APMC",
    lat: 20.1833,
    lng: 73.9833,
    peak_hours: "05:00-12:00",
    avg_gate_queue_minutes: 60,
    district: "Nashik",
    taluka: "Nashik",
  },
];

// Dynamically generate mock prices for all crops and mandis
const mockPrices = mockCrops.flatMap(crop => {
  // Base price arbitrary per crop
  let basePrice = 20;
  if (crop.name_en === 'Grapes') basePrice = 45;
  if (crop.name_en === 'Soybean') basePrice = 40;
  if (crop.name_en === 'Wheat') basePrice = 22;
  if (crop.name_en === 'Cotton') basePrice = 70;
  if (crop.name_en === 'Tur') basePrice = 60;
  if (crop.name_en === 'Onion') basePrice = 18;
  
  return mockMandis.map((mandi, i) => {
    // vary price by mandi
    const variation = (i * 1.5) + (Math.random() * 2);
    return {
      id: `p-${crop.id}-${mandi.id}`,
      crop_id: crop.id,
      mandi_id: mandi.id,
      price_per_kg: Number((basePrice + variation).toFixed(2)),
      source: 'mock'
    };
  });
});


const mockVehicles = [
  { id: "TATA-ACE-01", slug: "TATA-ACE-01", name: "Tata Ace Gold", payload_kg: 750, base_cost_per_km: 15.0, toll_allowance_per_km: 0, mileage_kmpl: 19, fuel: "diesel" },
  { id: "PIAGGIO-APE-06", slug: "PIAGGIO-APE-06", name: "Piaggio Ape", payload_kg: 500, base_cost_per_km: 12.0, toll_allowance_per_km: 0, mileage_kmpl: 22, fuel: "diesel" },
  { id: "MAHINDRA-PICKUP-02", slug: "MAHINDRA-PICKUP-02", name: "Mahindra Bolero Pickup", payload_kg: 1500, base_cost_per_km: 20.0, toll_allowance_per_km: 0, mileage_kmpl: 12, fuel: "diesel" },
  { id: "EICHER-1110-03", slug: "EICHER-1110-03", name: "Eicher Pro 1110", payload_kg: 7000, base_cost_per_km: 45.0, toll_allowance_per_km: 2, mileage_kmpl: 6, fuel: "diesel" },
  { id: "TATA-1109-04", slug: "TATA-1109-04", name: "Tata LPT 1109", payload_kg: 7000, base_cost_per_km: 45.0, toll_allowance_per_km: 2, mileage_kmpl: 6, fuel: "diesel" },
  { id: "BHARATBENZ-1215-05", slug: "BHARATBENZ-1215-05", name: "BharatBenz 1215R", payload_kg: 12000, base_cost_per_km: 65.0, toll_allowance_per_km: 5, mileage_kmpl: 4, fuel: "diesel" },
];

export const getReferenceData = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReferenceData> => {
    return {
      villages: mockVillages as any,
      mandis: mockMandis as any,
      crops: mockCrops as any,
      prices: mockPrices as any,
      vehicleTypes: mockVehicles as any,
      commissionPercent: 3,
      fuel: {
        diesel: 99.07,
        petrol: 112.44,
      },
      demoMode: true,
    };
  },
);

export const calculateOptions = createServerFn({ method: "POST" })
  .validator((input: unknown) => calcSchema.parse(input))
  .handler(async ({ data }): Promise<CalculationResult> => {
    const { computeOptions } = await import("./pooling.server");
    const { toVehicleProfile, PLATFORM } = await import("./vehicle-select");
    const { DEMO_LOADS } = await import("./demo-data");
    const { haversineKm } = await import("./geo");

    const crop = mockCrops.find((c) => c.id === data.cropId) || mockCrops[0]!;

    const priceData = mockPrices.filter((p) => p.crop_id === crop.id);

    const priceByMandi = new Map<string, number>();
    for (const row of priceData) {
      priceByMandi.set(row.mandi_id, Number(row.price_per_kg));
    }

    const mandis = mockMandis
      .filter((m) => priceByMandi.has(m.id))
      .map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        lat: m.lat,
        lng: m.lng,
        queueMinutes: m.avg_gate_queue_minutes ?? 30,
        pricePerKg: priceByMandi.get(m.id) ?? 0,
      }));

    if (mandis.length === 0) throw new Error("No mandi is currently quoting this crop");

    const pickup = { lat: data.lat, lng: data.lng };

    let partners = data.demoMode
      ? DEMO_LOADS.filter((l) => l.cropSlug === crop.slug).map((l) => ({
          id: l.id,
          village: l.village,
          weightKg: l.weightKg,
          lat: l.lat,
          lng: l.lng,
        }))
      : [];

    partners = partners
      .filter((p) => haversineKm(pickup, { lat: p.lat, lng: p.lng }) <= PLATFORM.poolRadiusKm)
      .slice(0, 5);

    if (data.demoMode && partners.length === 0) {
      const spread = [
        { village: `${data.villageName} Wasti`, dLat: 0.011, dLng: 0.009, factor: 0.9 },
        { village: `${data.villageName} Phata`, dLat: -0.009, dLng: 0.013, factor: 1.35 },
        { village: `${data.villageName} Mala`, dLat: 0.007, dLng: -0.014, factor: 0.8 },
      ];
      partners = spread.map((s, index) => ({
        id: `demo-neighbour-${index + 1}`,
        village: s.village,
        weightKg: Math.max(120, Math.round((data.weightKg * s.factor) / 10) * 10),
        lat: data.lat + s.dLat,
        lng: data.lng + s.dLng,
      }));
    }

    const vehicles = mockVehicles.map((v) => toVehicleProfile(v));

    return computeOptions({
      requestId: "self",
      cropId: crop.id,
      cropName: crop.name_en,
      spoilageHours: crop.spoilage_hours,
      weightKg: data.weightKg,
      village: data.villageName,
      pickup,
      partners,
      mandis,
      vehicles,
      commissionPercent: 3,
      fuel: {
        diesel: 99.07,
        petrol: 112.44,
      },
      demoMode: data.demoMode,
      delayMinutes: data.delayMinutes,
    });
  });
