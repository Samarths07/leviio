import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full bg-brand-gradient transition-all duration-500", barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
