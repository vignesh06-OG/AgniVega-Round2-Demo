import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use environment variables or fallback to those from .env
const supabaseUrl = process.env.SUPABASE_URL || "https://kxidgtvjapeezoysncyx.supabase.co";
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_m9TbYztVvFrIQCAix94qCg_IXX6L3Sc";

const supabase = createClient(supabaseUrl, supabaseKey);

const KOPARGAON_CENTER = { lat: 19.8833, lng: 74.4833 };

function randomOffset(base: number, maxOffsetKm: number) {
  // 1 degree is roughly 111km
  const offsetDeg = maxOffsetKm / 111;
  return base + (Math.random() * 2 - 1) * offsetDeg;
}

async function seed() {
  console.log("Seeding Kopargaon data...");

  // 1. Mandis
  const mandis = [
    {
      id: crypto.randomUUID(),
      code: "KOP",
      name: "Kopargaon APMC",
      district: "Ahmednagar",
      taluka: "Kopargaon",
      lat: KOPARGAON_CENTER.lat,
      lng: KOPARGAON_CENTER.lng,
      peak_hours: "06:00-10:00",
      avg_gate_queue_minutes: 45,
    },
    {
      id: crypto.randomUUID(),
      code: "RAH",
      name: "Rahuri APMC",
      district: "Ahmednagar",
      taluka: "Rahuri",
      lat: KOPARGAON_CENTER.lat - 0.4,
      lng: KOPARGAON_CENTER.lng,
      peak_hours: "07:00-11:00",
      avg_gate_queue_minutes: 30,
    },
    {
      id: crypto.randomUUID(),
      code: "NSK",
      name: "Nashik APMC",
      district: "Nashik",
      taluka: "Nashik",
      lat: KOPARGAON_CENTER.lat + 0.3,
      lng: KOPARGAON_CENTER.lng - 0.5,
      peak_hours: "05:00-12:00",
      avg_gate_queue_minutes: 60,
    },
  ];

  const { error: mandiError } = await supabase
    .from("mandis")
    .upsert(mandis, { onConflict: "code" });
  if (mandiError) console.error("Error inserting mandis:", mandiError);
  else console.log("Inserted Mandis");

  // 2. Crops
  const crops = [
    {
      id: crypto.randomUUID(),
      slug: "onion",
      name_en: "Onion",
      name_hi: "Pyaaz",
      name_mr: "Kanda",
      perishable: false,
      spoilage_hours: 336, // 14 days
      crate_kg: 50,
    },
    {
      id: crypto.randomUUID(),
      slug: "grapes",
      name_en: "Grapes",
      name_hi: "Angoor",
      name_mr: "Draksha",
      perishable: true,
      spoilage_hours: 48,
      crate_kg: 20,
    },
  ];

  const { error: cropError } = await supabase.from("crops").upsert(crops, { onConflict: "slug" });
  if (cropError) console.error("Error inserting crops:", cropError);
  else console.log("Inserted Crops");

  // 3. Profiles (Farmers)
  // We cannot easily insert profiles without auth.users, but we might be able to insert them directly
  // if RLS allows or if it's disabled. Let's try to insert 10 mock farmers.
  const profiles = Array.from({ length: 10 }).map((_, i) => ({
    id: crypto.randomUUID(),
    full_name: `Farmer ${i + 1}`,
    phone: `+9198000000${i.toString().padStart(2, "0")}`,
    village: "Kopargaon Rural",
    language: "mr",
    dpdp_consent: true,
  }));

  const { error: profileError } = await supabase.from("profiles").insert(profiles);
  if (profileError) console.error("Error inserting profiles:", profileError.message);
  else console.log("Inserted Profiles (Farmers)");

  console.log("Seeding complete.");
}

seed();
