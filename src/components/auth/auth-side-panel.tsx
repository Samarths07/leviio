import { Check } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/star-rating";

const benefits = [
  "Launch your branded store in minutes",
  "Manage clients, plans & coaching in one place",
  "Build diet & workout programs in seconds",
  "Get paid and track revenue automatically",
];

export function AuthSidePanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-card p-10 lg:flex">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />

      <Logo />

      <div className="relative">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
          The all-in-one platform for fitness creators
        </h2>
        <ul className="mt-6 space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-foreground/90">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <figure className="relative rounded-2xl border border-border bg-background/40 p-5">
        <StarRating rating={5} size={14} />
        <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">
          “Leviio replaced 5 different tools I was paying for. My revenue is up
          40% since switching.”
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-3">
          <Avatar name="Alisha Fernandez" seed="alisha-fernandez" size={38} ring />
          <div>
            <p className="text-sm font-bold text-foreground">Alisha Fernandez</p>
            <p className="text-xs text-muted-foreground">@alishafits</p>
          </div>
        </figcaption>
      </figure>
    </div>
  );
}
