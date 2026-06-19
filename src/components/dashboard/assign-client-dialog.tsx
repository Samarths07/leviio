"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Pick a client to assign a plan/program to. */
export function AssignClientDialog({
  open,
  onClose,
  title,
  itemName,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  itemName?: string;
  onAssign: (clientId: string, clientName: string) => void;
}) {
  const { clients } = useApp();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const confirm = () => {
    const client = clients.find((c) => c.id === selected);
    if (client) onAssign(client.id, client.name);
    setSelected(null);
    setQuery("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={itemName ? `Assigning “${itemName}”` : undefined}
      size="sm"
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients..."
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div className="thin-scrollbar max-h-[46vh] space-y-1.5 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
              selected === c.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40"
            )}
          >
            <Avatar name={c.name} seed={c.avatarSeed} size={36} ring />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.goal}</p>
            </div>
            {selected === c.id ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-3 w-3" />
              </span>
            ) : (
              c.status === "VIP" && <Badge variant="warning">VIP</Badge>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No clients found.</p>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" disabled={!selected} onClick={confirm}>
          Assign
        </Button>
      </div>
    </Dialog>
  );
}
