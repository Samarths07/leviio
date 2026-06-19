"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { mobileNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1.5">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={onMore}
          className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </div>
    </nav>
  );
}
