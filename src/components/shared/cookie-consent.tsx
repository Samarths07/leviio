"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { getConsent, setConsent } from "@/lib/cookie-consent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/**
 * GDPR/ePrivacy-style cookie consent banner. Shows once until the visitor makes
 * a choice (stored in localStorage). Granular toggles for Analytics & Marketing;
 * Essential cookies are always on (login/session, no tracking).
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Decide after mount so SSR markup matches and returning visitors don't flash.
    if (!getConsent()) setOpen(true);
  }, []);

  if (!open) return null;

  const close = () => setOpen(false);
  const acceptAll = () => { setConsent({ analytics: true, marketing: true }); close(); };
  const rejectAll = () => { setConsent({ analytics: false, marketing: false }); close(); };
  const savePrefs = () => { setConsent({ analytics, marketing }); close(); };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Cookie className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">We value your privacy</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              We use essential cookies to keep you signed in and run the app. With your
              permission we&apos;d also use cookies for analytics and marketing. See our{" "}
              <Link href="/cookies" className="font-semibold text-primary hover:underline">
                Cookie Policy
              </Link>
              .
            </p>

            {showPrefs && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Essential</p>
                    <p className="text-[11px] text-muted-foreground">Required — login, sessions, security.</p>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">Always on</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Analytics</p>
                    <p className="text-[11px] text-muted-foreground">Helps us understand usage to improve Leviio.</p>
                  </div>
                  <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Marketing</p>
                    <p className="text-[11px] text-muted-foreground">Personalised offers and campaign measurement.</p>
                  </div>
                  <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing cookies" />
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {showPrefs ? (
                <Button size="sm" onClick={savePrefs}>Save preferences</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowPrefs(true)}>
                  Manage
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={rejectAll}>
                Reject non-essential
              </Button>
              <Button size="sm" onClick={acceptAll}>Accept all</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
