import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session on every request so server components and
 * route handlers always see a valid token. No-ops when Supabase isn't
 * configured (mock mode), so the demo deploy works without any env vars.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Touch the session to trigger a refresh when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const proto = request.nextUrl.protocol; // "https:" in prod
  const host = request.headers.get("host") ?? "";

  // Optional two-host split (Option A): creator app on APP_HOST, client portal
  // on PORTAL_HOST. Active only when BOTH are configured; otherwise single-domain.
  const appHost = process.env.NEXT_PUBLIC_APP_HOST;
  const portalHost = process.env.NEXT_PUBLIC_PORTAL_HOST;
  const splitHosts = Boolean(appHost && portalHost);
  const onPortalHost = splitHosts && host === portalHost;

  const carryCookies = (r: NextResponse) => {
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };
  const ext = (h: string, p: string) =>
    carryCookies(NextResponse.redirect(`${proto}//${h}${p}${search}`));

  // Route a logical path to the correct host (or stay relative in single-domain).
  const goTo = (p: string) => {
    if (!splitHosts) return carryCookies(NextResponse.redirect(new URL(p, request.url)));
    const targetHost = p.startsWith("/portal") ? portalHost! : appHost!;
    return ext(targetHost, p);
  };

  // --- Host routing: keep each surface on its own domain ---
  if (splitHosts) {
    if (onPortalHost) {
      // The portal subdomain serves ONLY the client portal (+ api + auth callback).
      if (path === "/") return ext(portalHost!, "/portal/login");
      if (
        !path.startsWith("/portal") &&
        !path.startsWith("/api") &&
        !path.startsWith("/auth")
      ) {
        return ext(appHost!, path);
      }
    } else if (host === appHost) {
      // The main host hands the client portal off to the subdomain.
      if (path.startsWith("/portal")) return ext(portalHost!, path);
    }
  }

  const isDashboard = path.startsWith("/dashboard");
  const isPortalApp =
    path.startsWith("/portal") &&
    path !== "/portal/login" &&
    path !== "/portal/reset";

  // Server-side role gate — race-free, runs before the page renders.
  // A "creator" is an account that has a profiles row; a "client" has none.
  if (isDashboard || isPortalApp) {
    if (!user) return goTo(isDashboard ? "/login" : "/portal/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    const isCreator = !!profile;

    // Creator dashboard requires a creator; client portal forbids creators.
    if (isDashboard && !isCreator) return goTo("/portal");
    if (isPortalApp && isCreator) return goTo("/dashboard");
  }

  return response;
}

export const config = {
  // Run on app routes, skipping static assets and image optimization.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
