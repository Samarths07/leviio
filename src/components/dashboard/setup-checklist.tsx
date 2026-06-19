"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Check,
  Package,
  PartyPopper,
  Rocket,
  Share2,
  Store,
  UserPlus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STORAGE = "leviio_checklist";
const DISMISS = "leviio_checklist_dismissed";

const steps = [
  { id: "store", label: "Customize your store", desc: "Add your tagline, bio & brand color.", href: "/dashboard/store", icon: Store },
  { id: "product", label: "Add your first product", desc: "Create a program, guide or service.", href: "/dashboard/products?new=1", icon: Package },
  { id: "client", label: "Add your first client", desc: "Start tracking someone's progress.", href: "/dashboard/clients?new=1", icon: UserPlus },
  { id: "plan", label: "Build a plan", desc: "Make a meal or workout plan.", href: "/dashboard/diet-planner?tab=create", icon: Apple },
  { id: "share", label: "Share your store", desc: "Get your link out to grow.", href: "/dashboard/store", icon: Share2 },
];

export function SetupChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(true); // hidden until hydrated
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(STORAGE) || "{}"));
      setDismissed(localStorage.getItem(DISMISS) === "true");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE, JSON.stringify(next));
      return next;
    });
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS, "true");
    setDismissed(true);
  };

  if (!hydrated || dismissed) return null;

  const completed = steps.filter((s) => done[s.id]).length;
  const pct = (completed / steps.length) * 100;
  const allDone = completed === steps.length;

  return (
    <Card className="overflow-hidden border-primary/30">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            {allDone ? "You're all set up! 🎉" : "Get your store ready"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed} of {steps.length} steps complete
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss checklist"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <Progress value={pct} className="mb-4 h-2" />

        {allDone ? (
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
            <PartyPopper className="h-6 w-6 text-success" />
            <div>
              <p className="text-sm font-bold text-foreground">Nice work — you&apos;re ready to sell!</p>
              <p className="text-xs text-muted-foreground">Share your store link and start growing.</p>
            </div>
            <button onClick={dismiss} className="ml-auto text-xs font-semibold text-primary hover:underline">
              Dismiss
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {steps.map((s) => {
              const isDone = !!done[s.id];
              const Icon = s.icon;
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
                >
                  <button
                    onClick={() => toggle(s.id)}
                    aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isDone ? "border-success bg-success text-white" : "border-border text-transparent hover:border-primary"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", isDone ? "bg-success/15 text-success" : "bg-primary/15 text-primary")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-semibold", isDone ? "text-muted-foreground line-through" : "text-foreground")}>
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  {!isDone && (
                    <Link
                      href={s.href}
                      className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Start <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
