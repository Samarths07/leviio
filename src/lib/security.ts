/**
 * Client-side security helpers.
 *
 * IMPORTANT: This is a frontend-only MVP with no backend. These measures are
 * defense-in-depth / UX guards and are NOT a real security boundary — anything
 * enforced in the browser can be bypassed. Real rate limiting, auth, input
 * validation and secret storage must live on a server before production.
 */

// ---------------- Input size limits ----------------
export const LIMITS = {
  name: 80,
  email: 120,
  password: 128,
  short: 240,
  code: 32,
  bio: 600,
  notes: 2000,
  textarea: 5000,
  /** Max serialized size for a single localStorage value (~2MB). */
  storageBytes: 2_000_000,
} as const;

/**
 * Strip control characters (keeping tab/newline) and cap length.
 * Use on free-text before persisting. React already escapes on render, so this
 * is hardening against malformed payloads, not the primary XSS defense.
 */
export function sanitizeText(value: string, max: number = LIMITS.short): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    const isControl = (code < 32 && code !== 9 && code !== 10) || code === 127;
    if (!isControl) out += ch;
  }
  return out.slice(0, max).trim();
}

/** True if a value is too large / malformed to safely persist. */
export function isOversized(value: unknown, maxBytes: number = LIMITS.storageBytes): boolean {
  try {
    return JSON.stringify(value).length > maxBytes;
  } catch {
    return true; // unserialisable === reject
  }
}

// ---------------- Auth rate limiting (sliding window) ----------------
const ATTEMPTS_KEY = "leviio_auth_attempts";
export const AUTH_MAX_ATTEMPTS = 5;
export const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function readAttempts(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeAttempts(times: number[]) {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(times));
  } catch {
    /* ignore */
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/** Current lockout status without recording a new attempt. */
export function authLockStatus(): RateLimitResult {
  const now = Date.now();
  const times = readAttempts().filter((t) => now - t < AUTH_WINDOW_MS);
  if (times.length >= AUTH_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, retryAfterMs: AUTH_WINDOW_MS - (now - times[0]) };
  }
  return { allowed: true, remaining: AUTH_MAX_ATTEMPTS - times.length, retryAfterMs: 0 };
}

/** Records an auth attempt and reports whether it's allowed (max 5 / 15 min). */
export function recordAuthAttempt(): RateLimitResult {
  const now = Date.now();
  const times = readAttempts().filter((t) => now - t < AUTH_WINDOW_MS);
  if (times.length >= AUTH_MAX_ATTEMPTS) {
    writeAttempts(times);
    return { allowed: false, remaining: 0, retryAfterMs: AUTH_WINDOW_MS - (now - times[0]) };
  }
  times.push(now);
  writeAttempts(times);
  return { allowed: true, remaining: AUTH_MAX_ATTEMPTS - times.length, retryAfterMs: 0 };
}

/** Clears the attempt log (call after a confirmed successful auth). */
export function clearAuthAttempts() {
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    /* ignore */
  }
}

export function formatRetry(ms: number): string {
  const mins = Math.ceil(ms / 60000);
  return mins <= 1 ? "1 minute" : `${mins} minutes`;
}
