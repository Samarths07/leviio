import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Lightweight check the nav uses to decide whether to show the Admin link. */
export async function GET(req: Request) {
  const limited = guard(req, { name: "admin-session", ...DEFAULT_LIMIT });
  if (limited) return limited;
  const admin = await getAdminUser();
  return NextResponse.json({ admin: !!admin });
}
