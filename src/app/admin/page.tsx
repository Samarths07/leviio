"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  DollarSign,
  Loader2,
  Package,
  ShieldAlert,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Overview {
  creators: number;
  proCreators: number;
  freeCreators: number;
  clients: number;
  products: number;
  publishedProducts: number;
  orders: number;
  gmv: number;
  platformFees: number;
}
interface CreatorRow {
  id: string;
  name: string;
  email: string;
  username: string;
  plan: string;
  payoutsConnected: boolean;
  clients: number;
  products: number;
  revenue: number;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [toDelete, setToDelete] = useState<CreatorRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const ov = await fetch("/api/admin/overview");
    if (ov.status === 403 || ov.status === 401) {
      setState("denied");
      return;
    }
    const [o, c] = await Promise.all([ov.json(), fetch("/api/admin/creators").then((r) => r.json())]);
    setOverview(o);
    setCreators(c.creators ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setPlan = async (id: string, plan: string) => {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, plan } : c)));
    const res = await fetch("/api/admin/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setPlan", id, plan }),
    });
    if (!res.ok) toast("Couldn't update plan", { variant: "error" });
    else toast(`Plan set to ${plan}`, { variant: "success" });
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    const res = await fetch("/api/admin/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: toDelete.id }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(d?.error ?? "Couldn't delete creator", { variant: "error" });
      return;
    }
    setCreators((prev) => prev.filter((c) => c.id !== toDelete.id));
    toast(`${toDelete.name} deleted`, { variant: "info" });
    setToDelete(null);
    load();
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
          This area is for platform admins only. Sign in with an admin account
          (listed in ADMIN_EMAILS).
        </p>
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Creators", value: String(overview?.creators ?? 0), icon: Users, hint: `${overview?.proCreators ?? 0} Pro · ${overview?.freeCreators ?? 0} Free` },
    { label: "Clients", value: String(overview?.clients ?? 0), icon: Users },
    { label: "Products", value: String(overview?.products ?? 0), icon: Package, hint: `${overview?.publishedProducts ?? 0} published` },
    { label: "GMV (completed)", value: formatCurrency(overview?.gmv ?? 0), icon: DollarSign, hint: `${overview?.orders ?? 0} orders` },
    { label: "Platform fees", value: formatCurrency(overview?.platformFees ?? 0), icon: Wallet, hint: "your earnings from sales" },
  ];

  const filtered = creators.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase()) ||
      c.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" />
          <Badge variant="danger">God mode</Badge>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          Exit admin
        </Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Platform Admin</h1>
          <p className="text-sm text-muted-foreground">Manage every creator, plan and payout across Leviio.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <p className="mt-3 truncate text-xl font-extrabold tracking-tight text-foreground">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              {s.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>}
            </Card>
          ))}
        </div>

        {/* Creators */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bold text-foreground">Creators ({creators.length})</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name / email / handle…"
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none sm:w-72"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">Creator</th>
                  <th className="px-4 py-2.5 font-semibold">Clients</th>
                  <th className="px-4 py-2.5 font-semibold">Products</th>
                  <th className="px-4 py-2.5 font-semibold">Revenue</th>
                  <th className="px-4 py-2.5 font-semibold">Payouts</th>
                  <th className="px-4 py-2.5 font-semibold">Plan</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No creators.</td></tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email} · @{c.username}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.clients}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.products}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(c.revenue)}</td>
                    <td className="px-4 py-3">
                      {c.payoutsConnected ? (
                        <Badge variant="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Connected</Badge>
                      ) : (
                        <Badge variant="outline">Not set</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Select value={c.plan} onChange={(e) => setPlan(c.id, e.target.value)} className="h-8 w-24">
                        <option value="Free">Free</option>
                        <option value="Pro">Pro</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <a href={`/${c.username}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">
                          Store
                        </a>
                        <button onClick={() => setToDelete(c)} aria-label="Delete creator" className="ml-2 text-muted-foreground hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Dialog open={!!toDelete} onClose={() => !busy && setToDelete(null)} title="Delete creator?" size="sm">
        <p className="text-sm text-muted-foreground">
          This permanently deletes <span className="font-semibold text-foreground">{toDelete?.name}</span>,
          their account, store, clients, products and all data. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setToDelete(null)} disabled={busy}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={doDelete} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
