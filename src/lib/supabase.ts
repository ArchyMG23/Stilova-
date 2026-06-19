import { createClient } from "@supabase/supabase-js";

// Safe extraction of Vite environment variables
const metaEnv = (import.meta as any).env || {};
export const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
export const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
