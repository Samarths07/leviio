"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function Tabs({
  tabs,
  value,
  onChange,
  variant = "pill",
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (v: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}) {
  if (variant === "underline") {
    return (
      <div
        className={cn(
          "no-scrollbar flex gap-1 overflow-x-auto border-b border-border",
          className
        )}
        role="tablist"
      >
        {tabs.map((t) => {
          const active = t.value === value;
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {t.label}
              {typeof t.count === "number" && (
                <span className="rounded-full bg-white/10 px-1.5 text-[10px] font-bold">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "no-scrollbar inline-flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1",
        className
      )}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-brand-gradient text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold",
                  active ? "bg-white/20" : "bg-white/10"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
