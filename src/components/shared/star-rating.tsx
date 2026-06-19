import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = 14,
  className,
  showValue,
  reviewCount,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  reviewCount?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center" aria-label={`Rated ${rating} of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={i < rounded ? "text-warning" : "text-white/15"}
            fill="currentColor"
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof reviewCount === "number" && (
        <span className="text-xs text-muted-foreground">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
