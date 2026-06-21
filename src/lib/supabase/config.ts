import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Dual-mode switch for the whole app.
 *
 * When both public Supabase env vars are set, the store talks to Supabase
 * (real auth + database). When they are absent (e.g. local dev with no
 * project, or the demo deploy), the store falls back to localStorage + seed
 * data so the app still runs end-to-end. See src/lib/store.tsx.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon && /^https?:\/\//.test(url));
}

let browserClient: SupabaseClient | null = null;

/**
 * Singleton Supabase browser client for Client Components.
 * Returns null when Supabase isn't configured (mock mode).
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(url!, anon!);
  }
  return browserClient;
}
