import { NextResponse } from "next/server";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Creator provisions a portal login for a client they're adding: creates the
 * Supabase auth account with the password the creator chose, pre-confirmed so
 * the client can log in immediately (no email confirmation needed).
 *
 * Security: this ONLY creates brand-new accounts. If the email already has an
 * account we never touch its password (that would be account takeover) — we
 * just report it so the client uses their existing password / reset flow.
 * Creator-authenticated.
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "portal-provision", ...DEFAULT_LIMIT });
  if (limited) return limited;

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (!error) return NextResponse.json({ ok: true, created: true });

    // Already registered → leave their account untouched (no takeover).
    if (/already|registered|exists|duplicate/i.test(error.message)) {
      return NextResponse.json({ ok: true, existed: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't create the login." },
      { status: 500 }
    );
  }
}
