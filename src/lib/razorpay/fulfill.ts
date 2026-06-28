import { fetchRazorpayOrder } from "./server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToOrder } from "@/lib/supabase/db";
import { newTrialExpiry } from "@/lib/utils";
import { PRO_PERIOD_DAYS } from "@/lib/billing";
import { sendEmail } from "@/lib/email/send";
import { orderReceiptEmail } from "@/lib/email/templates";
import type { Fulfillment, Order, ProductType } from "@/lib/types";

/**
 * Single source of truth for fulfilling a paid Razorpay order. Called by BOTH
 * the browser verify route and the webhook, so fulfillment is reliable even if
 * the buyer closes the tab. Idempotent: re-running won't duplicate orders or
 * re-charge anything. All order intent is read from the order's `notes` (set
 * server-side at creation), never from the client.
 */
function initialFulfillment(type: ProductType): Fulfillment {
  if (type === "Physical") return "Processing";
  if (type === "Service") return "Awaiting booking";
  return "Delivered";
}

export interface FulfillResult {
  ok: boolean;
  orders?: Order[];
  error?: string;
}

export async function fulfillRazorpayOrder(orderId: string): Promise<FulfillResult> {
  const rzp = await fetchRazorpayOrder(orderId);
  if (rzp.status !== "paid") return { ok: false, error: "Order not paid yet." };

  const notes = rzp.notes ?? {};
  const admin = createAdminClient();

  // ---- Pro subscription ---------------------------------------------------
  if (notes.purpose === "subscription") {
    if (!notes.userId) return { ok: false, error: "Missing user." };
    const planExpiresAt = newTrialExpiry(PRO_PERIOD_DAYS);
    const { error } = await admin
      .from("profiles")
      .update({ plan: "Pro", trial: false, plan_expires_at: planExpiresAt })
      .eq("id", notes.userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  // ---- Storefront purchase ------------------------------------------------
  if (notes.purpose === "storefront") {
    const creatorId = notes.creatorId;
    if (!creatorId) return { ok: false, error: "Missing creator." };

    // Idempotent: if this Razorpay order was already recorded, return those rows.
    const { data: existing } = await admin
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", orderId);
    if (existing && existing.length) {
      return { ok: true, orders: existing.map(rowToOrder) };
    }

    // Parse the compact "productId:qty,productId:qty" list from notes.
    const parsed = (notes.items ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [productId, qty] = s.split(":");
        return { productId, quantity: Math.max(1, Math.min(99, Number(qty) || 1)) };
      });
    if (parsed.length === 0) return { ok: false, error: "No items." };

    const ids = parsed.map((p) => p.productId);
    const { data: products } = await admin
      .from("products")
      .select("id, price, name, type")
      .eq("creator_id", creatorId)
      .eq("status", "Published")
      .in("id", ids);
    if (!products || products.length === 0) return { ok: false, error: "No items." };

    let subtotal = 0;
    const lines: { id: string; name: string; type: ProductType; qty: number; price: number }[] = [];
    for (const it of parsed) {
      const p = products.find((x) => x.id === it.productId);
      if (!p) continue;
      subtotal += Number(p.price) * it.quantity;
      lines.push({
        id: p.id as string,
        name: p.name as string,
        type: p.type as ProductType,
        qty: it.quantity,
        price: Number(p.price),
      });
    }

    // Cross-check the recomputed amount against what was actually paid.
    const expectedPaise = Math.round(subtotal) * 100;
    if (rzp.amount !== expectedPaise) return { ok: false, error: "Amount mismatch." };

    const date = new Date().toISOString().slice(0, 10);
    const stamp = Date.now().toString(36);
    const rows = lines.map((l, idx) => ({
      id: `LV-${stamp}-${idx}`,
      creator_id: creatorId,
      razorpay_order_id: orderId,
      client_name: notes.name || "Guest",
      client_email: notes.email || null,
      product: l.name,
      product_id: l.id,
      type: l.type,
      quantity: l.qty,
      amount: Math.round(l.price * l.qty),
      date,
      status: "Completed",
      method: "Razorpay",
      fulfillment: initialFulfillment(l.type),
      address: l.type === "Physical" ? notes.address || null : null,
    }));

    const { error } = await admin.from("orders").insert(rows);
    if (error) return { ok: false, error: error.message };

    // Email the receipt (best-effort — never blocks fulfilment).
    if (notes.email) {
      const { data: prof } = await admin
        .from("profiles")
        .select("name")
        .eq("id", creatorId)
        .maybeSingle();
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const tmpl = orderReceiptEmail({
        customerName: notes.name || "there",
        storeName: (prof?.name as string) || "your coach",
        orders: rows.map((r) => ({ product: r.product, quantity: r.quantity, amount: r.amount })),
        total: rows.reduce((s, r) => s + r.amount, 0),
        portalUrl: `${base}/portal`,
      });
      sendEmail({ to: notes.email, subject: tmpl.subject, html: tmpl.html }).catch(() => {});
    }

    return { ok: true, orders: rows.map(rowToOrder) };
  }

  return { ok: false, error: "Unknown purpose." };
}
