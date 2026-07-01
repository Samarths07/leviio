import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Platform super-admin gate. Admins are listed in ADMIN_EMAILS (comma-separated,
 * server-only env). Never exposed to the client — checked in admin API routes.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Returns the signed-in user if they're a platform admin, else null. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && isAdminEmail(user.email) ? user : null;
}
