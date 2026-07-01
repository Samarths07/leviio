import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformFeePercent } from "@/lib/billing";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Platform-wide stats across all tenants (super-admin only). */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-overview", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const count = async (table: string, filter?: (q: any) => any) => {
    let q = admin.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [creators, proCreators, clients, products, publishedProducts] = await Promise.all([
    count("profiles"),
    count("profiles", (q) => q.eq("plan", "Pro")),
    count("clients"),
    count("products"),
    count("products", (q) => q.eq("status", "Published")),
  ]);

  // Revenue + platform fee (fee depends on each creator's plan).
  const { data: orderRows } = await admin
    .from("orders")
    .select("amount, creator_id, status");
  const { data: planRows } = await admin.from("profiles").select("id, plan");
  const planById = new Map((planRows ?? []).map((p) => [p.id as string, p.plan as string]));

  let gmv = 0;
  let platformFees = 0;
  let completedOrders = 0;
  for (const o of orderRows ?? []) {
    if (o.status !== "Completed") continue;
    const amt = Number(o.amount) || 0;
    gmv += amt;
    completedOrders += 1;
    platformFees += amt * (platformFeePercent(planById.get(o.creator_id as string)) / 100);
  }

  return NextResponse.json({
    creators,
    proCreators,
    freeCreators: creators - proCreators,
    clients,
    products,
    publishedProducts,
    orders: completedOrders,
    gmv: Math.round(gmv),
    platformFees: Math.round(platformFees),
  });
}
