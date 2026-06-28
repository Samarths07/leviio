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
import { Select } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { niches } from "@/lib/mock-data";
import {
  LIMITS,
  authLockStatus,
  clearAuthAttempts,
  formatRetry,
  recordAuthAttempt,
} from "@/lib/security";

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(LIMITS.name),
    email: z.string().trim().email("Enter a valid email").max(LIMITS.email),
    password: z.string().min(6, "At least 6 characters").max(LIMITS.password),
    confirm: z.string().max(LIMITS.password),
    niche: z.string().min(1, "Select a niche").max(LIMITS.short),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useApp();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockMsg, setLockMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    // Rate limit: max 5 attempts / 15 minutes (client-side guard; Supabase also
    // enforces signup limits server-side).
    const status = authLockStatus();
    if (!status.allowed) {
      setLockMsg(`Too many attempts. Try again in ${formatRetry(status.retryAfterMs)}.`);
      return;
    }
    setLockMsg("");
    setLoading(true);
    const ok = await signup({
      name: data.name,
      email: data.email,
      niche: data.niche,
      password: data.password,
    });
    if (ok) {
      clearAuthAttempts();
      toast("Account created! Let's set you up.", { variant: "success" });
      router.push("/onboarding");
    } else {
      // Supabase reported an error or requires email confirmation — it already
      // surfaced a toast. Count the failed attempt toward the limit.
      const r = recordAuthAttempt();
      if (!r.allowed) {
        setLockMsg(`Too many attempts. Try again in ${formatRetry(r.retryAfterMs)}.`);
      }
      setLoading(false);
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your 1-month free trial. No card required.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Alisha Fernandez" {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@email.com" {...register("email")} />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label="Toggle password"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirm">Confirm</Label>
                <Input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••"
                  {...register("confirm")}
                />
                {errors.confirm && (
                  <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="niche">Your niche</Label>
              <Select id="niche" defaultValue="" {...register("niche")}>
                <option value="" disabled>
                  Select a niche
                </option>
                {niches.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              {errors.niche && (
                <p className="mt-1 text-xs text-danger">{errors.niche.message}</p>
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
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="font-semibold text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
