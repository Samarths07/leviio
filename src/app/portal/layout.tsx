"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LogOut, Store } from "lucide-react";
import { useApp } from "@/lib/store";
import { creator as seedCreator } from "@/lib/mock-data";
import { portalNavItems, portalPageTitle } from "@/lib/portal-nav";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  const { clientUser, clientLogout, user, hydrated, coach: portalCoach } = useApp();

  // The login page lives under /portal but must render without the shell/guard.
  const isLogin = pathname === "/portal/login";
  const coach = portalCoach ?? user ?? seedCreator;

  useEffect(() => {
    if (hydrated && !clientUser && !isLogin) router.replace("/portal/login");
  }, [hydrated, clientUser, isLogin, router]);

  if (isLogin) return <>{children}</>;

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
            <Avatar name={coach.name} seed={coach.avatarSeed} size={32} ring />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-muted-foreground">Coached by</p>
              <p className="truncate text-xs font-bold text-foreground">{coach.name}</p>
            </div>
          </div>
          <Link
            href={`/${coach.username}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            <Store className="h-[18px] w-[18px]" /> Browse store
          </Link>
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
