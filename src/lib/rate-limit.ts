import { NextResponse } from "next/server";

/**
 * Server-side rate limiting + payload guards for API routes.
 *
 * NOTE: this is an in-memory limiter — effective against bursts/brute-force on a
 * warm serverless instance, but not shared across instances. For hard multi-
 * instance guarantees, back it with Upstash Redis / Supabase; the call sites
 * here stay identical. Supabase Auth also enforces its own server-side limits.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Auth-sensitive routes: 5 attempts / 15 minutes. */
export const AUTH_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };
/** Default for other endpoints. */
export const DEFAULT_LIMIT = { max: 60, windowMs: 60 * 1000 };

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Enforce rate limit + max payload size. Returns a NextResponse (429/413) when
 * the request should be rejected, or null when it may proceed.
 */
export function guard(
  req: Request,
  opts: { name: string; max: number; windowMs: number; maxBytes?: number }
): NextResponse | null {
  // Reject oversized payloads before doing any work.
  const maxBytes = opts.maxBytes ?? 100_000; // 100 KB default for JSON bodies
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const now = Date.now();
  const key = `${opts.name}:${clientIp(req)}`;
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
  } else {
    b.count++;
    if (b.count > opts.max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of Array.from(buckets.entries())) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }
  return null;
}
