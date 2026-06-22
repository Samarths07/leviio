import { formatCurrency } from "@/lib/utils";

/** Shared branded email shell (inline styles for email-client compatibility). */
function layout(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#18181b;padding:8px 0 16px;">
      Lev<span style="color:#7c3aed;">iio</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:28px;">
      ${inner}
    </div>
    <p style="color:#a1a1aa;font-size:12px;text-align:center;margin-top:20px;">
      Sent by Leviio · the all-in-one platform for fitness creators
    </p>
  </div></body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:10px;font-size:14px;">${label}</a>`;

export function orderReceiptEmail(d: {
  customerName: string;
  storeName: string;
  orders: { product: string; quantity?: number; amount: number }[];
  total: number;
  portalUrl: string;
}): { subject: string; html: string } {
  const rows = d.orders
    .map(
      (o) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;">${o.product}${
          o.quantity && o.quantity > 1 ? ` × ${o.quantity}` : ""
        }</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:700;">${formatCurrency(
          o.amount
        )}</td></tr>`
    )
    .join("");
  const html = layout(`
    <h1 style="font-size:20px;margin:0 0 4px;">Thanks for your purchase! 🎉</h1>
    <p style="color:#52525b;font-size:14px;margin:0 0 18px;">Hi ${d.customerName}, here's your receipt from ${d.storeName}.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
      <tr><td style="padding:12px 0 0;font-weight:800;">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:800;">${formatCurrency(
        d.total
      )}</td></tr>
    </table>
    <p style="color:#52525b;font-size:14px;margin:20px 0 16px;">Access your purchases, plans and sessions anytime in your client portal.</p>
    ${btn(d.portalUrl, "Open my portal")}
  `);
  return { subject: `Your ${d.storeName} order receipt`, html };
}

export function bookingConfirmationEmail(d: {
  clientName: string;
  productName: string;
  dateLabel: string;
  portalUrl: string;
}): { subject: string; html: string } {
  const html = layout(`
    <h1 style="font-size:20px;margin:0 0 4px;">Your session is booked ✅</h1>
    <p style="color:#52525b;font-size:14px;margin:0 0 18px;">Hi ${d.clientName}, your booking is confirmed.</p>
    <div style="background:#f4f4f5;border-radius:12px;padding:16px;font-size:14px;">
      <div style="font-weight:700;">${d.productName}</div>
      <div style="color:#52525b;margin-top:4px;">${d.dateLabel}</div>
    </div>
    <p style="margin:20px 0 16px;">${btn(d.portalUrl, "View in portal")}</p>
  `);
  return { subject: `Booking confirmed: ${d.productName}`, html };
}

export function portalInviteEmail(d: {
  coachName: string;
  portalUrl: string;
  storeUrl: string;
}): { subject: string; html: string } {
  const html = layout(`
    <h1 style="font-size:20px;margin:0 0 4px;">${d.coachName} invited you to their client portal</h1>
    <p style="color:#52525b;font-size:14px;margin:0 0 18px;">Sign in with this email to access your programs, plans and coaching sessions.</p>
    <p style="margin:0 0 16px;">${btn(d.portalUrl, "Access my portal")}</p>
    <p style="color:#52525b;font-size:13px;margin:0;">Or browse the store: <a href="${d.storeUrl}" style="color:#7c3aed;">${d.storeUrl}</a></p>
  `);
  return { subject: `${d.coachName} invited you to Leviio`, html };
}
