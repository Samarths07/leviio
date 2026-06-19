import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { pricingPlans } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function PricingSection({ compact }: { compact?: boolean }) {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {!compact && (
        <div className="text-center">
          <Badge variant="primary" className="mx-auto">
            Pricing
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Simple pricing that scales with you
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free, or try Pro free for a month. No credit card required.
            Cancel anytime.
          </p>
        </div>
      )}

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2 md:items-start">
        {pricingPlans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-6 transition-all",
              plan.popular
                ? "border-primary/60 ring-1 ring-primary/20 md:-translate-y-3"
                : "border-border"
            )}
          >
            {plan.popular && (
              <Badge
                variant="solid"
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1"
              >
                <Sparkles className="h-3 w-3" /> 1st Month Free
              </Badge>
            )}
            <h3 className="text-lg font-extrabold text-foreground">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground">
                {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
              </span>
              {plan.price > 0 && (
                <span className="text-sm text-muted-foreground">/mo</span>
              )}
            </div>
            {plan.price > 0 ? (
              <p className="mt-1 text-xs font-semibold text-success">
                Free for your first {plan.trialDays ?? 30} days, then{" "}
                {formatCurrency(plan.price)}/mo
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Forever free, with limits
              </p>
            )}

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={cn(
                buttonVariants({
                  variant: plan.popular ? "primary" : "outline",
                  size: "lg",
                }),
                "mt-6 w-full"
              )}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
        Pro unlocks unlimited everything. Your free month starts the moment you
        sign up — we&apos;ll remind you before it ends.
      </p>
    </section>
  );
}
