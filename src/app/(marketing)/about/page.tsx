import Link from "next/link";
import { ArrowRight, Dumbbell, HeartHandshake, Layers, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "About — Leviio",
  description:
    "Leviio is the all-in-one platform for fitness creators to sell, coach, and grow a business they own.",
};

const values = [
  {
    icon: HeartHandshake,
    title: "Creator-first",
    desc: "Every decision starts with one question: does this help a coach build a better business? You own your audience, your content, and your revenue.",
  },
  {
    icon: Layers,
    title: "All-in-one, on purpose",
    desc: "Storefront, payments, client CRM, diet & workout builders, scheduling, and messaging — one login instead of five subscriptions.",
  },
  {
    icon: ShieldCheck,
    title: "Fair & transparent",
    desc: "Simple pricing, no lock-in, and your data is yours. We win only when you grow.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-16 text-center sm:px-6 lg:px-8">
        <Badge variant="primary" className="mx-auto">
          About us
        </Badge>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          We&apos;re building the home for fitness creators
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Leviio gives coaches and trainers everything they need to sell, coach,
          and grow — without stitching together a dozen different tools.
        </p>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="legal-body space-y-4 text-[15px] leading-relaxed text-foreground/90">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Why we built Leviio
          </h2>
          <p>
            Great coaches were spending more time wrestling with software than
            coaching. A website builder here, a payment link there, spreadsheets
            for clients, a separate app for plans, and yet another for booking —
            each with its own bill and its own login.
          </p>
          <p>
            We thought fitness creators deserved better: one platform that handles
            the business side so they can focus on changing lives. That&apos;s
            Leviio — a branded storefront, real client management, diet and workout
            builders, scheduling, messaging, and payments, all in one place.
          </p>
          <p>
            Whether you&apos;re selling your first program or running a full
            coaching practice, the goal is the same: help you build a business you
            truly own.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-foreground">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {v.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Mission band */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
            <Dumbbell className="h-6 w-6" />
          </span>
          <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Our mission is simple: help fitness creators turn their passion into a
            thriving business.
          </h2>
          <Link href="/signup" className={`${buttonVariants({ size: "lg" })} mt-2`}>
            Join Leviio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
