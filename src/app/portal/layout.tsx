"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Loader2, LogOut, RefreshCw, Store } from "lucide-react";
import { useApp } from "@/lib/store";
import { isGuestClient } from "@/lib/portal";
import { appUrl } from "@/lib/hosts";
import { creator as seedCreator } from "@/lib/mock-data";
import { portalNavItems, portalPageTitle } from "@/lib/portal-nav";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/portal"
    ? pathname === "/portal"
    : pathname.startsWith(href);
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { clientUser, clientLogout, refreshClient, user, hydrated, coach: portalCoach } = useApp();
  const [checking, setChecking] = useState(false);

  // Auth pages live under /portal but render without the shell/guard.
  const isAuthPage = pathname === "/portal/login" || pathname === "/portal/reset";
  const coach = portalCoach ?? user ?? seedCreator;

  useEffect(() => {
    if (hydrated && !clientUser && !isAuthPage) {
      // A signed-in creator isn't a portal client — send them to their dashboard.
      router.replace(user ? "/dashboard" : "/portal/login");
    }
  }, [hydrated, clientUser, user, isAuthPage, router]);

  if (isAuthPage) return <>{children}</>;

  if (!hydrated || !clientUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const logout = () => {
    clientLogout();
    router.replace("/portal/login");
  };

  // Approval gate: a managed client (added by the coach) must be approved once
  // before they can see the portal. Storefront buyers are auto-approved.
  const awaitingApproval =
    !isGuestClient(clientUser) && clientUser.portalStatus !== "approved";
  if (awaitingApproval) {
    const recheck = async () => {
      setChecking(true);
      await refreshClient();
      setChecking(false);
    };
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
            <Logo />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <Clock className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">
              Waiting for approval
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is ready. {coach?.name ? `${coach.name} needs` : "Your coach needs"} to
              approve your portal access — you&apos;ll get in as soon as they do.
            </p>
            <Button onClick={recheck} className="mt-5 w-full" disabled={checking}>
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {checking ? "Checking…" : "Check again"}
            </Button>
            <button
              onClick={logout}
              className="mt-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Log out
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background lg:flex">
        <div className="border-b border-border p-4">
          <Logo />
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
            <Avatar name={clientUser.name} seed={clientUser.avatarSeed} size={38} ring />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {clientUser.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">Member</p>
            </div>
            <Badge variant="primary">Client</Badge>
          </div>
        </div>

        <nav className="thin-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
          {portalNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
            <Avatar name={coach.name} seed={coach.avatarSeed} src={coach.avatarUrl} size={32} ring />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-muted-foreground">Coached by</p>
              <p className="truncate text-xs font-bold text-foreground">{coach.name}</p>
            </div>
          </div>
          <a
            href={appUrl(`/${coach.username}`)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            <Store className="h-[18px] w-[18px]" /> Browse store
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-danger"
          >
            <LogOut className="h-[18px] w-[18px]" /> Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo />
          </div>
          <h1 className="hidden text-lg font-extrabold tracking-tight text-foreground lg:block">
            {portalPageTitle(pathname)}
          </h1>
          <button
            onClick={logout}
            aria-label="Log out"
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground lg:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div className="hidden lg:block" />
        </header>

        <main className="px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {portalNavItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors active:scale-95",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
