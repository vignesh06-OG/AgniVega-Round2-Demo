import type { LatLng } from "./geo";

export interface DemoLoad {
  id: string;
  village: string;
  cropSlug: string;
  weightKg: number;
  lat: number;
  lng: number;
  createdHoursAgo: number;
  emergency: boolean;
}

/**
 * Deterministic pre-seeded loads for Kopargaon, Rahata and Shirdi. Served when
 * the caller sends `X-Demo-Mode: true` so a jury demo never depends on live
 * farmer traffic.
 */
export const DEMO_LOADS: DemoLoad[] = [
  {
    id: "demo-1",
    village: "Pohegaon",
    cropSlug: "onion",
    weightKg: 520,
    lat: 19.8342,
    lng: 74.5231,
    createdHoursAgo: 1,
    emergency: false,
  },
  {
    id: "demo-2",
    village: "Ravande",
    cropSlug: "onion",
    weightKg: 380,
    lat: 19.945,
    lng: 74.501,
    createdHoursAgo: 2,
    emergency: false,
  },
  {
    id: "demo-3",
    village: "Sanjivani Nagar",
    cropSlug: "onion",
    weightKg: 610,
    lat: 19.9021,
    lng: 74.4419,
    createdHoursAgo: 1,
    emergency: false,
  },
  {
    id: "demo-4",
    village: "Rahata",
    cropSlug: "tomato",
    weightKg: 240,
    lat: 19.71,
    lng: 74.48,
    createdHoursAgo: 3,
    emergency: true,
  },
  {
    id: "demo-5",
    village: "Shirdi",
    cropSlug: "tomato",
    weightKg: 310,
    lat: 19.7645,
    lng: 74.4762,
    createdHoursAgo: 2,
    emergency: false,
  },
  {
    id: "demo-6",
    village: "Loni Budruk",
    cropSlug: "pomegranate",
    weightKg: 450,
    lat: 19.61,
    lng: 74.45,
    createdHoursAgo: 4,
    emergency: false,
  },
  {
    id: "demo-7",
    village: "Kopargaon",
    cropSlug: "grapes",
    weightKg: 280,
    lat: 19.8833,
    lng: 74.4778,
    createdHoursAgo: 1,
    emergency: false,
  },
  {
    id: "demo-8",
    village: "Yeola",
    cropSlug: "soybean",
    weightKg: 900,
    lat: 20.042,
    lng: 74.489,
    createdHoursAgo: 5,
    emergency: false,
  },
  {
    id: "demo-9",
    village: "Lasalgaon",
    cropSlug: "onion",
    weightKg: 1200,
    lat: 20.145,
    lng: 74.238,
    createdHoursAgo: 2,
    emergency: false,
  },
  {
    id: "demo-10",
    village: "Niphad",
    cropSlug: "grapes",
    weightKg: 340,
    lat: 20.08,
    lng: 74.11,
    createdHoursAgo: 3,
    emergency: false,
  },
];

export const DEMO_CENTER: LatLng = { lat: 19.8833, lng: 74.4778 };

/** Deterministic return-cargo offers used by the zero-empty-miles matcher. */
export const DEMO_RETURN_LOADS = [
  {
    id: "ret-1",
    from: "Nashik APMC",
    to: "Kopargaon",
    cargo: "Fertiliser bags",
    weightKg: 900,
    payout: 2100,
  },
  {
    id: "ret-2",
    from: "Lasalgaon APMC",
    to: "Rahata",
    cargo: "Empty crates",
    weightKg: 400,
    payout: 950,
  },
  {
    id: "ret-3",
    from: "Shirdi Market Yard",
    to: "Pohegaon",
    cargo: "Cattle feed",
    weightKg: 1200,
    payout: 2600,
  },
];
