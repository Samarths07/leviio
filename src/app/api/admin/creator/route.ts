import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Super-admin actions on a creator:
 *   { action: "setPlan", id, plan: "Free"|"Pro" }
 *   { action: "delete",  id }  → deletes the auth user (cascades all their data)
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "admin-creator", ...DEFAULT_LIMIT });
  if (limited) return limited;

  const me = await getAdminUser();
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const action = String(body.action ?? "");
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing creator id." }, { status: 400 });
  if (id === me.id && action === "delete") {
    return NextResponse.json({ error: "You can't delete your own admin account here." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "setPlan") {
    const plan = body.plan === "Pro" ? "Pro" : "Free";
    const update: Record<string, unknown> = { plan };
    if (plan === "Pro") {
      update.trial = false;
      update.plan_expires_at = new Date(Date.now() + 3650 * 86400000).toISOString();
    } else {
      update.trial = false;
      update.plan_expires_at = null;
    }
    const { error } = await admin.from("profiles").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
