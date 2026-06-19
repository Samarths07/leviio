import Image from "next/image";
import { avatarUrl, cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  seed,
  size = 40,
  className,
  ring,
}: {
  name: string;
  seed?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-foreground",
        ring && "ring-2 ring-border",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={avatarUrl(seed ?? name, Math.max(80, size * 2))}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
      <span className="sr-only">{initials(name)}</span>
    </span>
  );
}

export function AvatarInitials({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
