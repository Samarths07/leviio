"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Edit2,
  ExternalLink,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/lib/types";
import { formatCurrency, img } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductFormDialog } from "@/components/dashboard/product-form-dialog";

const filterTabs = [
  { value: "All", label: "All" },
  { value: "Digital", label: "Digital" },
  { value: "Service", label: "Services" },
];

const typeVariant: Record<string, "primary" | "warning" | "success"> = {
  Digital: "primary",
  Physical: "warning",
  Service: "success",
  Membership: "success",
};

function ProductsInner() {
  const params = useSearchParams();
  const { products, updateProduct, deleteProduct } = useApp();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter !== "All" && p.type !== filter && !(filter === "Service" && p.type === "Membership"))
        return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [products, filter, query]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Products
          </h2>
          <p className="text-sm text-muted-foreground">
            {products.length} products · {products.filter((p) => p.status === "Published").length} published
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={filterTabs} value={filter} onChange={setFilter} />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={query || filter !== "All" ? "Try adjusting your search or filters." : "Add your first product to start selling."}
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Sales</th>
                  <th className="px-4 py-3 font-semibold">Revenue</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                          <Image src={p.imageUrl || img(p.imageSeed, 88, 88)} alt={p.name} fill sizes="44px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={typeVariant[p.type]}>{p.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatCurrency(p.price)}
                      {p.recurring && <span className="text-xs text-muted-foreground">/mo</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.sales}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.status === "Published"}
                          onCheckedChange={(v) => {
                            updateProduct(p.id, { status: v ? "Published" : "Draft" });
                            toast(`${p.name} ${v ? "published" : "set to draft"}`, { variant: "success" });
                          }}
                          aria-label="Toggle status"
                        />
                        <span className="text-xs text-muted-foreground">{p.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          aria-label="Edit"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); toast("Opening product preview (demo).", { variant: "info" }); }}
                          aria-label="View"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => setDeleting(p)}
                          aria-label="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        >
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
      )}

      <ProductFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete product?" size="sm">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{deleting?.name}</span>? This
          can&apos;t be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              if (deleting) {
                deleteProduct(deleting.id);
                toast("Product deleted", { variant: "info" });
              }
              setDeleting(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsInner />
    </Suspense>
  );
}
