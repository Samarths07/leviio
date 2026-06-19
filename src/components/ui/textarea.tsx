import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, maxLength, ...props }, ref) => (
  <textarea
    ref={ref}
    // Global oversized-input guard; callers can override per field.
    maxLength={maxLength ?? 5000}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
