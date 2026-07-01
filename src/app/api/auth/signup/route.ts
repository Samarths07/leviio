import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guard, AUTH_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Creator signup — creates the auth account with the email pre-confirmed (so the
 * creator can log in immediately, no "confirm your email" step) and seeds their
 * profile row. Public route. Falls back to the normal client signUp flow on the
 * caller side if this isn't available (e.g. service-role not configured).
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "auth-signup", ...AUTH_LIMIT });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const niche = String(body.niche ?? "").slice(0, 60);
  const baseUsername =
    String(body.username ?? "").trim() ||
    name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) ||
    "creator";

  if (name.length < 2) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // Service role not configured — let the caller fall back to client signUp.
    return NextResponse.json({ error: "fallback" }, { status: 503 });
  }

  // Create the auth user, pre-confirmed.
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, username: baseUsername },
  });
  if (error) {
    if (/already|registered|exists|duplicate/i.test(error.message)) {
      return NextResponse.json(
        { error: "An account with this email already exists. Log in instead." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const userId = created.user?.id;
  if (!userId) return NextResponse.json({ error: "Couldn't create the account." }, { status: 500 });

  // Seed the profile (unique username — append a suffix if taken).
  const trialExpiry = new Date(Date.now() + 30 * 86400000).toISOString();
  const baseRow = {
    id: userId,
    name,
    email,
    niche,
    bio: "",
    location: "",
    avatar_seed: name,
    banner_color: "#7c3aed",
    followers: 0,
    plan: "Pro",
    trial: true,
    plan_expires_at: trialExpiry,
    socials: {},
  };
  let username = baseUsername;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error: pErr } = await admin.from("profiles").insert({ ...baseRow, username });
    if (!pErr) return NextResponse.json({ ok: true });
    if (/duplicate|unique/i.test(pErr.message) && /username/i.test(pErr.message)) {
      username = `${baseUsername}${Math.floor(Math.random() * 9000 + 1000)}`.slice(0, 20);
      continue;
    }
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Couldn't pick a unique username." }, { status: 500 });
}
