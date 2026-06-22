import { NextResponse } from "next/server";
import {
  razorpayWebhookConfigured,
  verifyWebhookSignature,
} from "@/lib/razorpay/server";
import { fulfillRazorpayOrder } from "@/lib/razorpay/fulfill";

export const runtime = "nodejs";

/**
 * Razorpay webhook — the safety net. Razorpay calls this server-to-server when a
 * payment is captured, so orders/Pro are recorded even if the buyer closes the
 * tab before the browser verify runs. Fulfilment is idempotent, so it's safe for
 * this and the verify route to both fire for the same payment.
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://leviio.com/api/razorpay/webhook
 *   Events: payment.captured, order.paid
 *   Secret: set the same value as RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  if (!razorpayWebhookConfigured()) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  // Raw body is required for signature verification.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { order_id?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const orderId =
      event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id;
    if (orderId) {
      // Best-effort; idempotent. Always 200 so Razorpay doesn't retry forever.
      const res = await fulfillRazorpayOrder(orderId);
      if (!res.ok) console.error(`[razorpay webhook] fulfil failed: ${res.error}`);
    }
  }

  return NextResponse.json({ ok: true });
}
