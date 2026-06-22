import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://leviio.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/features", "/pricing", "/about", "/blog", "/privacy", "/terms"].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })
  );
  const posts = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...posts];
}
