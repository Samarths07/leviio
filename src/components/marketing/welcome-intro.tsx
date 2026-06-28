"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, HeartPulse, LayoutDashboard } from "lucide-react";

const SEEN_KEY = "leviio_welcome_seen";

/**
 * First-visit full-screen welcome experience shown over the marketing homepage.
 * Step 1: animated brand splash + "Get Started".
 * Step 2: choose Creator (→ /signup) or Client (→ /portal/login), or skip.
 * Remembered via localStorage so returning visitors go straight to the site.
 */
export function WelcomeIntro() {
  const router = useRouter();
  const [show, setShow] = useState(true);
  const [step, setStep] = useState<"welcome" | "choose">("welcome");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY)) setShow(false);
    } catch {
      /* localStorage unavailable — just show it */
    }
  }, []);

  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const go = (href: string) => {
    markSeen();
    router.push(href);
  };

  const dismiss = () => {
    markSeen();
    setLeaving(true);
    setTimeout(() => setShow(false), 350);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] overflow-hidden bg-background transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated gradient + floating orbs */}
      <div
        className="absolute inset-0 bg-[length:200%_200%] opacity-30 animate-gradient-pan motion-reduce:animate-none"
        style={{
          backgroundImage:
            "linear-gradient(120deg, #8b5cf6 0%, #ec4899 35%, #7c3aed 70%, #9333ea 100%)",
        }}
      />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-float animate-glow-pulse motion-reduce:animate-none" />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-pink-500/25 blur-3xl animate-float animate-glow-pulse motion-reduce:animate-none"
        style={{ animationDelay: "1.5s, 0.5s" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(9,9,11,0.85)_100%)]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        {step === "welcome" ? (
          <div className="flex flex-col items-center">
            {/* Logo mark with glow */}
            <div
              className="relative animate-pop-in motion-reduce:animate-none"
              style={{ animationDelay: "0.05s" }}
            >
              <div className="absolute inset-0 -z-10 rounded-3xl bg-brand-gradient blur-2xl opacity-70 animate-glow-pulse motion-reduce:animate-none" />
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-gradient shadow-2xl">
                <Image
                  src="/logo.png"
                  alt="Leviio"
                  width={56}
                  height={56}
                  priority
                  className="h-14 w-14 rounded-xl object-contain"
                />
              </div>
            </div>

            <h1
              className="mt-8 animate-fade-up text-5xl font-extrabold tracking-tight text-foreground motion-reduce:animate-none sm:text-6xl"
              style={{ animationDelay: "0.18s" }}
            >
              Lev<span className="text-primary">iio</span>
            </h1>
            <p
              className="mt-4 max-w-md animate-fade-up text-base leading-relaxed text-muted-foreground motion-reduce:animate-none sm:text-lg"
              style={{ animationDelay: "0.3s" }}
            >
              The all-in-one platform for fitness creators
              <br className="hidden sm:block" /> & the clients they coach.
            </p>

            <button
              onClick={() => setStep("choose")}
              className="group mt-9 inline-flex animate-fade-up items-center gap-2 rounded-full bg-brand-gradient px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-95 motion-reduce:animate-none"
              style={{ animationDelay: "0.42s" }}
            >
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <p
              className="mt-6 animate-fade-up text-xs text-muted-foreground motion-reduce:animate-none"
              style={{ animationDelay: "0.54s" }}
            >
              Coaching, programs, payments & client portal — in one place.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            <h2
              className="animate-fade-up text-3xl font-extrabold tracking-tight text-foreground motion-reduce:animate-none sm:text-4xl"
              style={{ animationDelay: "0.02s" }}
            >
              Continue as
            </h2>
            <p
              className="mt-2 animate-fade-up text-sm text-muted-foreground motion-reduce:animate-none"
              style={{ animationDelay: "0.1s" }}
            >
              Pick how you want to use Leviio.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => go("/signup")}
                className="group animate-pop-in rounded-2xl border border-border bg-card/70 p-6 text-left backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 motion-reduce:animate-none"
                style={{ animationDelay: "0.16s" }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <LayoutDashboard className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">I&apos;m a Creator</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Run your coaching business — clients, programs & payments.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <button
                onClick={() => go("/portal/login")}
                className="group animate-pop-in rounded-2xl border border-border bg-card/70 p-6 text-left backdrop-blur transition-all hover:-translate-y-1 hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/20 motion-reduce:animate-none"
                style={{ animationDelay: "0.26s" }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/15 text-pink-400 transition-colors group-hover:bg-pink-500 group-hover:text-white">
                  <HeartPulse className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">I&apos;m a Client</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Access your plans, sessions & messages from your coach.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pink-400">
                  Open portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>

            <button
              onClick={dismiss}
              className="group mt-8 inline-flex animate-fade-up items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground motion-reduce:animate-none"
              style={{ animationDelay: "0.36s" }}
            >
              Skip for now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <div>
              <button
                onClick={() => setStep("welcome")}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-muted-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
