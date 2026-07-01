import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** All products across the platform (admin moderation). */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-products", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: products }, { data: profiles }] = await Promise.all([
    admin
      .from("products")
      .select("id, creator_id, name, type, category, price, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("profiles").select("id, name, username"),
  ]);
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const rows = (products ?? []).map((p) => {
    const c = byId.get(p.creator_id as string);
    return {
      ...p,
      creatorName: (c?.name as string) ?? "—",
      creatorUsername: (c?.username as string) ?? "",
    };
  });
  return NextResponse.json({ products: rows });
}

/**
 * Moderation actions (admin only):
 *   { action: "unpublish" | "publish", id }
 *   { action: "delete", id }
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "admin-products-action", ...DEFAULT_LIMIT });
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
  if (!id) return NextResponse.json({ error: "Missing product id." }, { status: 400 });

  const admin = createAdminClient();
  if (action === "unpublish" || action === "publish") {
    const status = action === "publish" ? "Published" : "Draft";
    const { error } = await admin.from("products").update({ status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    const { error } = await admin.from("products").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
