"use client";

import { useMemo, useState } from "react";
import { DollarSign, Package, TrendingUp, UserPlus, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  acquisitionData,
  analyticsStats,
  categoryRevenue,
  revenueSeries,
  topProducts,
} from "@/lib/mock-data";
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
  const { orders } = useApp();
  const [range, setRange] = useState("30");
  const series = useMemo(() => revenueSeries(Number(range)), [range]);
  const totalCategory = categoryRevenue.reduce((s, c) => s + c.value, 0);
  const maxProduct = Math.max(...topProducts.map((p) => p.revenue));

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
        <StatCard label="Total Revenue" value={formatCurrency(analyticsStats.totalRevenue)} icon={DollarSign} change={analyticsStats.revenueChange} />
        <StatCard label="New Clients" value={String(analyticsStats.newClients)} icon={UserPlus} change={14} accent="success" />
        <StatCard label="Products Sold" value={String(analyticsStats.productsSold)} icon={Package} change={9} accent="warning" />
        <StatCard label="Avg / Client" value={formatCurrency(analyticsStats.avgRevenuePerClient)} icon={Users} change={6} />
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
            <CategoryPieChart data={categoryRevenue} />
            <div className="mt-3 space-y-1.5">
              {categoryRevenue.map((c) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Top products + acquisition */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1 font-medium text-foreground">{p.name}</span>
                  <span className="shrink-0 font-bold text-foreground">{formatCurrency(p.revenue)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={(p.revenue / maxProduct) * 100} className="h-1.5" />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {Math.round((p.revenue / maxProduct) * 100)}% · {p.sales} sold
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client Acquisition</CardTitle></CardHeader>
          <CardContent>
            <AcquisitionBarChart data={acquisitionData} />
            <div className="mt-2 flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> New clients
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3f3f46]" /> Returning
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Retention Rate</p>
          <p className="mt-3 text-3xl font-extrabold text-success">{analyticsStats.retentionRate}%</p>
          <Progress value={analyticsStats.retentionRate} className="mt-3 h-2" barClassName="bg-success" />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Active vs Churned</p>
          <div className="mt-3 flex items-end gap-4">
            <div>
              <p className="text-2xl font-extrabold text-foreground">{analyticsStats.activeClients}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-danger">{analyticsStats.churnedClients}</p>
              <p className="text-xs text-muted-foreground">Churned</p>
            </div>
          </div>
          <Progress
            value={(analyticsStats.activeClients / (analyticsStats.activeClients + analyticsStats.churnedClients)) * 100}
            className="mt-3 h-2"
          />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-foreground">Avg Client Lifetime</p>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{analyticsStats.avgLifetimeMonths}</p>
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
