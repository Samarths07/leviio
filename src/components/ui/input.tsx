import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, maxLength, ...props }, ref) => (
  <input
    ref={ref}
    // Global oversized-input guard; callers can override per field.
    maxLength={maxLength ?? 240}
    className={cn(
      "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "mb-1.5 block text-xs font-semibold text-muted-foreground",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
