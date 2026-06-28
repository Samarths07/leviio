import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { features, howItWorks } from "@/lib/marketing";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Testimonials } from "@/components/marketing/testimonials";
import { WelcomeIntro } from "@/components/marketing/welcome-intro";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div>
      <WelcomeIntro />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
          <div>
            <Badge variant="primary">
              <Star className="h-3 w-3" fill="currentColor" /> Built for fitness
              creators
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your Entire Fitness Business,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                In One Dashboard
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Sell workout plans, manage clients, build diet programs, and
              schedule coaching — all from one platform built for fitness
              creators.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "group")}
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/features"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Explore Features
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Training with a coach who uses Leviio?{" "}
              <Link
                href="/portal/login"
                className="font-semibold text-primary hover:underline"
              >
                Open your client portal →
              </Link>
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                "1-Month Free Trial",
                "No card required",
                "Cancel anytime",
              ].map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="font-semibold text-foreground">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="primary" className="mx-auto">
            Features
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need to grow
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Stop juggling 5 different tools. Leviio brings your whole business
            under one roof.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* How it works */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="primary" className="mx-auto">
              How it works
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Up and running in 3 steps
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {howItWorks.map((s) => (
              <div key={s.step} className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-extrabold text-white shadow-glow">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />
      <Testimonials />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-8 text-center sm:p-14">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Ready to grow your fitness business?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-muted-foreground">
            Run your entire fitness business from one dashboard. Start your
            1-month free trial today — no card required.
          </p>
          <div className="relative mt-7 flex justify-center">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "group")}
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
