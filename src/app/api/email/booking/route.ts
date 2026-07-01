import { NextResponse } from "next/server";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { bookingConfirmationEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

/**
 * Send a booking-confirmation email. Tied to a real order (looked up by id) so
 * it can't be used to send arbitrary email.
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "email-booking", ...DEFAULT_LIMIT });
  if (limited) return limited;

  if (!emailConfigured()) {
    return NextResponse.json({ error: "Email isn't configured." }, { status: 503 });
  }

  let body: { orderId?: string; dateLabel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const orderId = String(body.orderId ?? "");
  if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("client_name, client_email, product")
    .eq("id", orderId)
    .maybeSingle();
  if (!order?.client_email) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const tmpl = bookingConfirmationEmail({
    clientName: (order.client_name as string)?.split(" ")[0] || "there",
    productName: (order.product as string) || "your session",
    dateLabel: String(body.dateLabel ?? ""),
    portalUrl: `${base}/portal`,
  });
  const res = await sendEmail({
    to: order.client_email as string,
    subject: tmpl.subject,
    html: tmpl.html,
  });
  if (!res.ok) return NextResponse.json({ error: res.error ?? "Send failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
