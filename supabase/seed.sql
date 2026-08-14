-- Seed data for Kopargaon MVP

-- 1. Crops
INSERT INTO public.crops (id, slug, name_en, name_hi, name_mr, perishable, spoilage_hours, crate_kg)
VALUES 
(gen_random_uuid(), 'onion', 'Onion', 'Pyaaz', 'Kanda', false, 336, 50),
(gen_random_uuid(), 'grapes', 'Grapes', 'Angoor', 'Draksha', true, 48, 20)
ON CONFLICT (slug) DO NOTHING;

-- 2. Mandis
INSERT INTO public.mandis (id, code, name, district, taluka, lat, lng, peak_hours, avg_gate_queue_minutes)
VALUES
(gen_random_uuid(), 'KOP', 'Kopargaon APMC', 'Ahmednagar', 'Kopargaon', 19.8833, 74.4833, '06:00-10:00', 45),
(gen_random_uuid(), 'RAH', 'Rahuri APMC', 'Ahmednagar', 'Rahuri', 19.4833, 74.4833, '07:00-11:00', 30),
(gen_random_uuid(), 'NSK', 'Nashik APMC', 'Nashik', 'Nashik', 20.1833, 73.9833, '05:00-12:00', 60)
ON CONFLICT (code) DO NOTHING;

-- 3. Mock Farmer Profiles (will need matching auth users in a real app, but for demo we can mock)
-- For the demo, we might just use the logged-in user, but let's insert a couple of dummy profiles just in case RLS allows reading them.
INSERT INTO public.profiles (id, full_name, phone, village, language, dpdp_consent)
VALUES
(gen_random_uuid(), 'Ramesh Patil', '+919800000001', 'Kopargaon Rural', 'mr', true),
(gen_random_uuid(), 'Suresh Deshmukh', '+919800000002', 'Rahuri Rural', 'mr', true)
ON CONFLICT DO NOTHING;
