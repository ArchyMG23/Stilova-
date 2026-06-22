import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Helper functions to robustly sanitize environment keys (removes surrounding quotes, trailing slashes, and whitespace)
function sanitizeConfigValue(val: string): string {
  if (!val) return "";
  let clean = val.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.substring(1, clean.length - 1);
  }
  return clean.trim();
}

function sanitizeSupabaseUrl(url: string): string {
  let clean = sanitizeConfigValue(url);
  // Strip any trailing slashes to avoid issues like: https://xxxx.supabase.co//storage/v1/bucket
  clean = clean.replace(/\/+$/, "");
  return clean;
}

function sanitizeSupabaseAnonKey(key: string): string {
  return sanitizeConfigValue(key);
}

// Safe extraction of Vite environment variables
const metaEnv = (import.meta as any).env || {};

export let supabaseUrl = sanitizeSupabaseUrl(metaEnv.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co");
export let supabaseAnonKey = sanitizeSupabaseAnonKey(metaEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key");

// assignable client instance
export let supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// flag to determine if the client is run with real configurations
export let hasRuntimeConfig = false;

// Dynamic bucket redirection / remapping table
export let bucketRemapTable: Record<string, string> = {};

export function getCleanBucket(bucketName: string): string {
  return bucketRemapTable[bucketName] || bucketName;
}

export function initializeSupabase(url: string, anonKey: string): boolean {
  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = sanitizeSupabaseAnonKey(anonKey);

  const isReal = cleanUrl && 
    cleanKey && 
    !cleanUrl.includes("placeholder-project") && 
    !cleanUrl.includes("your-supabase");

  if (isReal) {
    supabaseUrl = cleanUrl;
    supabaseAnonKey = cleanKey;
    supabase = createClient(cleanUrl, cleanKey);
    hasRuntimeConfig = true;
    console.log("[Supabase] Dynamically configured client using server-supplied credentials. URL:", cleanUrl);
    // Run real audit after dynamic configuration is applied
    runSupabaseAudit().catch(err => {
      console.warn("[Supabase] Post-initialization audit warning/deferred:", err);
    });
    return true;
  }
  return false;
}

export interface SupabaseAuditReport {
  viteUrlEnv: string;
  actualUrlUsed: string;
  coversBucket: string;
  avatarsBucket: string;
  illustrationsBucket: string;
  connectionSuccess: boolean;
  connectionError: string | null;
  bucketsStatus: Record<string, boolean>;
  remappedBuckets: Record<string, string>;
}

// ----------------------------------------------------
// REAL-TIME COMPREHENSIVE SUPABASE STORAGE AUDIT RUNNER
// ----------------------------------------------------
export async function runSupabaseAudit(): Promise<SupabaseAuditReport> {
  const isRealUrl = supabaseUrl && 
    !supabaseUrl.includes("placeholder-project") && 
    !supabaseUrl.includes("your-supabase");

  const report: SupabaseAuditReport = {
    viteUrlEnv: metaEnv.VITE_SUPABASE_URL || "Non configuré (env)",
    actualUrlUsed: supabaseUrl,
    coversBucket: "covers",
    avatarsBucket: "avatars",
    illustrationsBucket: "illustrations",
    connectionSuccess: false,
    connectionError: null,
    bucketsStatus: {
      "covers": false,
      "avatars": false,
      "illustrations": false,
      "chapters": false,
      "contests": false,
      "system-assets": false
    },
    remappedBuckets: {}
  };

  console.log("%c=========================================SUPABASE AUDIT=========================================", "color: #3b82f6; font-weight: bold;");
  console.log(`- VITE_SUPABASE_URL    : ${report.viteUrlEnv}`);
  console.log(`- URL Réellement Utilisée: ${report.actualUrlUsed}`);
  console.log(`- Bucket Couvertures   : ${report.coversBucket}`);
  console.log(`- Bucket Avatars       : ${report.avatarsBucket}`);
  console.log(`- Bucket Illustrations  : ${report.illustrationsBucket}`);
  console.log("%c-------------------------------------------------------------------------------------------------", "color: #3b82f6;");

  if (!isRealUrl) {
    const errStr = "Client Supabase configuré avec des placeholders génériques. Connexion réelle impossible.";
    report.connectionError = errStr;
    console.warn(`[Supabase Audit] ✗ Erreur connexion : ${errStr}`);
    console.log("%c=================================================================================================", "color: #3b82f6; font-weight: bold;");
    return report;
  }

  try {
    console.log("[Supabase Audit] Tentative d'appel natif : supabase.storage.listBuckets()...");
    const { data: bucketsData, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      report.connectionError = listError.message;
      console.error(`[Supabase Audit] ✗ Échec listBuckets : ${listError.message}`, listError);
    } else {
      report.connectionSuccess = true;
      console.log("[Supabase Audit] ✓ Connexion buckets validée. Réponse brute :", bucketsData);

      const availableNames = new Set(bucketsData?.map(b => b.name) || []);
      const expectedBuckets = ["covers", "avatars", "illustrations", "chapters", "contests", "system-assets"];
      
      expectedBuckets.forEach(bName => {
        report.bucketsStatus[bName] = availableNames.has(bName);
        console.log(`- Bucket "${bName}" : ${availableNames.has(bName) ? "✓ EXISTE" : "✗ ABSENT"}`);
      });

      // Point 4 of user requests: Correct the code automatically to use existing buckets if referenced one is non-existing
      const validNamesList = Array.from(availableNames);
      if (validNamesList.length > 0) {
        expectedBuckets.forEach(bName => {
          if (!availableNames.has(bName)) {
            // Remap missing bucket to first available or standard existing
            const fallback = validNamesList.includes("system-assets") ? "system-assets" : (validNamesList[0] || bName);
            bucketRemapTable[bName] = fallback;
            report.remappedBuckets[bName] = fallback;
            console.warn(`[Supabase Audit] Bucket manquant : "${bName}" redirigé dynamiquement vers "${fallback}"`);
          }
        });
      } else {
        console.warn("[Supabase Audit] Attention : Aucun bucket existant n'est configuré dans votre instance Supabase Storage.");
      }
    }
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    report.connectionError = rawMsg;
    console.error("[Supabase Audit] Fatal unhandled exception during audit execution:", err);
  }

  console.log("%c=================================================================================================", "color: #3b82f6; font-weight: bold;");
  return report;
}

// Automatically trigger on module load to complete standard diagnostic audit on startup
runSupabaseAudit().catch(err => {
  console.warn("[Supabase Startup Audit] Self-execution error deferred:", err);
});
