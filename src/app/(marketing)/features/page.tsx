import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { features } from "@/lib/marketing";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";

export const metadata = {
  title: "Features — Leviio",
};

const deepDive = [
  {
    title: "A store that sells for you",
    points: [
      "Drag-and-drop store builder with your branding",
      "Sell digital products, physical merch, and services",
      "Built-in checkout, discounts, and order management",
      "Shareable storefront link for every creator",
    ],
  },
  {
    title: "Tools that save you hours",
    points: [
      "Diet planner with live macro & calorie calculations",
      "Workout builder with an 80+ exercise library",
      "Client CRM with progress tracking and check-ins",
      "Booking calendar synced to your availability",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl px-4 pt-16 text-center sm:px-6 lg:px-8">
        <Badge variant="primary" className="mx-auto">
          Features
        </Badge>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          One platform. Every tool you need.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          From your storefront to client coaching, Leviio replaces the patchwork
          of apps you&apos;re using today.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} hover className="p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-foreground sm:text-base">
                {f.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {deepDive.map((section, i) => (
        <section
          key={section.title}
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
        >
          <div
            className={`grid items-center gap-10 lg:grid-cols-2 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {section.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {section.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <DashboardPreview />
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Link
          href="/signup"
          className={buttonVariants({ size: "lg" })}
        >
          Start your free trial
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
