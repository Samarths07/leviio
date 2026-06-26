import { landingTestimonials } from "@/lib/marketing";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function Testimonials() {
  // No fabricated reviews — only render once real testimonials are added.
  if (landingTestimonials.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="text-center">
        <Badge variant="primary" className="mx-auto">
          Loved by creators
        </Badge>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          What creators say
        </h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {landingTestimonials.map((t) => (
          <Card key={t.handle} className="p-6">
            <StarRating rating={t.rating} size={16} />
            <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
              “{t.quote}”
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <Avatar name={t.name} seed={t.avatarSeed} size={42} ring />
              <div>
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.handle}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
