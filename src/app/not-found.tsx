import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo showText={false} className="scale-150" />
      <p className="mt-6 text-5xl font-extrabold text-foreground">404</p>
      <h1 className="mt-2 text-xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className={`${buttonVariants({ size: "lg" })} mt-6`}>
        Back home
      </Link>
    </div>
  );
}
