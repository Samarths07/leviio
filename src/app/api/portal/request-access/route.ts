import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * A signed-in client requests portal access. Flips their managed-client record
 * from 'none' (added by the coach, not yet signed up) to 'pending' so the coach
 * sees an Approve button. Keyed to the authenticated user's own email; never
 * touches 'approved' rows. Uses service-role because clients have no UPDATE
 * rights on their own row (prevents self-approval / tampering).
 */
export async function POST() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    await admin
      .from("clients")
      .update({ portal_status: "pending" })
      .ilike("email", user.email)
      .eq("portal_status", "none");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed." },
      { status: 500 }
    );
  }
}
