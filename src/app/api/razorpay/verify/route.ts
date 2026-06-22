import { NextResponse } from "next/server";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay/server";
import { fulfillRazorpayOrder } from "@/lib/razorpay/fulfill";

export const runtime = "nodejs";

/**
 * Browser verify: confirm the payment signature, then fulfill via the shared
 * (idempotent) fulfillment used by the webhook too. Returns the created orders
 * so the checkout modal can show delivery links.
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

  const res = await fulfillRazorpayOrder(orderId);
  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? "Fulfilment failed." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orders: res.orders ?? [] });
}
