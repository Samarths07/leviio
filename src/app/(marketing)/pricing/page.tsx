import { PricingSection } from "@/components/marketing/pricing-section";
import { Badge } from "@/components/ui/badge";
import { faqItems } from "@/lib/faq";
import { Accordion } from "@/components/shared/accordion";

export const metadata = {
  title: "Pricing — Leviio",
};

export default function PricingPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl px-4 pt-16 text-center sm:px-6 lg:px-8">
        <Badge variant="primary" className="mx-auto">
          Pricing
        </Badge>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Plans for creators at every stage
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Start free for a month. Upgrade, downgrade, or cancel anytime — no
          hidden fees.
        </p>
      </section>

      <PricingSection compact />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-2xl font-extrabold tracking-tight text-foreground">
          Frequently asked questions
        </h2>
        <Accordion items={faqItems} />
      </section>
    </div>
  );
}
