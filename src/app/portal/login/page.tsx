"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Eye, EyeOff, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { Logo } from "@/components/shared/logo";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  LIMITS,
  authLockStatus,
  clearAuthAttempts,
  formatRetry,
  recordAuthAttempt,
} from "@/lib/security";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function PortalLoginPage() {
  const router = useRouter();
  const { clientLogin, clientSignup, clientForgotPassword, clientLogout, clientUser, hydrated } =
    useApp();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
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

    // Forgot password → email a reset link.
    if (mode === "forgot") {
      setLoading(true);
      const res = await clientForgotPassword(value);
      setLoading(false);
      if (res.ok) {
        toast("If that account exists, a reset link is on its way.", { variant: "success" });
        setMode("login");
      } else {
        toast(res.error ?? "Couldn't send reset link.", { variant: "error" });
      }
      return;
    }

    if (password.length < 6) {
      toast("Password must be at least 6 characters", { variant: "error" });
      return;
    }
    const status = authLockStatus();
    if (!status.allowed) {
      setLockMsg(`Too many attempts. Try again in ${formatRetry(status.retryAfterMs)}.`);
      return;
    }
    setLockMsg("");
    setLoading(true);

    const res =
      mode === "signup"
        ? await clientSignup(value, password)
        : await clientLogin(value, password);

    if (!res.ok) {
      setLoading(false);
      const r = recordAuthAttempt();
      if (!r.allowed) {
        setLockMsg(`Too many attempts. Try again in ${formatRetry(r.retryAfterMs)}.`);
      }
      toast(res.error ?? "Couldn't sign in.", { variant: "error" });
      return;
    }

    clearAuthAttempts();
    if (res.hasClient) {
      toast("Welcome!", { variant: "success" });
      router.push("/portal");
    } else {
      // Valid account, but this email isn't a client or buyer — sign back out.
      setLoading(false);
      toast("This email isn't linked to a coach yet. Ask your coach to add you, or use your order email.", {
        variant: "error",
      });
      clientLogout();
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
              {mode === "signup"
                ? "Create your account to access your programs & sessions."
                : mode === "forgot"
                  ? "Enter your email and we'll send a reset link."
                  : "Sign in to access your programs, plans & sessions."}
            </p>
          </div>

          <div className="mt-6">
            <GoogleButton role="client" />
            <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Your email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={LIMITS.email}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    maxLength={LIMITS.password}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {lockMsg && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span className="text-foreground">{lockMsg}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              {loading
                ? mode === "signup"
                  ? "Creating account..."
                  : mode === "forgot"
                    ? "Sending..."
                    : "Signing in..."
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-primary hover:underline"
              >
                Back to sign in
              </button>
            ) : mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                First time here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-semibold text-primary hover:underline"
                >
                  Create your portal account
                </button>
              </>
            )}
          </p>
          {mode === "login" && (
            <p className="mt-2 text-center text-sm">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="font-semibold text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
            </p>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Use the email your coach added you with (or the email from your order).
          </p>
        </div>
      </main>
    </div>
  );
}
