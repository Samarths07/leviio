import Image from "next/image";
import Link from "next/link";
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
      <Image
        src="/logo.png"
        alt="Leviio"
        width={32}
        height={32}
        priority
        className="h-8 w-8 rounded-lg object-contain"
      />
      {showText && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          Lev<span className="text-primary">iio</span>
        </span>
      )}
    </Link>
  );
}
