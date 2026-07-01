import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformFeePercent, PRO_PRICE_INR } from "@/lib/billing";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Platform-wide stats + 6-month trends across all tenants (super-admin only). */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-overview", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: profiles }, { data: clients }, { data: products }, { data: orders }] =
    await Promise.all([
      admin.from("profiles").select("id, plan, created_at"),
      admin.from("clients").select("id"),
      admin.from("products").select("id, status"),
      admin.from("orders").select("amount, creator_id, status, date, created_at"),
    ]);

  const planById = new Map((profiles ?? []).map((p) => [p.id as string, (p.plan as string) ?? "Free"]));
  const creators = profiles?.length ?? 0;
  const proCreators = (profiles ?? []).filter((p) => p.plan === "Pro").length;

  let gmv = 0;
  let platformFees = 0;
  let completedOrders = 0;
  let refundedAmount = 0;
  const activeCreatorIds = new Set<string>();
  for (const o of orders ?? []) {
    const amt = Number(o.amount) || 0;
    if (o.status === "Refunded") {
      refundedAmount += amt;
      continue;
    }
    if (o.status !== "Completed") continue;
    gmv += amt;
    completedOrders += 1;
    activeCreatorIds.add(o.creator_id as string);
    platformFees += amt * (platformFeePercent(planById.get(o.creator_id as string)) / 100);
  }

  // 6-month trends (buckets keyed YYYY-MM).
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  const bucket = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const signupSeries = months.map((m) => ({
    label: m.label,
    value: (profiles ?? []).filter((p) => bucket(p.created_at as string) === m.key).length,
  }));
  const revenueSeries = months.map((m) => ({
    label: m.label,
    value: Math.round(
      (orders ?? [])
        .filter((o) => o.status === "Completed" && bucket((o.date as string) || (o.created_at as string)) === m.key)
        .reduce((s, o) => s + (Number(o.amount) || 0), 0)
    ),
  }));

  const thisMonthKey = months[months.length - 1].key;
  const newCreators30d = (profiles ?? []).filter((p) => bucket(p.created_at as string) === thisMonthKey).length;

  return NextResponse.json({
    creators,
    proCreators,
    freeCreators: creators - proCreators,
    clients: clients?.length ?? 0,
    products: products?.length ?? 0,
    publishedProducts: (products ?? []).filter((p) => p.status === "Published").length,
    orders: completedOrders,
    gmv: Math.round(gmv),
    platformFees: Math.round(platformFees),
    refundedAmount: Math.round(refundedAmount),
    mrr: proCreators * PRO_PRICE_INR,
    arpu: creators ? Math.round(gmv / creators) : 0,
    activeCreators: activeCreatorIds.size,
    newCreators30d,
    signupSeries,
    revenueSeries,
  });
}
