import {
  BarChart2,
  DollarSign,
  Dumbbell,
  Users,
  Zap,
} from "lucide-react";

export function DashboardPreview() {
  const bars = [40, 65, 52, 80, 60, 95, 72];
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/20 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* window bar */}
        <div className="flex items-center gap-1.5 border-b border-border bg-background/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground">
            leviio.app/dashboard
          </span>
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-12 flex-col items-center gap-3 border-r border-border bg-background/40 py-4 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
              <Zap className="h-4 w-4 text-white" fill="currentColor" />
            </span>
            {[Users, Dumbbell, BarChart2].map((Icon, i) => (
              <span
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>

          {/* content */}
          <div className="flex-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="h-3 w-24 rounded bg-white/[0.08]" />
                <div className="mt-1.5 h-2 w-16 rounded bg-white/[0.04]" />
              </div>
              <div className="h-7 w-20 rounded-lg bg-brand-gradient" />
            </div>

            {/* stat cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: DollarSign, v: "$4,280", c: "text-primary" },
                { icon: Users, v: "38", c: "text-success" },
                { icon: BarChart2, v: "127", c: "text-warning" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-background/40 p-2.5">
                  <s.icon className={`h-3.5 w-3.5 ${s.c}`} />
                  <p className="mt-1.5 text-sm font-bold text-foreground">{s.v}</p>
                  <div className="mt-1 h-1.5 w-8 rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>

            {/* chart */}
            <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
              <div className="h-2 w-20 rounded bg-white/[0.06]" />
              <div className="mt-3 flex h-24 items-end gap-2">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-brand-gradient"
                    style={{ height: `${h}%`, opacity: 0.5 + (h / 100) * 0.5 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
