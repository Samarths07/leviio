import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guard, AUTH_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * First-login account creation for a coach-added client.
 *
 * Unauthenticated by necessity (the client has no session yet). It will ONLY
 * create an auth account when the email already exists as a managed client
 * (i.e. a creator added them) AND no auth account exists yet. It never changes
 * an existing account's password (no takeover). This lets a client's first
 * sign-in set their own password without the coach having to pre-provision it.
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "portal-claim", ...AUTH_LIMIT });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Login setup isn't available right now. Ask your coach." },
      { status: 503 }
    );
  }

  // Only emails a creator has added as a client can claim an account here.
  const { data: clientRows } = await admin
    .from("clients")
    .select("id")
    .ilike("email", email)
    .limit(1);
  if (!clientRows?.length) {
    return NextResponse.json(
      { ok: false, error: "This email isn't set up by a coach yet." },
      { status: 404 }
    );
  }

  // Create the account (pre-confirmed). If it already exists, leave it untouched.
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error) return NextResponse.json({ ok: true, created: true });
  if (/already|registered|exists|duplicate/i.test(error.message)) {
    return NextResponse.json({ ok: false, existed: true });
  }
  return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
}
