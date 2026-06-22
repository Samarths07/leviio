import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/db";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { portalInviteEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

/** Send a real client-portal invite email. Creator-authenticated. */
export async function POST(req: Request) {
  if (!emailConfigured()) {
    return NextResponse.json({ error: "Email isn't configured." }, { status: 503 });
  }
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String(body.email ?? "").trim();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const profile = await getProfile(supabase, user.id);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const tmpl = portalInviteEmail({
    coachName: profile?.name || "Your coach",
    portalUrl: `${base}/portal/login`,
    storeUrl: `${base}/${profile?.username ?? ""}`,
  });
  const res = await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
  if (!res.ok) return NextResponse.json({ error: res.error ?? "Send failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
