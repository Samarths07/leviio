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
  const isDashboard = path.startsWith("/dashboard");
  const isPortalApp =
    path.startsWith("/portal") &&
    path !== "/portal/login" &&
    path !== "/portal/reset";

  // Server-side role gate — race-free, runs before the page renders.
  // A "creator" is an account that has a profiles row; a "client" has none.
  if (isDashboard || isPortalApp) {
    const redirectTo = (to: string) => {
      const r = NextResponse.redirect(new URL(to, request.url));
      response.cookies.getAll().forEach((c) => r.cookies.set(c));
      return r;
    };

    if (!user) return redirectTo(isDashboard ? "/login" : "/portal/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    const isCreator = !!profile;

    // Creator dashboard requires a creator; client portal forbids creators.
    if (isDashboard && !isCreator) return redirectTo("/portal");
    if (isPortalApp && isCreator) return redirectTo("/dashboard");
  }

  return response;
}

export const config = {
  // Run on app routes, skipping static assets and image optimization.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
