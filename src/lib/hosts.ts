// Cross-host URL helpers for the optional split between the creator app and the
// client portal subdomain (Option A).
//
//   NEXT_PUBLIC_APP_HOST    e.g. "leviio.com"        — serves the creator app
//   NEXT_PUBLIC_PORTAL_HOST e.g. "portal.leviio.com" — serves the client portal
//
// When these are unset (local dev / single-domain), the helpers return plain
// relative paths so everything keeps working on one origin.

export const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST;
export const PORTAL_HOST = process.env.NEXT_PUBLIC_PORTAL_HOST;

function withHost(host: string | undefined, path: string): string {
  if (!host) return path; // single-domain fallback
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "https:";
  return `${protocol}//${host}${path}`;
}

/** URL to a client-portal page (on the portal subdomain when configured). */
export function portalUrl(path = "/portal/login"): string {
  return withHost(PORTAL_HOST, path);
}

/** URL to a creator-app page (on the main host when configured). */
export function appUrl(path = "/"): string {
  return withHost(APP_HOST, path);
}
