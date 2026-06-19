import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-[0_4px_14px_-4px_rgba(124,58,237,0.7)]">
        <Zap className="h-5 w-5 text-white" fill="currentColor" />
      </span>
      {showText && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          Lev<span className="text-primary">iio</span>
        </span>
      )}
    </Link>
  );
}
