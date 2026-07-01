import { NextResponse } from "next/server";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Permanently delete the signed-in creator's account. Deleting the auth user
 * cascades to their profile and all owned data (clients, products, plans,
 * programs, events, orders) via on-delete-cascade FKs. Self-service only —
 * keyed strictly to the authenticated user's own id.
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "account-delete", ...DEFAULT_LIMIT });
  if (limited) return limited;

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't delete the account." },
      { status: 500 }
    );
  }
}
