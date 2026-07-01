import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** All orders across the platform, newest first (admin only). */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-orders", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: orders }, { data: profiles }] = await Promise.all([
    admin
      .from("orders")
      .select("id, creator_id, client_name, client_email, product, type, amount, status, method, date")
      .order("date", { ascending: false })
      .limit(500),
    admin.from("profiles").select("id, name, username"),
  ]);
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const rows = (orders ?? []).map((o) => {
    const c = byId.get(o.creator_id as string);
    return {
      ...o,
      creatorName: (c?.name as string) ?? "—",
      creatorUsername: (c?.username as string) ?? "",
    };
  });
  return NextResponse.json({ orders: rows });
}

/** { action: "refund", id } — marks an order Refunded (admin only). */
export async function POST(req: Request) {
  const limited = guard(req, { name: "admin-orders-action", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const action = String(body.action ?? "");
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing order id." }, { status: 400 });

  const admin = createAdminClient();
  if (action === "refund") {
    const { error } = await admin.from("orders").update({ status: "Refunded" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
