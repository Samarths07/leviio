"use client";

import { useState } from "react";
import { DollarSign, Package, TrendingUp, UserPlus, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  clientsByWeek,
  completedOrders,
  revenueByDay,
  revenueByType,
  topProductsFromOrders,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { OrderStatus } from "@/components/dashboard/order-status";
import {
  AcquisitionBarChart,
  CategoryPieChart,
  RevenueAreaChart,
} from "@/components/dashboard/charts";

const ranges = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

export default function AnalyticsPage() {
  const { orders, clients } = useApp();
  const [range, setRange] = useState("30");
  const days = Number(range);

  const completed = completedOrders(orders);
  const series = revenueByDay(orders, days);
  const rangeStart = Date.now() - days * 86400000;

  const totalRevenue = completed.reduce((s, o) => s + o.amount, 0);
  const newClients = clients.filter(
    (c) => new Date(c.startDate).getTime() >= rangeStart
  ).length;
  const productsSold = completed.reduce((s, o) => s + (o.quantity ?? 1), 0);
  const avgRevenuePerClient = clients.length
    ? Math.round(totalRevenue / clients.length)
    : 0;

  const activeClients = clients.filter((c) => c.status !== "Inactive").length;
  const churnedClients = clients.filter((c) => c.status === "Inactive").length;
  const retentionRate = activeClients + churnedClients
    ? Math.round((activeClients / (activeClients + churnedClients)) * 100)
    : 0;
  const avgLifetimeMonths = clients.length
    ? Math.max(
        1,
        Math.round(
          clients.reduce(
            (s, c) => s + (Date.now() - new Date(c.startDate).getTime()) / (30 * 86400000),
            0
          ) / clients.length
        )
      )
    : 0;

  const category = revenueByType(orders);
  const totalCategory = category.reduce((s, c) => s + c.value, 0);
  const topProducts = topProductsFromOrders(orders, 6);
  const maxProduct = Math.max(1, ...topProducts.map((p) => p.revenue));
  const acquisition = clientsByWeek(clients, 6);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your revenue and growth.</p>
        </div>
        <Tabs tabs={ranges} value={range} onChange={setRange} />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} accent="primary" />
        <StatCard label="New Clients" value={String(newClients)} icon={UserPlus} accent="success" />
        <StatCard label="Products Sold" value={String(productsSold)} icon={Package} accent="warning" />
        <StatCard label="Avg / Client" value={formatCurrency(avgRevenuePerClient)} icon={Users} />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
          <CardContent>
            {totalCategory === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <>
                <CategoryPieChart data={category} />
                <div className="mt-3 space-y-1.5">
                  {category.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-muted-foreground">{c.name}</span>
                      </span>
                      <span className="font-semibold text-foreground">
                        {Math.round((c.value / totalCategory) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products + acquisition */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
            {topProducts.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1 font-medium text-foreground">{p.name}</span>
                  <span className="shrink-0 font-bold text-foreground">{formatCurrency(p.revenue)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={(p.revenue / maxProduct) * 100} className="h-1.5" />
                  <span className="shrink-0 text-xs text-muted-foreground">{p.sales} sold</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client Acquisition</CardTitle></CardHeader>
          <CardContent>
            <AcquisitionBarChart data={acquisition} />
            <p className="mt-2 text-center text-xs text-muted-foreground">New clients per week</p>
          </CardContent>
        </Card>
      </div>

      {/* Retention */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Retention Rate</p>
          <p className="mt-3 text-3xl font-extrabold text-success">{retentionRate}%</p>
          <Progress value={retentionRate} className="mt-3 h-2" barClassName="bg-success" />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Active vs Inactive</p>
          <div className="mt-3 flex items-end gap-4">
            <div>
              <p className="text-2xl font-extrabold text-foreground">{activeClients}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-danger">{churnedClients}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </div>
          <Progress
            value={activeClients + churnedClients ? (activeClients / (activeClients + churnedClients)) * 100 : 0}
            className="mt-3 h-2"
          />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Avg Client Lifetime</p>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{avgLifetimeMonths}</p>
          <p className="text-xs text-muted-foreground">months per client</p>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-y border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5 font-semibold">Date</th>
                  <th className="px-5 py-2.5 font-semibold">Client</th>
                  <th className="px-5 py-2.5 font-semibold">Product</th>
                  <th className="px-5 py-2.5 font-semibold">Method</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No transactions yet.
                    </td>
                  </tr>
                )}
                {orders.slice(0, 12).map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-muted-foreground">{t.date}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{t.client}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.product}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.method}</td>
                    <td className="px-5 py-3"><OrderStatus status={t.status} /></td>
                    <td className="px-5 py-3 text-right font-bold text-foreground">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
