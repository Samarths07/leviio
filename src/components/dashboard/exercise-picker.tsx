"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { exercises, muscleGroups } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string>("All");

  const filtered = useMemo(
    () =>
      exercises.filter((e) => {
        if (muscle !== "All" && e.muscle !== muscle) return false;
        if (query && !e.name.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [query, muscle]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Exercise"
      description={`${exercises.length} exercises in your library`}
      size="lg"
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
        {["All", ...muscleGroups].map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              muscle === m
                ? "bg-brand-gradient text-white"
                : "border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="thin-scrollbar grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onPick(ex)}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 text-left transition-colors hover:border-primary/40"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{ex.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="primary">{ex.muscle}</Badge>
                <Badge variant="outline">{ex.equipment}</Badge>
              </div>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition-transform group-hover:scale-110">
              <Plus className="h-4 w-4" />
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No exercises match your search.
          </p>
        )}
      </div>
    </Dialog>
  );
}
