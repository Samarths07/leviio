"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Light/dark toggle button. Reads the theme applied by the no-flash script. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => setThemeState(currentTheme()), []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setThemeState(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-foreground/[0.06]",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
