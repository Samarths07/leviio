"use client";

/**
 * Client-side Razorpay Checkout helper.
 *
 * Flow: create a server order → open Razorpay Checkout → verify the payment on
 * the server. Prices are computed server-side; this file only orchestrates the
 * popup and relays the signed result back for verification.
 */

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

interface RazorpayInstance {
  open: () => void;
}
interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}
declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export interface PayOptions {
  /** Body POSTed to /api/razorpay/order (must include `purpose`). */
  orderPayload: Record<string, unknown>;
  /** Extra fields merged into the /api/razorpay/verify body (e.g. items). */
  verifyPayload?: Record<string, unknown>;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  themeColor?: string;
}

export interface PayResult<T = unknown> {
  ok: boolean;
  data?: T;
  /** "cancelled" when the user closed the popup. */
  error?: string;
}

export async function payWithRazorpay<T = unknown>(
  opts: PayOptions
): Promise<PayResult<T>> {
  // 1. Create the order on the server (server sets the amount).
  let order: { orderId: string; amount: number; currency: string; keyId: string };
  try {
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts.orderPayload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { ok: false, error: j.error ?? "Couldn't start payment." };
    }
    order = await res.json();
  } catch {
    return { ok: false, error: "Couldn't reach the payment server." };
  }

  // 2. Load the Razorpay Checkout script.
  if (!(await loadScript()) || !window.Razorpay) {
    return { ok: false, error: "Couldn't load the payment window." };
  }

  // 3. Open Checkout and resolve on verification / dismissal.
  return new Promise<PayResult<T>>((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: opts.name,
      description: opts.description,
      prefill: opts.prefill ?? {},
      theme: { color: opts.themeColor ?? "#7c3aed" },
      handler: async (resp: RazorpayResponse) => {
        try {
          const res = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, ...opts.verifyPayload }),
          });
          if (res.ok) {
            resolve({ ok: true, data: (await res.json()) as T });
          } else {
            const j = await res.json().catch(() => ({}));
            resolve({ ok: false, error: j.error ?? "Payment verification failed." });
          }
        } catch {
          resolve({ ok: false, error: "Payment verification failed." });
        }
      },
      modal: { ondismiss: () => resolve({ ok: false, error: "cancelled" }) },
    });
    rzp.open();
  });
}
