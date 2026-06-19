import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  hint,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  change?: number;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "danger";
}) {
  const positive = (change ?? 0) >= 0;
  const accentMap = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accentMap[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {typeof change === "number" && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
              positive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="mt-4 truncate text-2xl font-extrabold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-success">{hint}</p>}
    </Card>
  );
}
