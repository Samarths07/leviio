import { NextResponse } from "next/server";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";
import {
  RAZORPAY_KEY_ID,
  createRazorpayOrder,
  razorpayConfigured,
} from "@/lib/razorpay/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { PRO_PRICE_INR, platformFeePercent } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Create a Razorpay order. Amounts are always computed on the server so the
 * client can never tamper with prices.
 *
 *  - purpose "subscription" → fixed Pro price, tied to the signed-in creator.
 *  - purpose "storefront"   → sum of the creator's published product prices.
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "rzp-order", ...DEFAULT_LIMIT });
  if (limited) return limited;

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
    if (!creatorId || items.length === 0) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }

    const admin = createAdminClient();

    // The creator must have connected payouts (Razorpay Route linked account)
    // so funds reach them — otherwise we don't let money pool in the platform.
    const { data: prof } = await admin
      .from("profiles")
      .select("razorpay_account_id, plan")
      .eq("id", creatorId)
      .maybeSingle();
    const linkedAccount = (prof?.razorpay_account_id as string) || "";
    const feePercent = platformFeePercent(prof?.plan as string | undefined);
    if (!linkedAccount) {
      return NextResponse.json(
        { error: "This store hasn't set up payouts yet, so checkout is unavailable." },
        { status: 400 }
      );
    }

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
    const compact: string[] = [];
    for (const it of items as { productId: unknown; quantity: unknown }[]) {
      const p = products.find((x) => x.id === String(it.productId));
      if (!p) continue;
      const qty = Math.max(1, Math.min(99, Number(it.quantity) || 1));
      subtotal += Number(p.price) * qty;
      compact.push(`${p.id}:${qty}`);
    }

    const amountInr = Math.round(subtotal);
    if (amountInr <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    // Store the full intent in notes so the webhook can fulfill it server-side
    // even if the buyer never returns to the browser. (256 chars/field.)
    const customer = (body.customer ?? {}) as {
      name?: string;
      email?: string;
      address?: string;
    };
    // Route split: send the creator their share, platform keeps the commission.
    const totalPaise = amountInr * 100;
    const creatorPaise = Math.round(totalPaise * (1 - feePercent / 100));
    const order = await createRazorpayOrder(
      totalPaise,
      {
        purpose: "storefront",
        creatorId,
        items: compact.join(",").slice(0, 256),
        name: (customer.name ?? "").slice(0, 120),
        email: (customer.email ?? "").slice(0, 120),
        address: (customer.address ?? "").slice(0, 200),
      },
      [
        {
          account: linkedAccount,
          amount: creatorPaise,
          currency: "INR",
          on_hold: 0,
          notes: { creatorId },
        },
      ]
    );
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  }

  return NextResponse.json({ error: "Unknown purpose." }, { status: 400 });
}
