import { NextResponse } from "next/server";
import {
  RAZORPAY_KEY_ID,
  createRazorpayOrder,
  razorpayConfigured,
} from "@/lib/razorpay/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { findDiscount } from "@/lib/mock-data";
import { PRO_PRICE_INR } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Create a Razorpay order. Amounts are always computed on the server so the
 * client can never tamper with prices.
 *
 *  - purpose "subscription" → fixed Pro price, tied to the signed-in creator.
 *  - purpose "storefront"   → sum of the creator's published product prices,
 *                             with an optional validated discount code.
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
  const purpose = body.purpose;

  // ---- Pro subscription ---------------------------------------------------
  if (purpose === "subscription") {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const order = await createRazorpayOrder(PRO_PRICE_INR * 100, {
      purpose: "subscription",
      userId: user.id,
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  }

  // ---- Storefront purchase ------------------------------------------------
  if (purpose === "storefront") {
    const creatorId = String(body.creatorId ?? "");
    const items = Array.isArray(body.items) ? body.items : [];
    const discountCode = body.discountCode ? String(body.discountCode) : "";
    if (!creatorId || items.length === 0) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }

    const admin = createAdminClient();
    const ids = items.map((i: { productId: unknown }) => String(i.productId));
    const { data: products } = await admin
      .from("products")
      .select("id, price")
      .eq("creator_id", creatorId)
      .eq("status", "Published")
      .in("id", ids);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No purchasable items." }, { status: 400 });
    }

    let subtotal = 0;
    for (const it of items as { productId: unknown; quantity: unknown }[]) {
      const p = products.find((x) => x.id === String(it.productId));
      if (!p) continue;
      const qty = Math.max(1, Math.min(99, Number(it.quantity) || 1));
      subtotal += Number(p.price) * qty;
    }

    const percent = discountCode ? findDiscount(discountCode)?.percent ?? 0 : 0;
    const amountInr = Math.round(subtotal * (1 - percent / 100));
    if (amountInr <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const order = await createRazorpayOrder(amountInr * 100, {
      purpose: "storefront",
      creatorId,
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  }

  return NextResponse.json({ error: "Unknown purpose." }, { status: 400 });
}
