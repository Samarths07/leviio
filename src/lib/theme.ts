"use client";

export type Theme = "light" | "dark";
export const THEME_KEY = "leviio_theme";

/** Apply a theme to <html> and persist it. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** The theme currently applied to <html> (dark is the default). */
export function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/**
 * Inline script (runs before paint) that applies the saved theme — or the OS
 * preference when none is saved — so there's no flash of the wrong theme.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var light=t?t==='light':window.matchMedia('(prefers-color-scheme: light)').matches;if(light)document.documentElement.classList.add('light');}catch(e){}})();`;
