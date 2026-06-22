import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { blogPosts, getPost } from "@/lib/blog";
import { img, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return { title: "Article — Leviio" };
  return { title: `${post.title} — Leviio`, description: post.excerpt };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="primary">{post.category}</Badge>
        <span>
          {formatDate(post.date)} · {post.readMins} min read
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-4 flex items-center gap-3">
        <Avatar name={post.author.name} seed={post.author.name} size={40} ring />
        <div>
          <p className="text-sm font-bold text-foreground">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">{post.author.role}</p>
        </div>
      </div>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
        <Image
          src={img(post.cover, 1200, 675)}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority
        />
      </div>

      <div className="legal-body mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/90">
        {post.body.map((block, i) => {
          if (block.type === "h2") {
            return (
              <h2
                key={i}
                className="pt-2 text-xl font-extrabold tracking-tight text-foreground"
              >
                {block.text}
              </h2>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {block.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            );
          }
          return <p key={i}>{block.text}</p>;
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">
          Ready to build your fitness business?
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Launch your store, manage clients, and get paid — all in one place.
        </p>
        <Link href="/signup" className={`${buttonVariants({ size: "lg" })} mt-5`}>
          Start your free trial
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
