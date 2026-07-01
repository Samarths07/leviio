"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)}>
        {trigger}
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] animate-scale-in overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          role="menu"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-foreground hover:bg-foreground/[0.06]"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
