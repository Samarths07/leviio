"use client";

import { useState } from "react";
import { Check, Loader2, Lock, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { payWithRazorpay } from "@/lib/razorpay";
import { PRO_PRICE_INR as PRO_PRICE } from "@/lib/billing";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const proFeatures = [
  "Unlimited clients & products",
  "All tools unlocked",
  "Custom domain & advanced analytics",
  "Priority support",
];

export function PlanPurchaseDialog({
  open,
  onClose,
  onPurchase,
  onStartTrial,
  showTrial,
}: {
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onStartTrial?: () => void;
  showTrial?: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    const res = await payWithRazorpay({
      orderPayload: { purpose: "subscription" },
      verifyPayload: { purpose: "subscription" },
      name: "Leviio Pro",
      description: "1 month of Leviio Pro",
    });
    setLoading(false);
    if (res.ok) {
      onPurchase();
    } else if (res.error && res.error !== "cancelled") {
      toast(res.error, { variant: "error" });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Upgrade to Pro" size="sm">
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Leviio Pro
          </span>
          <span className="text-lg font-extrabold text-foreground">
            {formatCurrency(PRO_PRICE)}
            <span className="text-xs font-medium text-muted-foreground">/mo</span>
          </span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {proFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-foreground/90">
              <Check className="h-3 w-3 text-success" /> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 text-success" /> Secure payment via Razorpay — cards, UPI, netbanking &amp; wallets.
      </div>

      <Button className="mt-5 w-full" onClick={pay} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {loading ? "Processing..." : `Pay ${formatCurrency(PRO_PRICE)} & Activate Pro`}
      </Button>

      {showTrial && onStartTrial && (
        <button
          onClick={onStartTrial}
          className="mt-3 w-full text-center text-xs font-semibold text-primary hover:underline"
        >
          Or start a 1-month free trial instead
        </button>
      )}
    </Dialog>
  );
}
