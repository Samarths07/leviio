import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToClient } from "@/lib/supabase/db";

export const runtime = "nodejs";

/**
 * Resolve the signed-in client's own managed record using service-role, so it
 * works even if the "client reads self" RLS policy isn't present. Returns the
 * client (mapped) + the owning creator id, or { client: null } for buyers who
 * aren't managed clients. Keyed strictly to the authenticated user's email.
 */
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ client: null }, { status: 200 });

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("clients")
      .select("*")
      .ilike("email", user.email)
      .limit(1);
    const row = data?.[0];
    if (!row) return NextResponse.json({ client: null });
    return NextResponse.json({ client: rowToClient(row), coachId: row.creator_id });
  } catch {
    // Service-role unavailable — caller falls back to the RLS read.
    return NextResponse.json({ client: null });
  }
}
