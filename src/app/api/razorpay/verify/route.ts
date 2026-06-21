import { NextResponse } from "next/server";
import {
  fetchRazorpayOrder,
  razorpayConfigured,
  verifyPaymentSignature,
} from "@/lib/razorpay/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { findDiscount } from "@/lib/mock-data";
import { newTrialExpiry } from "@/lib/utils";
import { PRO_PERIOD_DAYS } from "@/lib/billing";
import type { Fulfillment, ProductType } from "@/lib/types";

export const runtime = "nodejs";

function initialFulfillment(type: ProductType): Fulfillment {
  if (type === "Physical") return "Processing";
  if (type === "Service") return "Awaiting booking";
  return "Delivered";
}

/**
 * Verify a Razorpay payment signature, then fulfill it:
 *  - subscription → activate Pro for the signed-in creator.
 *  - storefront   → record the order(s) (amount re-checked against Razorpay).
 * All writes use the service-role client (orders may be placed anonymously).
 */
export async function POST(req: Request) {
  if (!razorpayConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const orderId = String(body.razorpay_order_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // ---- Pro subscription ---------------------------------------------------
  if (body.purpose === "subscription") {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const planExpiresAt = newTrialExpiry(PRO_PERIOD_DAYS);
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ plan: "Pro", trial: false, plan_expires_at: planExpiresAt })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: "Could not activate Pro." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, planExpiresAt });
  }

  // ---- Storefront purchase ------------------------------------------------
  if (body.purpose === "storefront") {
    const creatorId = String(body.creatorId ?? "");
    const items = Array.isArray(body.items) ? body.items : [];
    const discountCode = body.discountCode ? String(body.discountCode) : "";
    const customer = (body.customer ?? {}) as {
      name?: string;
      email?: string;
      address?: string;
    };
    if (!creatorId || items.length === 0) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }

    const admin = createAdminClient();
    const ids = items.map((i: { productId: unknown }) => String(i.productId));
    const { data: products } = await admin
      .from("products")
      .select("id, price, name, type")
      .eq("creator_id", creatorId)
      .eq("status", "Published")
      .in("id", ids);
    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No items." }, { status: 400 });
    }

    const percent = discountCode ? findDiscount(discountCode)?.percent ?? 0 : 0;
    const factor = 1 - percent / 100;

    let subtotal = 0;
    const lines: { id: string; name: string; type: ProductType; qty: number; price: number }[] = [];
    for (const it of items as { productId: unknown; quantity: unknown }[]) {
      const p = products.find((x) => x.id === String(it.productId));
      if (!p) continue;
      const qty = Math.max(1, Math.min(99, Number(it.quantity) || 1));
      subtotal += Number(p.price) * qty;
      lines.push({
        id: p.id as string,
        name: p.name as string,
        type: p.type as ProductType,
        qty,
        price: Number(p.price),
      });
    }

    // Cross-check the recomputed amount against what was actually paid.
    const expectedPaise = Math.round(subtotal * factor) * 100;
    const rzpOrder = await fetchRazorpayOrder(orderId);
    if (rzpOrder.amount !== expectedPaise) {
      return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
    }

    const date = new Date().toISOString().slice(0, 10);
    const stamp = Date.now().toString(36);
    const rows = lines.map((l, idx) => ({
      id: `LV-${stamp}-${idx}`,
      creator_id: creatorId,
      client_name: customer.name || "Guest",
      client_email: customer.email || null,
      product: l.name,
      product_id: l.id,
      type: l.type,
      quantity: l.qty,
      amount: Math.round(l.price * l.qty * factor),
      date,
      status: "Completed",
      method: "Razorpay",
      fulfillment: initialFulfillment(l.type),
      address: l.type === "Physical" ? customer.address || null : null,
    }));

    const { error } = await admin.from("orders").insert(rows);
    if (error) {
      return NextResponse.json({ error: "Could not record order." }, { status: 500 });
    }

    // Return app-shaped orders so the checkout modal can show delivery links.
    const orders = rows.map((r) => ({
      id: r.id,
      client: r.client_name,
      email: r.client_email ?? undefined,
      product: r.product,
      productId: r.product_id,
      type: r.type,
      quantity: r.quantity,
      amount: r.amount,
      date: r.date,
      status: r.status,
      method: r.method,
      fulfillment: r.fulfillment,
      address: r.address ?? undefined,
    }));
    return NextResponse.json({ ok: true, orders });
  }

  return NextResponse.json({ error: "Unknown purpose." }, { status: 400 });
}
