"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowser } from "@/lib/supabase/config";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LIMITS } from "@/lib/security";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updateAuthPassword } = useApp();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // The /auth/callback route established a recovery session before redirecting here.
  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setChecking(false);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setValid(!!data.session);
      setChecking(false);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast("Password must be at least 6 characters", { variant: "error" });
      return;
    }
    if (password !== confirm) {
      toast("Passwords don't match", { variant: "error" });
      return;
    }
    setLoading(true);
    const res = await updateAuthPassword(password);
    setLoading(false);
    if (res.ok) {
      toast("Password updated — you're signed in.", { variant: "success" });
      router.push("/portal");
    } else {
      toast(res.error ?? "Couldn't update password.", { variant: "error" });
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
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">
              Set a new password
            </h1>
          </div>

          {checking ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !valid ? (
            <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center text-sm">
              <p className="font-bold text-foreground">This reset link is invalid or expired.</p>
              <Link
                href="/portal/login"
                className="mt-3 inline-block font-semibold text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
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
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={LIMITS.password}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                {loading ? "Saving..." : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
