"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import { useApp } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";

export function TopNav({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const { user, logout, conversations, orders, events } = useApp();
  const { toast } = useToast();

  // Real notifications derived from live data: unread messages, recent
  // purchases (last 7 days) and sessions coming up in the next 48 hours.
  const notifications = useMemo(() => {
    const items: { href: string; text: string }[] = [];
    conversations.forEach((c) => {
      if (c.unread > 0) items.push({ href: "/dashboard/messages", text: `New message from ${c.clientName}` });
    });
    const weekAgo = Date.now() - 7 * 86400000;
    orders.forEach((o) => {
      if (new Date(o.date).getTime() >= weekAgo)
        items.push({ href: "/dashboard/orders", text: `New purchase: ${o.product}` });
    });
    const now = Date.now();
    const in48h = now + 48 * 3600000;
    events.forEach((e) => {
      const t = new Date(`${e.date}T${e.time || "00:00"}`).getTime();
      if (t >= now && t <= in48h)
        items.push({ href: "/dashboard/calendar", text: `Upcoming: ${e.title}` });
    });
    return items.slice(0, 8);
  }, [conversations, orders, events]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-white/[0.06] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-bold tracking-tight text-foreground">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <Dropdown
          align="right"
          trigger={
            <span className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-white/[0.06]">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </span>
          }
        >
          {(close) => (
            <div className="w-72">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Notifications
              </p>
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  You&apos;re all caught up.
                </p>
              ) : (
                notifications.map((n, i) => (
                  <Link
                    key={i}
                    href={n.href}
                    onClick={close}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-white/[0.04]"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <p className="text-sm text-foreground">{n.text}</p>
                  </Link>
                ))
              )}
            </div>
          )}
        </Dropdown>

        {/* Avatar dropdown */}
        <Dropdown
          align="right"
          trigger={
            <span className="flex items-center gap-2 rounded-lg p-1 hover:bg-white/[0.06]">
              <Avatar name={user?.name ?? "Creator"} seed={user?.avatarSeed} src={user?.avatarUrl} size={32} ring />
            </span>
          }
        >
          {(close) => (
            <div className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-bold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Separator className="my-1" />
              <Link href="/dashboard/settings" onClick={close}>
                <DropdownItem icon={User}>Profile</DropdownItem>
              </Link>
              <Link href="/dashboard/settings" onClick={close}>
                <DropdownItem icon={Settings}>Settings</DropdownItem>
              </Link>
              <Separator className="my-1" />
              <DropdownItem
                icon={LogOut}
                danger
                onClick={() => {
                  close();
                  logout();
                  toast("Logged out", { variant: "info" });
                  router.push("/login");
                }}
              >
                Log out
              </DropdownItem>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
