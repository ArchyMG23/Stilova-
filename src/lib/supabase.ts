import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Safe extraction of Vite environment variables
const metaEnv = (import.meta as any).env || {};

export let supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
export let supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

// assignable client instance
export let supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// flag to determine if the client is run with real configurations
export let hasRuntimeConfig = false;

export function initializeSupabase(url: string, anonKey: string): boolean {
  const isReal = url && 
    anonKey && 
    !url.includes("placeholder-project") && 
    !url.includes("your-supabase");

  if (isReal) {
    supabaseUrl = url;
    supabaseAnonKey = anonKey;
    supabase = createClient(url, anonKey);
    hasRuntimeConfig = true;
    console.log("[Supabase] Dynamically configured client using server-supplied credentials.");
    return true;
  }
  return false;
}

