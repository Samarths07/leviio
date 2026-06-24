"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Dumbbell, KeyRound, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
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
  const { clientLoginOtp, clientVerifyOtp, clientLogout, clientUser, hydrated } = useApp();
  const { toast } = useToast();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockMsg, setLockMsg] = useState("");

  // Already signed in → straight to the portal.
  useEffect(() => {
    if (hydrated && clientUser) router.replace("/portal");
  }, [hydrated, clientUser, router]);

  // Step 1: email a 6-digit code.
  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      toast("Enter a valid email", { variant: "error" });
      return;
    }
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
      setStep("code");
      toast(`We sent a 6-digit code to ${value}`, { variant: "success" });
    } else {
      toast(res.error ?? "Couldn't send the code. Try again.", { variant: "error" });
    }
  };

  // Step 2: verify the code.
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (c.length < 6) {
      toast("Enter the 6-digit code", { variant: "error" });
      return;
    }
    setLoading(true);
    const res = await clientVerifyOtp(email.trim(), c);
    setLoading(false);
    if (!res.ok) {
      toast(res.error ?? "Invalid or expired code.", { variant: "error" });
      return;
    }
    if (res.hasClient) {
      toast("Welcome back!", { variant: "success" });
      router.push("/portal");
    } else {
      // Valid code, but this email has no purchases — sign back out and retry.
      toast("No purchases found for this email. Use the email from your order.", {
        variant: "error",
      });
      clientLogout();
      setStep("email");
      setCode("");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Logo />
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

          {step === "email" ? (
            <form onSubmit={sendCode} className="mt-6 space-y-4">
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {loading ? "Sending code..." : "Email me a code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
              </p>
              <div>
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg font-bold tracking-[0.4em]"
                  autoFocus
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                {loading ? "Verifying..." : "Verify & sign in"}
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change email
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const res = await clientLoginOtp(email.trim());
                    toast(
                      res.ok ? "New code sent" : res.error ?? "Couldn't resend",
                      { variant: res.ok ? "success" : "error" }
                    );
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Use the email address you entered when you bought a product.
          </p>
        </div>
      </main>
    </div>
  );
}
