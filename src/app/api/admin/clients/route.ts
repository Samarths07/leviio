import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** All clients across the platform, read-only directory (admin only). */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-clients", ...DEFAULT_LIMIT });
  if (limited) return limited;
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: clients }, { data: profiles }] = await Promise.all([
    admin
      .from("clients")
      .select("id, creator_id, name, email, phone, goal, status, start_date")
      .order("start_date", { ascending: false })
      .limit(500),
    admin.from("profiles").select("id, name, username"),
  ]);
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const rows = (clients ?? []).map((c) => {
    const cr = byId.get(c.creator_id as string);
    return {
      ...c,
      creatorName: (cr?.name as string) ?? "—",
      creatorUsername: (cr?.username as string) ?? "",
    };
  });
  return NextResponse.json({ clients: rows });
}
