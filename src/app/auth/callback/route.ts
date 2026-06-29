import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Auth callback — exchanges the one-time `code` (Google OAuth or an email link)
 * for a session, then routes by `role`:
 *   role=creator → ensure a profile exists (create on first sign-in) → /dashboard
 *   role=client  → /portal (no profile; matched to a managed client by email)
 * Redirects back to the SAME origin it was called on so the creator/portal
 * subdomain split is preserved. Required for the PKCE flow used by @supabase/ssr.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const role = url.searchParams.get("role");
  const next = url.searchParams.get("next") || (role === "creator" ? "/dashboard" : "/portal");
  const base = url.origin;

  if (code) {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      if (role === "creator") await ensureCreatorProfile(supabase, data.user);
      return NextResponse.redirect(`${base}${next}`);
    }
  }
  const loginPath = role === "creator" ? "/login" : "/portal/login";
  return NextResponse.redirect(`${base}${loginPath}?error=auth`);
}

/** Create a creator profile on first Google sign-in if one doesn't exist. */
async function ensureCreatorProfile(supabase: SupabaseClient, user: User) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const name = meta.full_name || meta.name || user.email?.split("@")[0] || "Creator";
  const base =
    (meta.user_name || name).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "creator";
  const trialExpiry = new Date(Date.now() + 30 * 86400000).toISOString();
  const row = {
    id: user.id,
    name,
    email: user.email ?? "",
    niche: "",
    bio: "",
    location: "",
    avatar_seed: name,
    avatar_url: meta.avatar_url || meta.picture || "",
    banner_color: "#7c3aed",
    followers: 0,
    plan: "Pro",
    trial: true,
    plan_expires_at: trialExpiry,
    socials: {},
  };

  let username = base;
  for (let i = 0; i < 3; i++) {
    const { error } = await supabase.from("profiles").insert({ ...row, username });
    if (!error) return;
    if (/duplicate|unique/i.test(error.message)) {
      username = `${base}${Math.floor(Math.random() * 9000 + 1000)}`.slice(0, 20);
      continue;
    }
    return; // other error — leave; the login flow can retry
  }
}
