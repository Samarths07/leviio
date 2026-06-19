import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, opts?: { cents?: boolean }): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: opts?.cents ? 2 : value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Length of the free Pro trial, in days */
export const TRIAL_DAYS = 30;

/** ISO timestamp for a fresh trial expiry, `days` from now */
export function newTrialExpiry(days = TRIAL_DAYS): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

/** Break a millisecond duration into d/h/m/s parts (clamped at 0) */
export function countdownParts(ms: number) {
  const d = Math.max(0, ms);
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor(d / 3600000) % 24,
    minutes: Math.floor(d / 60000) % 60,
    seconds: Math.floor(d / 1000) % 60,
  };
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(
  date: string | number | Date,
  style: "short" | "medium" | "long" = "medium"
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (style === "short")
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(d);
  if (style === "long")
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatTime(time: string): string {
  // expects "HH:MM"
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d, "short");
}

export function avatarUrl(seed: string, size = 200): string {
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;
}

export function img(seed: string, w = 600, h = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Deterministic pseudo-random number generator for stable mock data */
export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
