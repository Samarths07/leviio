"use client";

/** Dependency-free responsive bar chart for admin trends. */
export function BarChart({
  data,
  format = (n) => String(n),
  className,
}: {
  data: { label: string; value: number }[];
  format?: (n: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={className}>
      <div className="flex h-40 items-end gap-2">
        {data.map((d, i) => (
          <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {format(d.value)}
            </span>
            <div
              className="w-full rounded-t-md bg-primary/80 transition-all group-hover:bg-primary"
              style={{ height: `${Math.max(4, (d.value / max) * 140)}px` }}
            />
            <span className="text-[11px] font-medium text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
