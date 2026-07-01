import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Every creator with rolled-up counts + revenue (super-admin only). */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-creators", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: profiles }, { data: clients }, { data: products }, { data: orders }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, username, plan, created_at, razorpay_account_id")
        .order("created_at", { ascending: false }),
      admin.from("clients").select("creator_id"),
      admin.from("products").select("creator_id"),
      admin.from("orders").select("creator_id, amount, status"),
    ]);

  const tally = (rows: { creator_id?: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.creator_id ?? "", (m.get(r.creator_id ?? "") ?? 0) + 1);
    return m;
  };
  const clientCount = tally(clients);
  const productCount = tally(products);
  const revenue = new Map<string, number>();
  for (const o of orders ?? []) {
    if (o.status !== "Completed") continue;
    const id = o.creator_id ?? "";
    revenue.set(id, (revenue.get(id) ?? 0) + (Number(o.amount) || 0));
  }

  const creators = (profiles ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    email: p.email as string,
    username: p.username as string,
    plan: (p.plan as string) ?? "Free",
    createdAt: p.created_at as string,
    payoutsConnected: !!p.razorpay_account_id,
    clients: clientCount.get(p.id as string) ?? 0,
    products: productCount.get(p.id as string) ?? 0,
    revenue: Math.round(revenue.get(p.id as string) ?? 0),
  }));

  return NextResponse.json({ creators });
}
