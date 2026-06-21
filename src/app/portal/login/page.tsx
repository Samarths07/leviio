"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2, LockKeyhole, MailCheck, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { creator as seedCreator } from "@/lib/mock-data";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  LIMITS,
  authLockStatus,
  formatRetry,
  recordAuthAttempt,
} from "@/lib/security";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function PortalLoginPage() {
  const router = useRouter();
  const { clientLoginOtp, clientUser, hydrated, coach: portalCoach } = useApp();
  const { toast } = useToast();
  const coach = portalCoach ?? seedCreator;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [lockMsg, setLockMsg] = useState("");

  // Already signed in → straight to the portal.
  useEffect(() => {
    if (hydrated && clientUser) router.replace("/portal");
  }, [hydrated, clientUser, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      toast("Enter a valid email", { variant: "error" });
      return;
    }
    // Rate limit: max 5 sends / 15 minutes. Throttles magic-link email-bombing;
    // Supabase also enforces OTP limits server-side.
    const status = authLockStatus();
    if (!status.allowed) {
      setLockMsg(`Too many attempts. Try again in ${formatRetry(status.retryAfterMs)}.`);
      return;
    }
    setLockMsg("");
    setLoading(true);

    const res = await clientLoginOtp(value);
    recordAuthAttempt();
    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      toast(res.error ?? "Couldn't send the link. Try again.", { variant: "error" });
    }
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
              Sign in to access your programs, plans &amp; coaching sessions.
            </p>
          </div>

          {/* Magic-link sent confirmation */}
          {sent ? (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
              <MailCheck className="h-8 w-8 text-success" />
              <p className="font-bold text-foreground">Check your email</p>
              <p className="text-sm text-muted-foreground">
                We sent a secure sign-in link to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
                Open it on this device to access your portal.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
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

              {lockMsg && (
                <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <span className="text-foreground">{lockMsg}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}
                {loading ? "Sending link..." : "Email me a magic link"}
              </Button>
            </form>
          )}

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
