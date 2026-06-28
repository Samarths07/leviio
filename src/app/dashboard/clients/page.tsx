"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Plus, Search, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { isGuestClient } from "@/lib/portal";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { AddClientDialog } from "@/components/dashboard/add-client-dialog";

const filters = [
  { value: "All", label: "All" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "VIP", label: "VIP" },
];

function ClientsInner() {
  const params = useSearchParams();
  const { clients, approveClient } = useApp();
  const { toast } = useToast();
  const [open, setOpen] = useState(params.get("new") === "1");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        if (filter !== "All" && c.status !== filter) return false;
        if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [clients, filter, query]
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">Clients</h2>
          <p className="text-sm text-muted-foreground">
            {clients.length} clients · {clients.filter((c) => c.status === "Active").length} active
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={filters} value={filter} onChange={setFilter} />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking their progress and plans."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => {
            const progress = (c.weeksCompleted / c.weeksTotal) * 100;
            const lost = +(c.startWeight - c.currentWeight).toFixed(1);
            const managed = !isGuestClient(c);
            const pending = managed && c.portalStatus === "pending";
            const notSignedUp = managed && (c.portalStatus ?? "none") === "none";
            const approve = () => {
              approveClient(c.id);
              toast(`${c.name} can now access the portal`, { variant: "success" });
            };
            return (
              <Card key={c.id} hover className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} seed={c.avatarSeed} size={52} ring />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-foreground">{c.name}</p>
                      {pending && <Badge variant="warning">Approval requested</Badge>}
                      {notSignedUp && <Badge variant="outline">Awaiting sign-up</Badge>}
                      {c.status === "VIP" && <Badge variant="warning">VIP</Badge>}
                      {c.status === "Inactive" && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.handle}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="primary">{c.goal}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Joined {formatDate(c.startDate, "short")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Week {c.weeksCompleted} of {c.weeksTotal}
                    </span>
                    <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-4 text-xs">
                    <div>
                      <p className="font-bold text-foreground">{c.activePlans}</p>
                      <p className="text-muted-foreground">Active plans</p>
                    </div>
                    <div>
                      <p className={lost >= 0 ? "font-bold text-success" : "font-bold text-warning"}>
                        {lost >= 0 ? "−" : "+"}
                        {Math.abs(lost)}kg
                      </p>
                      <p className="text-muted-foreground">Since start</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {pending && (
                      <Button size="sm" onClick={approve}>
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddClientDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense>
      <ClientsInner />
    </Suspense>
  );
}
