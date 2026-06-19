"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Copy,
  Dumbbell,
  Edit2,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import type { WorkoutProgram } from "@/lib/types";
import { exercises, muscleGroups } from "@/lib/exercises";
import { newProgram } from "@/lib/workout";
import { formatDate, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkoutBuilder } from "@/components/dashboard/workout-builder";
import { AssignClientDialog } from "@/components/dashboard/assign-client-dialog";

const tabs = [
  { value: "programs", label: "My Programs" },
  { value: "build", label: "Build Program" },
  { value: "library", label: "Exercise Library" },
];

function WorkoutInner() {
  const params = useSearchParams();
  const { programs, saveProgram, deleteProgram, updateClient } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState(params.get("tab") === "build" ? "build" : "programs");
  const [builderInit, setBuilderInit] = useState<WorkoutProgram | null>(null);
  const [assigning, setAssigning] = useState<WorkoutProgram | null>(null);

  // library filters
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const equipmentOptions = useMemo(
    () => ["All", ...Array.from(new Set(exercises.map((e) => e.equipment)))],
    []
  );

  const filteredEx = useMemo(
    () =>
      exercises.filter((e) => {
        if (muscle !== "All" && e.muscle !== muscle) return false;
        if (equipment !== "All" && e.equipment !== equipment) return false;
        if (difficulty !== "All" && e.difficulty !== difficulty) return false;
        if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [query, muscle, equipment, difficulty]
  );

  const startNew = () => {
    setBuilderInit(newProgram(8));
    setTab("build");
  };
  const edit = (p: WorkoutProgram) => {
    setBuilderInit(p);
    setTab("build");
  };
  const duplicate = (p: WorkoutProgram) => {
    saveProgram({ ...p, id: uid("prog"), name: `${p.name} (copy)`, updatedAt: new Date().toISOString() });
    toast("Program duplicated", { variant: "success" });
  };
  const assignToClient = (clientId: string, clientName: string) => {
    if (!assigning) return;
    updateClient(clientId, { programId: assigning.id });
    saveProgram({ ...assigning, client: clientName });
    toast(`Assigned "${assigning.name}" to ${clientName}`, { variant: "success" });
    setAssigning(null);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">Workout Builder</h2>
          <p className="text-sm text-muted-foreground">
            Design progressive training programs from {exercises.length}+ exercises.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4" /> New Program
        </Button>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "programs" && (
        programs.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No programs yet"
            description="Build your first training program from scratch."
            action={<Button onClick={startNew}><Plus className="h-4 w-4" /> New Program</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programs.map((p) => (
              <Card key={p.id} hover className="p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Dumbbell className="h-5 w-5" />
                  </span>
                  <Badge variant="secondary">{p.goal}</Badge>
                </div>
                <h3 className="mt-3 font-bold text-foreground">{p.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {p.client ? `For ${p.client}` : "Unassigned"} · edited {formatDate(p.updatedAt, "short")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="primary">{p.weeks} weeks</Badge>
                  <Badge variant="outline">{p.daysPerWeek} days/wk</Badge>
                  <Badge variant="secondary">{p.difficulty}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => edit(p)}>
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicate(p)}>
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAssigning(p)}>
                    <UserPlus className="h-3.5 w-3.5" /> Assign
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { deleteProgram(p.id); toast("Program deleted", { variant: "info" }); }}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "build" && (
        <WorkoutBuilder
          key={builderInit?.id ?? "new"}
          initial={builderInit ?? newProgram(8)}
          onSaved={() => setTab("programs")}
        />
      )}

      {tab === "library" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
              />
            </div>
            <Select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
              <option value="All">All muscles</option>
              {muscleGroups.map((m) => <option key={m}>{m}</option>)}
            </Select>
            <Select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              {equipmentOptions.map((e) => <option key={e}>{e === "All" ? "All equipment" : e}</option>)}
            </Select>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="All">All levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">{filteredEx.length} exercises</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEx.map((ex) => (
              <Card key={ex.id} hover className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-foreground">{ex.name}</h3>
                  <Badge variant="outline">{ex.difficulty}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="primary">{ex.muscle}</Badge>
                  <Badge variant="secondary">{ex.equipment}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{ex.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => toast("Open Build Program and add it to a training day.", { variant: "info" })}
                >
                  <Plus className="h-4 w-4" /> Add to Program
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AssignClientDialog
        open={!!assigning}
        onClose={() => setAssigning(null)}
        title="Assign program"
        itemName={assigning?.name}
        onAssign={assignToClient}
      />
    </div>
  );
}

export default function WorkoutBuilderPage() {
  return (
    <Suspense>
      <WorkoutInner />
    </Suspense>
  );
}
