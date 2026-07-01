"use client";

import Link from "next/link";
import {
  Apple,
  ArrowRight,
  CalendarPlus,
  DollarSign,
  ExternalLink,
  Package,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { overviewMetrics, revenueByDay, topProductsFromOrders } from "@/lib/analytics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RevenueLineChart } from "@/components/dashboard/charts";
import { OrderStatus } from "@/components/dashboard/order-status";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Add Product", icon: Package, href: "/dashboard/products?new=1" },
  { label: "Add Client", icon: UserPlus, href: "/dashboard/clients?new=1" },
  { label: "Book a Session", icon: CalendarPlus, href: "/dashboard/calendar" },
  { label: "Create Diet Plan", icon: Apple, href: "/dashboard/diet-planner?tab=create" },
];

export default function OverviewPage() {
  const { user, clients, events, orders } = useApp();

  const metrics = overviewMetrics(orders, clients, events);
  const revenue30 = revenueByDay(orders, 30);
  const revenueTotal = revenue30.reduce((s, d) => s + d.revenue, 0);
  const topProducts = topProductsFromOrders(orders, 5);
  const maxRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));

  const recentOrders = orders.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...events]
    .filter((e) => e.date >= today && e.clientName)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);
  const recentClients = clients.slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Overview
          </p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground md:block">
            {formatDate(today, "long")}
          </span>
          {user?.username && (
            <a
              href={`/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="h-4 w-4" /> View store
            </a>
          )}
        </div>
      </div>

      {/* Setup / activation checklist */}
      <SetupChecklist />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(metrics.revenueThisMonth)}
          icon={DollarSign}
          change={metrics.revenueChange || undefined}
          accent="primary"
        />
        <StatCard
          label="Active Clients"
          value={String(metrics.activeClients)}
          icon={Users}
          hint={metrics.newClientsThisWeek ? `+${metrics.newClientsThisWeek} this week` : undefined}
          accent="success"
        />
        <StatCard
          label="Products Sold"
          value={String(metrics.productsSold)}
          icon={ShoppingCart}
          accent="warning"
        />
        <StatCard
          label="Upcoming Sessions"
          value={String(metrics.upcomingSessions)}
          icon={CalendarPlus}
          hint="Next 7 days"
          accent="primary"
        />
      </div>

      {/* Quick actions */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-foreground/[0.02] hover:ring-1 hover:ring-primary/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition-transform group-hover:scale-110">
                <a.icon className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-bold text-foreground">{a.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" /> Revenue · last 30 days
            </CardTitle>
            <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-foreground">
              {formatCurrency(revenueTotal)}
            </p>
          </div>
          {metrics.revenueChange !== 0 && (
            <Badge variant={metrics.revenueChange > 0 ? "success" : "danger"}>
              {metrics.revenueChange > 0 ? "+" : ""}
              {metrics.revenueChange}% vs last month
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <RevenueLineChart data={revenue30} />
        </CardContent>
      </Card>

      {/* Orders + Top products */}
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-y border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-semibold">Order</th>
                    <th className="px-5 py-2.5 font-semibold">Product</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No orders yet — they&apos;ll appear here after your first sale.
                      </td>
                    </tr>
                  )}
                  {recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs font-semibold text-primary">{o.id}</p>
                        <p className="text-xs text-muted-foreground">{o.client}</p>
                      </td>
                      <td className="px-5 py-3 text-foreground/90">{o.product}</td>
                      <td className="px-5 py-3">
                        <OrderStatus status={o.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-foreground">
                        {formatCurrency(o.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
            {topProducts.map((p, i) => (
              <div key={p.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06] text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="line-clamp-1 font-medium text-foreground">{p.name}</span>
                  </span>
                  <span className="shrink-0 font-bold text-foreground">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={(p.revenue / maxRevenue) * 100} className="h-1.5" />
                  <span className="shrink-0 text-xs text-muted-foreground">{p.sales} sold</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming sessions + Recent clients */}
      <div className="grid gap-6 [&>*]:min-w-0 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming Sessions</CardTitle>
            <Link
              href="/dashboard/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No upcoming sessions.
              </p>
            )}
            {upcoming.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ backgroundColor: e.color + "26", color: e.color }}
                >
                  {formatDate(e.date, "short").split(" ")[1]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{e.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.type} · {e.time}
                  </p>
                </div>
                <Link
                  href="/dashboard/calendar"
                  className={cn(buttonVariants({ variant: "subtle", size: "sm" }))}
                >
                  View
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Clients</CardTitle>
            <Link
              href="/dashboard/clients"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentClients.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No clients yet.
              </p>
            )}
            {recentClients.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/30"
              >
                <Avatar name={c.name} seed={c.avatarSeed} size={40} ring />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(c.startDate, "short")}
                  </p>
                </div>
                <Badge variant="secondary">{c.goal}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
