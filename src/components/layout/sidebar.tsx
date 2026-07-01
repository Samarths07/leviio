"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { navItems } from "@/lib/nav";
import { useApp } from "@/lib/store";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, conversations } = useApp();
  const unreadMessages = conversations.reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <div className="flex h-full flex-col">
      {/* Profile */}
      <div className="border-b border-border p-4">
        <Logo />
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
          <Avatar name={user?.name ?? "Creator"} seed={user?.avatarSeed} src={user?.avatarUrl} size={38} ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {user?.name ?? "Creator"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{user?.username ?? "username"}
            </p>
          </div>
          <Badge variant="primary">{user?.plan ?? "Free"}</Badge>
        </div>
      </div>

      {/* Nav */}
      <nav className="thin-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
              {item.href === "/dashboard/messages" && unreadMessages > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Plan status — visible on every page */}
      <div className="p-3">
        {user?.plan === "Pro" ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Pro</p>
              <Badge variant="success" className="ml-auto">Active</Badge>
            </div>
            {user.planExpiresAt && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {user.trial ? "Trial ends" : "Renews"} {formatDate(user.planExpiresAt, "medium")}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-bold text-foreground">Upgrade to Pro</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Unlock unlimited products, clients &amp; tools.
            </p>
            <Link
              href="/dashboard/settings?tab=billing"
              onClick={onNavigate}
              className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}
            >
              Upgrade now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-background lg:block">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </>
  );
}
