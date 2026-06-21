"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  Download,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Lock,
  PartyPopper,
  Truck,
} from "lucide-react";
import type { CartItem, Order } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { downloadDeliverable } from "@/lib/delivery";
import { payWithRazorpay } from "@/lib/razorpay";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { LIMITS, sanitizeText } from "@/lib/security";

const steps = ["Details", "Payment", "Delivery"];

export function CheckoutModal({
  open,
  onClose,
  items,
  total,
  accent,
  creatorId,
  discountCode,
  storeName,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  accent: string;
  /** The store owner whose products are being purchased. */
  creatorId: string;
  /** Validated discount code applied to the cart (re-checked server-side). */
  discountCode?: string;
  /** Store/coach name shown in the Razorpay popup. */
  storeName: string;
  /** Called with the created orders after a verified payment. */
  onPaid: (orders: Order[]) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({ name: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [created, setCreated] = useState<Order[]>([]);

  const hasPhysical = items.some((i) => i.product.type === "Physical");

  const close = () => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setError("");
      setCreated([]);
    }, 200);
  };

  const goToPayment = () => {
    if (!details.name.trim() || !details.email.includes("@")) {
      setError("Enter your name and a valid email.");
      return;
    }
    if (hasPhysical && details.address.trim().length < 6) {
      setError("Enter a shipping address for your physical items.");
      return;
    }
    setError("");
    setStep(1);
  };

  const pay = async () => {
    // Sanitize before sending (strips control chars, caps length).
    const customer = {
      name: sanitizeText(details.name, LIMITS.name) || "Guest",
      email: sanitizeText(details.email, LIMITS.email).toLowerCase(),
      address: details.address
        ? sanitizeText(details.address, LIMITS.short)
        : undefined,
    };
    const lineItems = items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    }));

    setPaying(true);
    const res = await payWithRazorpay<{ orders: Order[] }>({
      orderPayload: { purpose: "storefront", creatorId, items: lineItems, discountCode },
      verifyPayload: {
        purpose: "storefront",
        creatorId,
        items: lineItems,
        discountCode,
        customer,
      },
      name: storeName,
      description: `${items.length} item${items.length === 1 ? "" : "s"} from ${storeName}`,
      prefill: { name: customer.name, email: customer.email },
      themeColor: accent,
    });
    setPaying(false);

    if (res.ok && res.data) {
      setCreated(res.data.orders);
      onPaid(res.data.orders);
      setStep(2);
    } else if (res.error && res.error !== "cancelled") {
      toast(res.error, { variant: "error" });
    }
  };

  return (
    <Dialog open={open} onClose={close} title="Checkout" size="md">
      {/* Stepper */}
      <div className="mb-6 flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  i <= step ? "text-white" : "bg-secondary text-muted-foreground"
                )}
                style={i <= step ? { backgroundColor: accent } : undefined}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-[11px] font-semibold", i <= step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-2 mb-5 h-0.5 flex-1 rounded-full bg-border">
                <div className="h-full rounded-full transition-all" style={{ width: i < step ? "100%" : "0%", backgroundColor: accent }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input maxLength={LIMITS.name} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} placeholder="Your name" />
          </div>
          <div>
            <Label>Email (where we send your downloads)</Label>
            <Input type="email" maxLength={LIMITS.email} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} placeholder="you@email.com" />
          </div>
          {hasPhysical && (
            <div>
              <Label>Shipping address</Label>
              <Textarea
                value={details.address}
                onChange={(e) => setDetails({ ...details, address: e.target.value })}
                rows={2}
                maxLength={LIMITS.short}
                placeholder="Street, city, state, ZIP"
              />
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Truck className="h-3 w-3" /> Required — your order has physical items.
              </p>
            </div>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button className="w-full" style={{ backgroundColor: accent }} onClick={goToPayment}>
            Continue to Payment
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-success" /> Secure payment via Razorpay — cards, UPI, netbanking &amp; wallets.
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total payable</span>
              <span className="text-lg font-extrabold text-foreground">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)} disabled={paying}>
              Back
            </Button>
            <Button
              className="flex-1"
              style={{ backgroundColor: accent }}
              onClick={pay}
              disabled={paying}
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {paying ? "Processing..." : `Pay ${formatCurrency(total)}`}
            </Button>
          </div>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            By completing your purchase you agree to the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-foreground">Order confirmed!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A receipt was sent to <span className="text-foreground">{details.email || "your email"}</span>
            </p>
          </div>

          {/* Per-item delivery */}
          <div className="mt-5 space-y-2 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your delivery
            </p>
            {created.map((o) => (
              <div key={o.id} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1 text-sm font-semibold text-foreground">
                    {o.product}
                    {o.quantity && o.quantity > 1 && <span className="text-muted-foreground"> × {o.quantity}</span>}
                  </span>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(o.amount)}</span>
                </div>

                {(o.type === "Digital" || o.type === "Membership") && (
                  <button
                    onClick={() => downloadDeliverable({ product: o.product, id: o.id, client: o.client })}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    <Download className="h-3.5 w-3.5" /> Download / Get access
                  </button>
                )}
                {o.type === "Physical" && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5 text-warning" />
                    Shipping to {details.address.split("\n")[0] || "your address"} · status: Processing
                  </p>
                )}
                {o.type === "Service" && (
                  <div className="mt-2">
                    <a
                      href={`/book/${o.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <CalendarClock className="h-3.5 w-3.5" /> Book your session
                      <ExternalLink className="h-3 w-3 opacity-80" />
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pick a time now, or use the link in your email anytime.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Portal CTA — manage everything in one place */}
          <Link
            href="/portal/login"
            onClick={close}
            className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">Your client portal</p>
              <p className="text-xs text-muted-foreground">
                Sign in with this email to access purchases, plans &amp; sessions anytime.
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>

          <Button className="mt-3 w-full" style={{ backgroundColor: accent }} onClick={close}>
            Done
          </Button>
        </div>
      )}
    </Dialog>
  );
}
