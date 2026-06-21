import type { Fulfillment, Order, ProductType } from "./types";
import { products } from "./mock-data";

/** Resolve an order's product type (falls back to a lookup by name). */
export function orderType(o: Order): ProductType {
  if (o.type) return o.type;
  return products.find((p) => p.name === o.product)?.type ?? "Digital";
}

/** Fulfillment state a fresh order should start in, based on its type. */
export function initialFulfillment(type: ProductType): Fulfillment {
  if (type === "Physical") return "Processing";
  if (type === "Service") return "Awaiting booking";
  return "Delivered"; // Digital & Membership are delivered instantly
}

/** Fulfillment for display — derived for legacy/seeded orders missing the field. */
export function fulfillmentOf(o: Order): Fulfillment {
  if (o.fulfillment) return o.fulfillment;
  if (o.status === "Refunded") return "Processing";
  const t = orderType(o);
  return t === "Service" ? "Completed" : "Delivered";
}

export function fulfillmentVariant(
  f: Fulfillment
): "success" | "primary" | "warning" {
  if (f === "Delivered" || f === "Completed" || f === "Booked") return "success";
  if (f === "Shipped") return "primary";
  return "warning";
}

const slug = (s: string) => s.replace(/\s+/g, "-").toLowerCase();

/** "Deliver" a digital product by generating + downloading an access file. */
export function downloadDeliverable(opts: {
  product: string;
  id: string;
  client?: string;
}) {
  const content = [
    "LEVIIO — DIGITAL DELIVERY",
    "==========================",
    "",
    `Product:  ${opts.product}`,
    `Order:    #${opts.id.replace(/^#/, "")}`,
    opts.client ? `Buyer:    ${opts.client}` : "",
    `Issued:   ${new Date().toLocaleString()}`,
    "",
    "Your access link:",
    `https://leviio.com/access/${opts.id.replace(/^#/, "")}`,
    "",
    "Thank you for your purchase! 💜",
    "(Demo file — in production this would be your PDF, video course or ZIP.)",
  ]
    .filter(Boolean)
    .join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(opts.product)}-access.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
