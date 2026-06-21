"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, LogOut, Menu, Search, Settings, User } from "lucide-react";
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
  const { user, logout } = useApp();
  const { toast } = useToast();

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

      {/* Search */}
      <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search clients, products..."
          onKeyDown={(e) => {
            if (e.key === "Enter")
              toast("Search is a demo placeholder.", { variant: "info" });
          }}
          className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        {/* Notifications */}
        <Dropdown
          align="right"
          trigger={
            <span className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-white/[0.06]">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                3
              </span>
            </span>
          }
        >
          {() => (
            <div className="w-72">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Notifications
              </p>
              {[
                "New purchase: 12-Week Shred Program",
                "Jessica Moore sent you a message",
                "Upcoming session in 1 hour",
              ].map((n, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-white/[0.04]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm text-foreground">{n}</p>
                </div>
              ))}
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
