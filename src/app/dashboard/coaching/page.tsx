"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Edit2,
  MessageCircle,
  Plus,
  Target,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import type { CoachingPackage, SessionNote } from "@/lib/types";
import { formatCurrency, formatDate, uid } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";

export default function CoachingPage() {
  const { clients, events, user, updateUser } = useApp();
  const { toast } = useToast();
  const packages = user?.coachingPackages ?? [];
  const notes = user?.sessionNotes ?? [];
  const [editing, setEditing] = useState<CoachingPackage | null>(null);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const coachedClients = clients.filter((c) => c.package);

  const nextSessionFor = (clientId: string) =>
    events
      .filter((e) => e.clientId === clientId && e.date >= "2026-06-17")
      .sort((a, b) => (a.date < b.date ? -1 : 1))[0];

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">Coaching Hub</h2>
          <p className="text-sm text-muted-foreground">
            Manage packages, active clients, and session notes.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Packages */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Coaching Packages</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setPkgOpen(true); }}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{p.name}</p>
                      {p.popular && <Badge variant="solid">Popular</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.sessions} sessions</p>
                  </div>
                  <p className="text-lg font-extrabold text-foreground">{formatCurrency(p.price)}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => { setEditing(p); setPkgOpen(true); }}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active clients */}
        <Card>
          <CardHeader><CardTitle>Active Coaching Clients</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {coachedClients.length === 0 && (
              <p className="text-sm text-muted-foreground">No clients in a package yet.</p>
            )}
            {coachedClients.map((c) => {
              const next = nextSessionFor(c.id);
              const remaining = Math.max(0, c.weeksTotal - c.weeksCompleted);
              return (
                <div key={c.id} className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} seed={c.avatarSeed} size={40} ring />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.package}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {remaining} sessions left
                    </span>
                    <span className="text-muted-foreground">
                      {next ? `Next ${formatDate(next.date, "short")}` : "No upcoming"}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <Link href="/dashboard/messages" className={buttonVariants({ variant: "subtle", size: "sm" })}>
                      <MessageCircle className="h-3.5 w-3.5" /> Message
                    </Link>
                    <Link href={`/dashboard/clients/${c.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Session notes feed */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Session Notes</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
              <Plus className="h-4 w-4" /> Quick Note
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.map((n) => {
              const isOpen = expanded === n.id;
              return (
                <div key={n.id} className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={n.clientName} seed={n.clientAvatar} size={28} ring />
                    <p className="text-sm font-bold text-foreground">{n.clientName}</p>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(n.date, "short")}
                    </span>
                  </div>
                  <p className={isOpen ? "mt-2 text-sm text-muted-foreground" : "mt-2 line-clamp-2 text-sm text-muted-foreground"}>
                    {n.note}
                  </p>
                  <button
                    onClick={() => setExpanded(isOpen ? null : n.id)}
                    className="mt-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {isOpen ? "Collapse" : "Expand"}
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Package modal */}
      <PackageDialog
        open={pkgOpen}
        onClose={() => setPkgOpen(false)}
        editing={editing}
        onSave={(pkg) => {
          const next = packages.some((p) => p.id === pkg.id)
            ? packages.map((p) => (p.id === pkg.id ? pkg : p))
            : [...packages, pkg];
          updateUser({ coachingPackages: next });
          toast(editing ? "Package updated" : "Package created", { variant: "success" });
          setPkgOpen(false);
        }}
      />

      {/* Quick note modal */}
      <QuickNoteDialog
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        onSave={(clientName, clientAvatar, text) => {
          const next: SessionNote[] = [
            { id: uid("note"), clientId: "", clientName, clientAvatar, date: new Date().toISOString(), note: text },
            ...notes,
          ];
          updateUser({ sessionNotes: next });
          toast("Note added", { variant: "success" });
          setNoteOpen(false);
        }}
      />
    </div>
  );
}

function PackageDialog({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: CoachingPackage | null;
  onSave: (p: CoachingPackage) => void;
}) {
  const [form, setForm] = useState({ name: "", sessions: "4", price: "199", description: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editing?.id ?? uid("pkg"),
      name: form.name || editing?.name || "New Package",
      sessions: Number(form.sessions) || 4,
      price: Number(form.price) || 0,
      description: form.description || editing?.description || "",
      popular: editing?.popular,
      includesMealPlan: editing?.includesMealPlan,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit Package" : "Create Package"}
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input defaultValue={editing?.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Premium Coaching" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Sessions</Label>
            <Input type="number" defaultValue={editing?.sessions ?? 4} onChange={(e) => setForm({ ...form, sessions: e.target.value })} />
          </div>
          <div>
            <Label>Price (USD)</Label>
            <Input type="number" defaultValue={editing?.price ?? 199} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea defaultValue={editing?.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1">Save</Button>
        </div>
      </form>
    </Dialog>
  );
}

function QuickNoteDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (clientName: string, avatar: string, text: string) => void;
}) {
  const { clients } = useApp();
  const [clientName, setClientName] = useState(clients[0]?.name ?? "");
  const [text, setText] = useState("");

  return (
    <Dialog open={open} onClose={onClose} title="Quick Note" size="sm">
      <div className="space-y-4">
        <div>
          <Label>Client</Label>
          <select
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/60"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Note</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="What happened in this session?" />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (!text.trim()) return;
              const avatar = clients.find((c) => c.name === clientName)?.avatarSeed ?? clientName;
              onSave(clientName, avatar, text.trim());
              setText("");
            }}
          >
            Save Note
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
