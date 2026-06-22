import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "product-files";

/**
 * Issue a short-lived signed download URL for a digital product's file — only
 * to the buyer. Verifies the signed-in portal client's email matches the order,
 * then signs the private file with the service-role client.
 */
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json(
      { error: "Sign in to your portal to download." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("client_email, product_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (String(order.client_email ?? "").toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "This purchase isn't on your account." }, { status: 403 });
  }
  if (!order.product_id) {
    return NextResponse.json({ error: "No file for this item." }, { status: 404 });
  }

  const { data: product } = await admin
    .from("products")
    .select("meta")
    .eq("id", order.product_id)
    .maybeSingle();
  const filePath = (product?.meta as { filePath?: string } | null)?.filePath;
  if (!filePath) {
    return NextResponse.json(
      { error: "No downloadable file yet — contact your coach." },
      { status: 404 }
    );
  }

  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 120, { download: true });
  if (error || !signed) {
    return NextResponse.json({ error: "Couldn't generate download." }, { status: 500 });
  }
  return NextResponse.json({ url: signed.signedUrl });
}
