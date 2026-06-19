import { Sparkles } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-xs font-medium text-foreground">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      You&apos;re exploring the{" "}
      <span className="font-bold text-primary">demo account</span> — all data is
      sample data and resets on logout.
    </div>
  );
}
