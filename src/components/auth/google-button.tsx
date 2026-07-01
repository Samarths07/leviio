"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/config";
import { useToast } from "@/components/ui/toast";

/**
 * "Continue with Google" — starts the Supabase Google OAuth flow. The `role`
 * is passed through the callback so a creator lands in the dashboard (profile
 * created on first sign-in) and a client lands in their portal.
 */
export function GoogleButton({
  role,
  label = "Continue with Google",
}: {
  role: "creator" | "client";
  label?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      toast("Sign-in isn't available — the database isn't connected.", { variant: "error" });
      return;
    }
    setLoading(true);
    const next = role === "creator" ? "/dashboard" : "/portal";
    const redirectTo = `${window.location.origin}/auth/callback?role=${role}&next=${encodeURIComponent(next)}`;
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setLoading(false);
      toast(error.message, { variant: "error" });
    }
    // On success the browser redirects to Google, so no further UI needed.
  };

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.9 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 40.3 15.9 45 24 45z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.3 5.3C41.6 36.1 45 30.6 45 24c0-1.2-.1-2.3-.4-3.5z" />
        </svg>
      )}
      {label}
    </button>
  );
}
