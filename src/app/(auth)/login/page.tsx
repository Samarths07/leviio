"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { AuthSidePanel } from "@/components/auth/auth-side-panel";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import {
  LIMITS,
  authLockStatus,
  clearAuthAttempts,
  formatRetry,
  recordAuthAttempt,
} from "@/lib/security";

const schema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or username").max(LIMITS.email),
  password: z.string().min(6, "Password must be at least 6 characters").max(LIMITS.password),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, clientForgotPassword } = useApp();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockMsg, setLockMsg] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const forgotPassword = async () => {
    const id = getValues("identifier")?.trim() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
      toast("Enter your account email above first, then tap Forgot password.", { variant: "info" });
      return;
    }
    const res = await clientForgotPassword(id);
    toast(
      res.ok
        ? "If that account exists, a reset link is on its way."
        : res.error ?? "Couldn't send reset link.",
      { variant: res.ok ? "success" : "error" }
    );
  };

  const onSubmit = async (data: FormValues) => {
    // Rate limit: max 5 attempts / 15 minutes (client-side guard; Supabase also
    // enforces limits server-side).
    const status = authLockStatus();
    if (!status.allowed) {
      setLockMsg(`Too many attempts. Try again in ${formatRetry(status.retryAfterMs)}.`);
      return;
    }
    setLoading(true);

    const id = data.identifier.trim();
    const finishFail = () => {
      setLoading(false);
      const r = recordAuthAttempt();
      if (!r.allowed) {
        setLockMsg(`Too many failed attempts. Try again in ${formatRetry(r.retryAfterMs)}.`);
        toast("Account temporarily locked", { variant: "error" });
      } else {
        setLockMsg("");
        toast(
          `Invalid login. ${r.remaining} attempt${r.remaining === 1 ? "" : "s"} left.`,
          { variant: "error" }
        );
      }
    };

    // Email → client sign-in (fast). Username → server route resolves the email
    // privately, signs in, then we reload so the session is picked up.
    if (id.includes("@")) {
      const ok = await login(id, data.password);
      if (ok) {
        clearAuthAttempts();
        toast("Welcome back!", { variant: "success" });
        router.push("/dashboard");
      } else {
        finishFail();
      }
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password: data.password }),
      });
      if (res.ok) {
        clearAuthAttempts();
        window.location.href = "/dashboard";
      } else {
        finishFail();
      }
    } catch {
      finishFail();
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthSidePanel />

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-foreground lg:mt-0">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to your Leviio dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="identifier">Email or username</Label>
              <Input id="identifier" type="text" autoCapitalize="none" autoComplete="username" maxLength={LIMITS.email} placeholder="you@email.com or username" {...register("identifier")} />
              {errors.identifier && (
                <p className="mt-1 text-xs text-danger">{errors.identifier.message}</p>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label htmlFor="password" className="mb-0">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={forgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={LIMITS.password}
                  placeholder="••••••••"
                  {...register("password")}
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
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {lockMsg && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span className="text-foreground">{lockMsg}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
