import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export interface LegalSection {
  id: string;
  heading: string;
  content: ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  updated,
  sections,
}: {
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Legal
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: <span className="font-semibold text-foreground">{updated}</span>
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              On this page
            </p>
            <nav className="mt-3 space-y-1">
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  {i + 1}. {s.heading}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Body */}
        <article className="min-w-0 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {i + 1}. {s.heading}
              </h2>
              <div className="legal-body mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {s.content}
              </div>
            </section>
          ))}

          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Questions about this document? Contact us at{" "}
            <a href="mailto:legal@leviio.com" className="font-semibold text-primary hover:underline">
              legal@leviio.com
            </a>
            . See also our{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="font-semibold text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </div>
        </article>
      </div>
    </div>
  );
}
