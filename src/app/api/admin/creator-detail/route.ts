import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformFeePercent } from "@/lib/billing";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Deep-dive on a single creator: profile, recent orders, top products, clients. */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-creator-detail", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: orders }, { data: products }, { data: clients }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", id).maybeSingle(),
      admin.from("orders").select("id, product, client_name, amount, status, date").eq("creator_id", id).order("date", { ascending: false }).limit(20),
      admin.from("products").select("id, name, type, price, status").eq("creator_id", id).order("created_at", { ascending: false }).limit(20),
      admin.from("clients").select("id, name, email, status, goal, start_date").eq("creator_id", id).order("start_date", { ascending: false }).limit(20),
    ]);

  if (!profile) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

  const completed = (orders ?? []).filter((o) => o.status === "Completed");
  const revenue = completed.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const feePct = platformFeePercent(profile.plan as string);

  return NextResponse.json({
    profile: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      username: profile.username,
      niche: profile.niche,
      plan: profile.plan,
      planExpiresAt: profile.plan_expires_at,
      followers: profile.followers,
      createdAt: profile.created_at,
      payoutsConnected: !!profile.razorpay_account_id,
    },
    revenue: Math.round(revenue),
    platformFees: Math.round(revenue * (feePct / 100)),
    feePct,
    orders: orders ?? [],
    products: products ?? [],
    clients: clients ?? [],
  });
}
