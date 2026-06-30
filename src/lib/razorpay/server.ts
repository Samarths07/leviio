import crypto from "crypto";

/**
 * Server-side Razorpay helpers. Uses the REST API directly (no SDK dependency).
 * The key secret never leaves the server.
 */
const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const API = "https://api.razorpay.com/v1";

export const RAZORPAY_KEY_ID = KEY_ID;

export function razorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

export interface RouteTransfer {
  account: string; // linked account id (acc_...)
  amount: number; // paise routed to the linked account
  currency: "INR";
  notes?: Record<string, string>;
  on_hold?: 0 | 1;
}

/**
 * Create a Razorpay order for `amountPaise` (auto-captured on payment).
 * Optional `transfers` use Razorpay Route to split the captured payment to a
 * creator's linked account; the platform keeps the remainder as commission.
 */
export async function createRazorpayOrder(
  amountPaise: number,
  notes: Record<string, string>,
  transfers?: RouteTransfer[]
): Promise<RazorpayOrder> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      payment_capture: 1,
      notes,
      ...(transfers && transfers.length ? { transfers } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order create failed (${res.status})`);
  }
  return res.json();
}

/** Fetch a Razorpay order (used to cross-check the paid amount). */
export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  const res = await fetch(`${API}/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    throw new Error(`Razorpay order fetch failed (${res.status})`);
  }
  return res.json();
}

/**
 * Verify the HMAC-SHA256 signature Razorpay returns on a successful payment.
 * Proves the payment is genuine and tied to our order. Timing-safe.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function razorpayWebhookConfigured(): boolean {
  return Boolean(WEBHOOK_SECRET);
}

/**
 * Verify a Razorpay webhook signature: HMAC-SHA256 of the RAW request body with
 * the webhook secret, compared to the `x-razorpay-signature` header. Timing-safe.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
