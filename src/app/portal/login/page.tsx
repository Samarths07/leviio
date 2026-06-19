"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Info, Loader2, LockKeyhole } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { creator as seedCreator } from "@/lib/mock-data";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LIMITS } from "@/lib/security";

const DEMO_CLIENT_EMAIL = "jessica.moore@email.com";

export default function PortalLoginPage() {
  const router = useRouter();
  const { clientLogin, clientUser, hydrated, user } = useApp();
  const { toast } = useToast();
  const coach = user ?? seedCreator;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → straight to the portal.
  useEffect(() => {
    if (hydrated && clientUser) router.replace("/portal");
  }, [hydrated, clientUser, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast("Enter a valid email", { variant: "error" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const client = clientLogin(value);
      setLoading(false);
      if (client) {
        toast(`Welcome back, ${client.name.split(" ")[0]}!`, { variant: "success" });
        router.push("/portal");
      } else {
        toast("No purchases found for that email", { variant: "error" });
      }
    }, 500);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo />
          <Link
            href={`/${coach.username}`}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Browse store
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
              <Dumbbell className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">
              Client Portal
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Access your programs, plans &amp; sessions with{" "}
              <span className="font-semibold text-foreground">{coach.name}</span>.
            </p>
          </div>

          {/* Demo helper */}
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-foreground/90">
              <p className="font-semibold">Demo client</p>
              <p className="text-muted-foreground">{DEMO_CLIENT_EMAIL}</p>
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_CLIENT_EMAIL);
                  setPassword("password");
                }}
                className="mt-1 font-semibold text-primary hover:underline"
              >
                Fill demo client
              </button>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email used at checkout</Label>
              <Input
                id="email"
                type="email"
                maxLength={LIMITS.email}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                maxLength={LIMITS.password}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              {loading ? "Signing in..." : "Access my portal"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Use the email address you entered when you bought a product.
            <br />
            Haven&apos;t purchased yet?{" "}
            <Link href={`/${coach.username}`} className="font-semibold text-primary hover:underline">
              Visit the store
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
