import type { CalendarEvent, Client, Order } from "./types";

/**
 * Derives dashboard/analytics metrics from the creator's REAL data (orders,
 * clients, events). A brand-new creator gets zeros and empty series — never
 * demo numbers.
 */
const DAY = 86400000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

export function completedOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === "Completed");
}

/** Daily revenue for the last `days` days (oldest → newest). */
export function revenueByDay(orders: Order[], days: number): { date: string; revenue: number }[] {
  const completed = completedOrders(orders);
  return Array.from({ length: days }, (_, i) => {
    const date = ymd(new Date(Date.now() - (days - 1 - i) * DAY));
    const revenue = completed
      .filter((o) => o.date === date)
      .reduce((s, o) => s + o.amount, 0);
    return { date, revenue };
  });
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  sales: number;
}

/** Best-selling products aggregated from real orders. */
export function topProductsFromOrders(orders: Order[], n = 5): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const o of completedOrders(orders)) {
    const cur =
      map.get(o.product) ??
      { id: o.productId ?? o.product, name: o.product, revenue: 0, sales: 0 };
    cur.revenue += o.amount;
    cur.sales += o.quantity ?? 1;
    map.set(o.product, cur);
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n);
}

const TYPE_COLORS: Record<string, string> = {
  Digital: "#7c3aed",
  Service: "#22c55e",
  Physical: "#f59e0b",
  Membership: "#06b6d4",
};

/** Revenue split by product type (for the category pie). */
export function revenueByType(orders: Order[]): { name: string; value: number; color: string }[] {
  const map = new Map<string, number>();
  for (const o of completedOrders(orders)) {
    const key = o.type ?? "Digital";
    map.set(key, (map.get(key) ?? 0) + o.amount);
  }
  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
    color: TYPE_COLORS[name] ?? "#71717a",
  }));
}

/** New clients per week for the last `weeks` weeks (oldest → newest). */
export function clientsByWeek(clients: Client[], weeks = 6): { week: string; new: number; returning: number }[] {
  return Array.from({ length: weeks }, (_, i) => {
    const start = Date.now() - (weeks - 1 - i) * 7 * DAY;
    const end = start + 7 * DAY;
    const count = clients.filter((c) => {
      const t = new Date(c.startDate).getTime();
      return t >= start && t < end;
    }).length;
    return { week: `W${i + 1}`, new: count, returning: 0 };
  });
}

export interface OverviewMetrics {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueChange: number;
  activeClients: number;
  newClientsThisWeek: number;
  productsSold: number;
  upcomingSessions: number;
}

export function overviewMetrics(
  orders: Order[],
  clients: Client[],
  events: CalendarEvent[]
): OverviewMetrics {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const completed = completedOrders(orders);
  const sumBetween = (from: number, to: number) =>
    completed
      .filter((o) => {
        const t = new Date(o.date).getTime();
        return t >= from && t < to;
      })
      .reduce((s, o) => s + o.amount, 0);

  const revenueThisMonth = sumBetween(monthStart, now.getTime() + DAY);
  const prevRevenue = sumBetween(prevStart, monthStart);
  const revenueChange =
    prevRevenue > 0 ? Math.round(((revenueThisMonth - prevRevenue) / prevRevenue) * 100) : 0;

  const weekAgo = Date.now() - 7 * DAY;
  const newClientsThisWeek = clients.filter(
    (c) => new Date(c.startDate).getTime() >= weekAgo
  ).length;

  const today = ymd(now);
  const in7 = ymd(new Date(Date.now() + 7 * DAY));
  const upcomingSessions = events.filter((e) => e.date >= today && e.date <= in7).length;

  return {
    totalRevenue: completed.reduce((s, o) => s + o.amount, 0),
    revenueThisMonth,
    revenueChange,
    activeClients: clients.filter((c) => c.status !== "Inactive").length,
    newClientsThisWeek,
    productsSold: completed.reduce((s, o) => s + (o.quantity ?? 1), 0),
    upcomingSessions,
  };
}
