import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://leviio.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private app surfaces out of search results.
      disallow: ["/dashboard", "/portal", "/onboarding", "/api", "/book"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
