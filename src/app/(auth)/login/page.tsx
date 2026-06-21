"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Info, Loader2, ShieldAlert } from "lucide-react";
import { AuthSidePanel } from "@/components/auth/auth-side-panel";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { DEMO_CREDENTIALS } from "@/lib/mock-data";
import {
  LIMITS,
  authLockStatus,
  clearAuthAttempts,
  formatRetry,
  recordAuthAttempt,
} from "@/lib/security";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(LIMITS.email),
  password: z.string().min(6, "Password must be at least 6 characters").max(LIMITS.password),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, usingSupabase } = useApp();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockMsg, setLockMsg] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    // Rate limit: max 5 attempts / 15 minutes (client-side guard).
    const status = authLockStatus();
    if (!status.allowed) {
      setLockMsg(`Too many attempts. Try again in ${formatRetry(status.retryAfterMs)}.`);
      return;
    }

    const finishOk = () => {
      clearAuthAttempts();
      toast("Welcome back!", { variant: "success" });
      router.push("/dashboard");
    };
    // Failed attempt — record it and surface remaining tries / lockout.
    const finishFail = () => {
      setLoading(false);
      const r = recordAuthAttempt();
      if (!r.allowed) {
        setLockMsg(`Too many failed attempts. Try again in ${formatRetry(r.retryAfterMs)}.`);
        toast("Account temporarily locked", { variant: "error" });
      } else {
        setLockMsg("");
        toast(
          `Invalid email or password. ${r.remaining} attempt${r.remaining === 1 ? "" : "s"} left.`,
          { variant: "error" }
        );
      }
    };

    setLoading(true);

    // Supabase mode: real auth decides the outcome.
    if (usingSupabase) {
      const ok = await login(data.email, data.password);
      if (ok) finishOk();
      else finishFail();
      return;
    }

    // Mock mode: gate on the demo credentials with a short delay for realism.
    const ok =
      data.email.trim().toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase() &&
      data.password === DEMO_CREDENTIALS.password;
    setTimeout(async () => {
      if (ok) {
        await login(data.email, data.password);
        finishOk();
      } else {
        finishFail();
      }
    }, 600);
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

          {/* Demo banner — only in mock mode (no demo account exists on Supabase) */}
          {!usingSupabase && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-foreground/90">
                <p className="font-semibold">Demo account</p>
                <p className="text-muted-foreground">
                  {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", DEMO_CREDENTIALS.email);
                    setValue("password", DEMO_CREDENTIALS.password);
                  }}
                  className="mt-1 font-semibold text-primary hover:underline"
                >
                  Fill demo credentials
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" maxLength={LIMITS.email} placeholder="you@email.com" {...register("email")} />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
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
                  onClick={() => toast("Password reset link sent (demo).", { variant: "info" })}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
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
