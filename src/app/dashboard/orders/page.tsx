"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Mail,
  MessageCircle,
  Package,
  Receipt,
  Search,
  Send,
  Truck,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import type { Order } from "@/lib/types";
import { fulfillmentOf, fulfillmentVariant, downloadDeliverable, orderType } from "@/lib/delivery";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatus } from "@/components/dashboard/order-status";

const filters = [
  { value: "all", label: "All" },
  { value: "action", label: "Needs Fulfillment" },
  { value: "Digital", label: "Digital" },
  { value: "Physical", label: "Physical" },
  { value: "Service", label: "Service" },
];

const typeVariant: Record<string, "primary" | "warning" | "success"> = {
  Digital: "primary",
  Physical: "warning",
  Service: "success",
  Membership: "success",
};

export default function OrdersPage() {
  const { orders, updateOrder } = useApp();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [shipping, setShipping] = useState<Order | null>(null);
  const [tracking, setTracking] = useState("");
  const [booking, setBooking] = useState<Order | null>(null);

  const pending = useMemo(
    () =>
      orders.filter((o) => {
        const f = fulfillmentOf(o);
        return f !== "Delivered" && f !== "Completed" && o.status !== "Refunded";
      }).length,
    [orders]
  );
  const revenue = useMemo(
    () => orders.filter((o) => o.status !== "Refunded").reduce((s, o) => s + o.amount, 0),
    [orders]
  );

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const t = orderType(o);
        const f = fulfillmentOf(o);
        if (filter === "action" && (f === "Delivered" || f === "Completed")) return false;
        if (["Digital", "Physical", "Service"].includes(filter) && t !== filter) return false;
        if (query) {
          const q = query.toLowerCase();
          if (!o.client.toLowerCase().includes(q) && !o.product.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q))
            return false;
        }
        return true;
      }),
    [orders, filter, query]
  );

  const ship = () => {
    if (!shipping) return;
    updateOrder(shipping.id, { fulfillment: "Shipped", tracking: tracking || "FP-TRACK-" + Math.floor(1000 + Math.random() * 9000) });
    toast(`${shipping.product} marked as shipped`, { variant: "success" });
    setShipping(null);
    setTracking("");
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">Orders &amp; Delivery</h2>
        <p className="text-sm text-muted-foreground">
          Fulfill purchases — digital downloads deliver instantly, ship physical goods, and book services.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total orders</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{orders.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
          <p className="mt-1 text-2xl font-extrabold text-warning">{pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{formatCurrency(revenue)}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={filters} value={filter} onChange={setFilter} />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No orders here"
          description={filter === "action" ? "Nothing to fulfill right now — you're all caught up." : "Orders from your storefront will appear here."}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Buyer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Delivery</th>
                  <th className="px-4 py-3 text-right font-semibold">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const t = orderType(o);
                  const f = fulfillmentOf(o);
                  return (
                    <tr key={o.id} className="border-b border-border/60 last:border-0 align-top hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-primary">#{o.id.replace(/^#/, "")}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(o.date, "short")}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{o.client}</p>
                        {o.email && <p className="text-xs text-muted-foreground">{o.email}</p>}
                        {t === "Physical" && o.address && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">📦 {o.address.split("\n")[0]}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground/90">{o.product}{o.quantity && o.quantity > 1 ? ` ×${o.quantity}` : ""}</p>
                        <Badge variant={typeVariant[t]} className="mt-1">{t}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(o.amount)}</td>
                      <td className="px-4 py-3"><OrderStatus status={o.status} /></td>
                      <td className="px-4 py-3">
                        <Badge variant={fulfillmentVariant(f)}>{f}</Badge>
                        {o.tracking && f === "Shipped" && (
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{o.tracking}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {(t === "Digital" || t === "Membership") && (
                            <>
                              <Button size="sm" variant="subtle" onClick={() => downloadDeliverable({ product: o.product, id: o.id, client: o.client })}>
                                <Download className="h-3.5 w-3.5" /> File
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => toast(`Download link re-sent to ${o.email ?? o.client}`, { variant: "success" })}>
                                <Send className="h-3.5 w-3.5" /> Resend
                              </Button>
                            </>
                          )}
                          {t === "Physical" && f === "Processing" && (
                            <Button size="sm" onClick={() => { setShipping(o); setTracking(""); }}>
                              <Truck className="h-3.5 w-3.5" /> Mark Shipped
                            </Button>
                          )}
                          {t === "Physical" && f === "Shipped" && (
                            <Button size="sm" variant="success" onClick={() => { updateOrder(o.id, { fulfillment: "Delivered" }); toast("Marked as delivered", { variant: "success" }); }}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Delivered
                            </Button>
                          )}
                          {t === "Service" && f === "Awaiting booking" && (
                            <Button size="sm" onClick={() => setBooking(o)}>
                              <Send className="h-3.5 w-3.5" /> Send booking link
                            </Button>
                          )}
                          {t === "Service" && f === "Booked" && (
                            <Button size="sm" variant="success" onClick={() => { updateOrder(o.id, { fulfillment: "Completed" }); toast("Session completed", { variant: "success" }); }}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                            </Button>
                          )}
                          {(f === "Delivered" || f === "Completed") && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Ship dialog */}
      <Dialog open={!!shipping} onClose={() => setShipping(null)} title="Mark as shipped" size="sm">
        <p className="text-sm text-muted-foreground">
          Shipping <span className="font-semibold text-foreground">{shipping?.product}</span> to{" "}
          <span className="font-semibold text-foreground">{shipping?.client}</span>.
        </p>
        {shipping?.address && (
          <div className="mt-3 rounded-lg border border-border bg-background/40 p-3 text-sm text-foreground">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Package className="h-3.5 w-3.5" /> Ship to
            </p>
            <p className="mt-1 whitespace-pre-line">{shipping.address}</p>
          </div>
        )}
        <div className="mt-4">
          <Label>Tracking number (optional)</Label>
          <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Auto-generated if left blank" />
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setShipping(null)}>Cancel</Button>
          <Button className="flex-1" onClick={ship}>
            <Truck className="h-4 w-4" /> Confirm Shipment
          </Button>
        </div>
      </Dialog>

      {/* Send booking link dialog */}
      <BookingLinkDialog
        order={booking}
        onClose={() => setBooking(null)}
        onMarkBooked={(o) => { updateOrder(o.id, { fulfillment: "Booked" }); toast("Marked as booked", { variant: "success" }); setBooking(null); }}
      />
    </div>
  );
}

function BookingLinkDialog({
  order,
  onClose,
  onMarkBooked,
}: {
  order: Order | null;
  onClose: () => void;
  onMarkBooked: (o: Order) => void;
}) {
  const { toast } = useToast();
  const [origin, setOrigin] = useState("https://leviio.com");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  if (!order) return null;
  const link = `${origin}/book/${order.id}`;
  const text = `Hi ${order.client.split(" ")[0]}! Book your "${order.product}" session here: ${link}`;

  const copy = () => {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    toast("Booking link copied", { variant: "success" });
    setTimeout(() => setCopied(false), 1800);
  };
  const open_ = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  return (
    <Dialog open={!!order} onClose={onClose} title="Send booking link" description={`${order.product} · ${order.client}`} size="sm">
      <p className="text-sm text-muted-foreground">
        Share this link so {order.client.split(" ")[0]} can pick a time. When they book, it lands on your calendar automatically.
      </p>

      <div className="mt-4 flex gap-2">
        <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <Link2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
        </div>
        <Button variant="subtle" onClick={copy}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          onClick={() => open_(`https://wa.me/?text=${encodeURIComponent(text)}`)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/40"
        >
          <MessageCircle className="h-5 w-5 text-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">WhatsApp</span>
        </button>
        <button
          onClick={() => open_(`mailto:${order.email ?? ""}?subject=${encodeURIComponent("Book your session")}&body=${encodeURIComponent(text)}`)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/40"
        >
          <Mail className="h-5 w-5 text-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">Email</span>
        </button>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/40"
        >
          <ExternalLink className="h-5 w-5 text-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">Preview</span>
        </a>
      </div>

      <button
        onClick={() => onMarkBooked(order)}
        className="mt-4 w-full text-center text-xs font-semibold text-primary hover:underline"
      >
        Or mark as booked manually
      </button>
    </Dialog>
  );
}
