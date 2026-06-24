import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Username-or-email login. When the identifier is a username we resolve it to
 * the account email server-side (so the email is never exposed), then sign in —
 * which sets the session cookies on the response. Email logins go through the
 * client directly; this route is used for the username path.
 */
export async function POST(req: Request) {
  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");
  if (!identifier || !password) {
    return NextResponse.json({ error: "Missing credentials." }, { status: 400 });
  }

  let email = identifier;
  if (!identifier.includes("@")) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("email")
      .eq("username", identifier.toLowerCase())
      .maybeSingle();
    if (!data?.email) {
      return NextResponse.json({ error: "Invalid login." }, { status: 400 });
    }
    email = data.email as string;
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: "Invalid login." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
