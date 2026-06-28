import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * A signed-in client requests portal access. Flips their managed-client record
 * from 'none' (added by the coach, not yet signed up) to 'pending' so the coach
 * sees an Approve button. portalStatus lives inside the clients.metrics jsonb,
 * so this read-modify-writes that column. Keyed to the authenticated user's own
 * email; never touches 'approved'/'pending' rows. Uses service-role because
 * clients have no UPDATE rights on their own row (prevents self-approval).
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
    const { data: rows } = await admin
      .from("clients")
      .select("id, metrics")
      .ilike("email", user.email);

    for (const row of rows ?? []) {
      const metrics = (row.metrics ?? {}) as Record<string, unknown>;
      const status = (metrics.portalStatus as string) ?? "none";
      if (status === "none") {
        await admin
          .from("clients")
          .update({ metrics: { ...metrics, portalStatus: "pending" } })
          .eq("id", row.id);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed." },
      { status: 500 }
    );
  }
}
