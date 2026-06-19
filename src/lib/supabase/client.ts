import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components ("use client").
 *
 * Reads the public URL + anon key from env. These are safe to expose in the
 * browser; row-level security (see supabase/schema.sql) is what actually
 * protects the data.
 *
 * NOTE: The app currently runs on localStorage (see src/lib/store.tsx). This
 * helper is the foundation for migrating that state to Supabase — it is not
 * wired into the store yet.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
