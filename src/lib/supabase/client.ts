import { createClient } from "@supabase/supabase-js";

// Note: Replace with actual Supabase project URL and anon key during deployment
const supabaseUrl = process.env['VITE_SUPABASE_URL'] || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env['VITE_SUPABASE_ANON_KEY'] || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
