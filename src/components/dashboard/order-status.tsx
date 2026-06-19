import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Completed: "bg-success/15 text-success",
  Paid: "bg-success/15 text-success",
  Processing: "bg-warning/15 text-warning",
  Pending: "bg-warning/15 text-warning",
  Refunded: "bg-danger/15 text-danger",
};

export function OrderStatus({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
        map[status] ?? "bg-white/10 text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
