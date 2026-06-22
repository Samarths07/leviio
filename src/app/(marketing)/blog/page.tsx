import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/lib/blog";
import { img, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Blog — Leviio",
  description:
    "Playbooks and practical advice for fitness creators — launching your store, pricing, and growing recurring revenue.",
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <div>
      <section className="mx-auto max-w-3xl px-4 pt-16 text-center sm:px-6 lg:px-8">
        <Badge variant="primary" className="mx-auto">
          Blog
        </Badge>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          The Leviio playbook
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Practical advice for fitness creators — launching, pricing, and growing
          a business you actually own.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Featured post */}
        <Link href={`/blog/${featured.slug}`} className="group block">
          <Card hover className="overflow-hidden lg:grid lg:grid-cols-2">
            <div className="relative aspect-[16/10] lg:aspect-auto">
              <Image
                src={img(featured.cover, 1000, 700)}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{featured.category}</Badge>
                <span>
                  {formatDate(featured.date)} · {featured.readMins} min read
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {featured.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {featured.excerpt}
              </p>
              <span className="mt-4 text-sm font-semibold text-primary">
                Read article →
              </span>
            </div>
          </Card>
        </Link>

        {/* Rest */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <Card hover className="flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={img(post.cover, 600, 400)}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span>{post.readMins} min read</span>
                  </div>
                  <h3 className="mt-3 font-bold text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 text-xs text-muted-foreground">
                    {formatDate(post.date)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
