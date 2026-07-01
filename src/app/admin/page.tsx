"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Ban,
  BadgeCheck,
  DollarSign,
  LayoutDashboard,
  Loader2,
  Package,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { BarChart } from "@/components/admin/bar-chart";

interface Overview {
  creators: number; proCreators: number; freeCreators: number; clients: number;
  products: number; publishedProducts: number; orders: number; gmv: number;
  platformFees: number; refundedAmount: number; mrr: number; arpu: number;
  activeCreators: number; newCreators30d: number;
  signupSeries: { label: string; value: number }[];
  revenueSeries: { label: string; value: number }[];
}
interface CreatorRow {
  id: string; name: string; email: string; username: string; plan: string;
  createdAt: string; lastSignIn: string | null; suspended: boolean;
  payoutsConnected: boolean; clients: number; products: number; revenue: number;
}
interface OrderRow {
  id: string; creatorName: string; creatorUsername: string; client_name: string;
  product: string; amount: number; status: string; method: string; date: string;
}
interface ProductRow {
  id: string; name: string; type: string; category: string; price: number;
  status: string; creatorName: string; creatorUsername: string;
}
interface ClientRow {
  id: string; name: string; email: string; phone: string; goal: string;
  status: string; start_date: string; creatorName: string; creatorUsername: string;
}
interface Detail {
  profile: { id: string; name: string; email: string; username: string; niche: string; plan: string; planExpiresAt: string | null; followers: number; createdAt: string; payoutsConnected: boolean };
  revenue: number; platformFees: number; feePct: number;
  orders: { id: string; product: string; client_name: string; amount: number; status: string; date: string }[];
  products: { id: string; name: string; type: string; price: number; status: string }[];
  clients: { id: string; name: string; email: string; status: string; goal: string; start_date: string }[];
}

type TabKey = "overview" | "creators" | "orders" | "products" | "clients";

export default function AdminPage() {
  const { toast } = useToast();
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [tab, setTab] = useState<TabKey>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<CreatorRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    const ov = await fetch("/api/admin/overview");
    if (ov.status === 403 || ov.status === 401) { setState("denied"); return; }
    const [o, c] = await Promise.all([
      ov.json(),
      fetch("/api/admin/creators").then((r) => r.json()),
    ]);
    setOverview(o);
    setCreators(c.creators ?? []);
    setState("ready");
  }, []);

  useEffect(() => { load(); }, [load]);

  // Lazy-load the heavier tabs on first visit.
  useEffect(() => {
    if (state !== "ready" || loaded[tab]) return;
    const fetchers: Partial<Record<TabKey, () => Promise<void>>> = {
      orders: async () => setOrders((await (await fetch("/api/admin/orders")).json()).orders ?? []),
      products: async () => setProducts((await (await fetch("/api/admin/products")).json()).products ?? []),
      clients: async () => setClients((await (await fetch("/api/admin/clients")).json()).clients ?? []),
    };
    fetchers[tab]?.().then(() => setLoaded((p) => ({ ...p, [tab]: true })));
  }, [tab, state, loaded]);

  const refreshOverviewAndCreators = () =>
    Promise.all([
      fetch("/api/admin/overview").then((r) => r.json()).then(setOverview),
      fetch("/api/admin/creators").then((r) => r.json()).then((c) => setCreators(c.creators ?? [])),
    ]);

  const creatorAction = async (body: Record<string, unknown>, ok: string) => {
    const res = await fetch("/api/admin/creator", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { toast(d?.error ?? "Action failed", { variant: "error" }); return false; }
    toast(ok, { variant: "success" });
    return true;
  };

  const setPlan = async (id: string, plan: string) => {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, plan } : c)));
    await creatorAction({ action: "setPlan", id, plan }, `Plan set to ${plan}`);
    refreshOverviewAndCreators();
  };

  const toggleSuspend = async (c: CreatorRow) => {
    const action = c.suspended ? "unsuspend" : "suspend";
    setCreators((prev) => prev.map((x) => (x.id === c.id ? { ...x, suspended: !c.suspended } : x)));
    await creatorAction({ action, id: c.id }, c.suspended ? "Creator reinstated" : "Creator suspended");
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    const okd = await creatorAction({ action: "delete", id: toDelete.id }, `${toDelete.name} deleted`);
    setBusy(false);
    if (okd) {
      setCreators((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
      refreshOverviewAndCreators();
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    const d = await fetch(`/api/admin/creator-detail?id=${id}`).then((r) => r.json());
    setDetail(d?.profile ? d : null);
    setDetailLoading(false);
    if (!d?.profile) toast("Couldn't load creator", { variant: "error" });
  };

  const refundOrder = async (id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Refunded" } : o)));
    const res = await fetch("/api/admin/orders", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refund", id }),
    });
    if (!res.ok) toast("Refund failed", { variant: "error" });
    else { toast("Order refunded", { variant: "info" }); refreshOverviewAndCreators(); }
  };

  const productAction = async (id: string, action: string) => {
    if (action === "delete") setProducts((prev) => prev.filter((p) => p.id !== id));
    else setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: action === "publish" ? "Published" : "Draft" } : p)));
    const res = await fetch("/api/admin/products", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id }),
    });
    if (!res.ok) toast("Action failed", { variant: "error" });
    else toast(action === "delete" ? "Product removed" : action === "publish" ? "Product published" : "Product unpublished", { variant: "info" });
  };

  if (state === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <ShieldAlert className="h-9 w-9 text-danger" />
        <h1 className="text-xl font-extrabold text-foreground">Not authorized</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This area is for platform admins only. Sign in with an admin account (listed in ADMIN_EMAILS).
        </p>
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  const q = query.toLowerCase();
  const stats = [
    { label: "Creators", value: String(overview?.creators ?? 0), icon: Users, hint: `${overview?.proCreators ?? 0} Pro · ${overview?.freeCreators ?? 0} Free` },
    { label: "MRR", value: formatCurrency(overview?.mrr ?? 0), icon: TrendingUp, hint: `${overview?.newCreators30d ?? 0} new this month` },
    { label: "GMV", value: formatCurrency(overview?.gmv ?? 0), icon: DollarSign, hint: `${overview?.orders ?? 0} completed orders` },
    { label: "Platform fees", value: formatCurrency(overview?.platformFees ?? 0), icon: Wallet, hint: "your take from sales" },
    { label: "Clients", value: String(overview?.clients ?? 0), icon: Users, hint: `${overview?.activeCreators ?? 0} active creators` },
    { label: "Products", value: String(overview?.products ?? 0), icon: Package, hint: `${overview?.publishedProducts ?? 0} published` },
    { label: "ARPU", value: formatCurrency(overview?.arpu ?? 0), icon: Receipt, hint: "revenue / creator" },
    { label: "Refunded", value: formatCurrency(overview?.refundedAmount ?? 0), icon: RotateCcw, hint: "lifetime refunds" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" />
          <Badge variant="danger"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> God mode</Badge>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Exit admin</Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Platform Admin</h1>
          <p className="text-sm text-muted-foreground">Full control over every creator, sale, product and client on Leviio.</p>
        </div>

        <Tabs
          value={tab}
          onChange={(v) => { setTab(v as TabKey); setQuery(""); }}
          tabs={[
            { value: "overview", label: "Overview", icon: LayoutDashboard },
            { value: "creators", label: "Creators", icon: Users, count: overview?.creators },
            { value: "orders", label: "Orders", icon: Receipt },
            { value: "products", label: "Products", icon: Package, count: overview?.products },
            { value: "clients", label: "Clients", icon: Users, count: overview?.clients },
          ]}
        />

        {/* ---- OVERVIEW ---- */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stats.map((s) => (
                <Card key={s.label} className="p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><s.icon className="h-4 w-4" /></span>
                  <p className="mt-3 truncate text-xl font-extrabold tracking-tight text-foreground">{s.value}</p>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  {s.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>}
                </Card>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <p className="font-bold text-foreground">New creators</p>
                <p className="mb-4 text-xs text-muted-foreground">Sign-ups over the last 6 months</p>
                <BarChart data={overview?.signupSeries ?? []} />
              </Card>
              <Card className="p-5">
                <p className="font-bold text-foreground">Revenue (GMV)</p>
                <p className="mb-4 text-xs text-muted-foreground">Completed sales over the last 6 months</p>
                <BarChart data={overview?.revenueSeries ?? []} format={(n) => formatCurrency(n)} />
              </Card>
            </div>
          </div>
        )}

        {/* ---- CREATORS ---- */}
        {tab === "creators" && (
          <Card className="overflow-hidden">
            <TableToolbar label={`Creators (${creators.length})`} query={query} setQuery={setQuery} placeholder="Search name / email / handle…" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <Th>Creator</Th><Th>Clients</Th><Th>Products</Th><Th>Revenue</Th><Th>Payouts</Th><Th>Plan</Th><Th className="text-right">Actions</Th>
                </tr></thead>
                <tbody>
                  {creators.filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)).map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.02]">
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(c.id)} className="text-left">
                          <p className="font-semibold text-foreground hover:text-primary">{c.name}{c.suspended && <Badge variant="danger" className="ml-2">Suspended</Badge>}</p>
                          <p className="text-xs text-muted-foreground">{c.email} · @{c.username}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.clients}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.products}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(c.revenue)}</td>
                      <td className="px-4 py-3">{c.payoutsConnected ? <Badge variant="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" />Connected</Badge> : <Badge variant="outline">Not set</Badge>}</td>
                      <td className="px-4 py-3">
                        <Select value={c.plan} onChange={(e) => setPlan(c.id, e.target.value)} className="h-8 w-24">
                          <option value="Free">Free</option><option value="Pro">Pro</option>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openDetail(c.id)} className="text-xs font-semibold text-primary hover:underline">View</button>
                          <button onClick={() => toggleSuspend(c)} aria-label="Suspend" title={c.suspended ? "Reinstate" : "Suspend"} className={c.suspended ? "text-warning hover:opacity-80" : "text-muted-foreground hover:text-warning"}><Ban className="h-4 w-4" /></button>
                          <button onClick={() => setToDelete(c)} aria-label="Delete" className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {creators.length === 0 && <EmptyRow cols={7} text="No creators yet." />}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ---- ORDERS ---- */}
        {tab === "orders" && (
          <Card className="overflow-hidden">
            <TableToolbar label={`Orders (${orders.length})`} query={query} setQuery={setQuery} placeholder="Search product / buyer / creator…" />
            {!loaded.orders ? <LoadingRow /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <Th>Order</Th><Th>Creator</Th><Th>Buyer</Th><Th>Amount</Th><Th>Status</Th><Th>Date</Th><Th className="text-right">Actions</Th>
                  </tr></thead>
                  <tbody>
                    {orders.filter((o) => !q || o.product.toLowerCase().includes(q) || o.client_name.toLowerCase().includes(q) || o.creatorName.toLowerCase().includes(q)).map((o) => (
                      <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.02]">
                        <td className="px-4 py-3"><p className="font-semibold text-foreground">{o.product}</p><p className="text-xs text-muted-foreground">{o.id}</p></td>
                        <td className="px-4 py-3 text-muted-foreground">@{o.creatorUsername || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.client_name}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(Number(o.amount) || 0)}</td>
                        <td className="px-4 py-3"><Badge variant={o.status === "Completed" ? "success" : o.status === "Refunded" ? "danger" : "warning"}>{o.status}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{o.date ? formatDate(o.date, "medium") : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {o.status === "Completed" ? (
                            <button onClick={() => refundOrder(o.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:underline"><RotateCcw className="h-3.5 w-3.5" />Refund</button>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && <EmptyRow cols={7} text="No orders yet." />}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ---- PRODUCTS ---- */}
        {tab === "products" && (
          <Card className="overflow-hidden">
            <TableToolbar label={`Products (${products.length})`} query={query} setQuery={setQuery} placeholder="Search product / creator…" />
            {!loaded.products ? <LoadingRow /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <Th>Product</Th><Th>Creator</Th><Th>Type</Th><Th>Price</Th><Th>Status</Th><Th className="text-right">Actions</Th>
                  </tr></thead>
                  <tbody>
                    {products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.creatorName.toLowerCase().includes(q)).map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.02]">
                        <td className="px-4 py-3"><p className="font-semibold text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></td>
                        <td className="px-4 py-3 text-muted-foreground">@{p.creatorUsername || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(Number(p.price) || 0)}</td>
                        <td className="px-4 py-3"><Badge variant={p.status === "Published" ? "success" : "secondary"}>{p.status}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            {p.status === "Published"
                              ? <button onClick={() => productAction(p.id, "unpublish")} className="text-xs font-semibold text-warning hover:underline">Unpublish</button>
                              : <button onClick={() => productAction(p.id, "publish")} className="text-xs font-semibold text-primary hover:underline">Publish</button>}
                            <button onClick={() => productAction(p.id, "delete")} aria-label="Delete" className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && <EmptyRow cols={6} text="No products yet." />}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ---- CLIENTS ---- */}
        {tab === "clients" && (
          <Card className="overflow-hidden">
            <TableToolbar label={`Clients (${clients.length})`} query={query} setQuery={setQuery} placeholder="Search client / email / creator…" />
            {!loaded.clients ? <LoadingRow /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <Th>Client</Th><Th>Creator</Th><Th>Goal</Th><Th>Status</Th><Th>Joined</Th>
                  </tr></thead>
                  <tbody>
                    {clients.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || c.creatorName.toLowerCase().includes(q)).map((c) => (
                      <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.02]">
                        <td className="px-4 py-3"><p className="font-semibold text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></td>
                        <td className="px-4 py-3 text-muted-foreground">@{c.creatorUsername || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.goal}</td>
                        <td className="px-4 py-3"><Badge variant={c.status === "VIP" ? "primary" : c.status === "Active" ? "success" : "secondary"}>{c.status}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{c.start_date ? formatDate(c.start_date, "medium") : "—"}</td>
                      </tr>
                    ))}
                    {clients.length === 0 && <EmptyRow cols={5} text="No clients yet." />}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </main>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onClose={() => !busy && setToDelete(null)} title="Delete creator?" size="sm">
        <p className="text-sm text-muted-foreground">
          This permanently deletes <span className="font-semibold text-foreground">{toDelete?.name}</span>, their account, store, clients, products and all data. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setToDelete(null)} disabled={busy}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={doDelete} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
          </Button>
        </div>
      </Dialog>

      {/* Creator detail drawer */}
      <Dialog open={detailLoading || !!detail} onClose={() => setDetail(null)} title="Creator details" size="lg">
        {detailLoading || !detail ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">{detail.profile.name}</p>
                <p className="text-xs text-muted-foreground">{detail.profile.email} · @{detail.profile.username}</p>
              </div>
              <Badge variant={detail.profile.plan === "Pro" ? "primary" : "secondary"} className="ml-auto">{detail.profile.plan}</Badge>
              <a href={`/${detail.profile.username}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">Open store ↗</a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Revenue" value={formatCurrency(detail.revenue)} />
              <MiniStat label={`Fees (${detail.feePct}%)`} value={formatCurrency(detail.platformFees)} />
              <MiniStat label="Clients" value={String(detail.clients.length)} />
              <MiniStat label="Products" value={String(detail.products.length)} />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent orders</p>
              <div className="max-h-44 space-y-1 overflow-y-auto">
                {detail.orders.length === 0 && <p className="text-sm text-muted-foreground">No orders.</p>}
                {detail.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="truncate text-foreground">{o.product}</span>
                    <span className="ml-3 flex shrink-0 items-center gap-2">
                      <Badge variant={o.status === "Completed" ? "success" : o.status === "Refunded" ? "danger" : "warning"}>{o.status}</Badge>
                      <span className="font-semibold text-foreground">{formatCurrency(Number(o.amount) || 0)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Joined {formatDate(detail.profile.createdAt, "medium")} · Payouts {detail.profile.payoutsConnected ? "connected" : "not set"} · {detail.profile.followers} followers</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 font-semibold ${className}`}>{children}</th>;
}
function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return <tr><td colSpan={cols} className="px-4 py-10 text-center text-sm text-muted-foreground">{text}</td></tr>;
}
function LoadingRow() {
  return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="truncate text-base font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
function TableToolbar({ label, query, setQuery, placeholder }: { label: string; query: string; setQuery: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-bold text-foreground">{label}</p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none sm:w-72"
      />
    </div>
  );
}
