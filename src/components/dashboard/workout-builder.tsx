"use client";

import { useState } from "react";
import {
  ChevronDown,
  Copy,
  Dumbbell,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type {
  Exercise,
  MuscleGroup,
  ProgramExercise,
  TrainingDay,
  WorkoutProgram,
} from "@/lib/types";
import {
  DIFFICULTIES,
  EQUIPMENT,
  GOALS,
  WEEKDAYS,
  exerciseToProgram,
  newProgram,
  newTrainingDay,
} from "@/lib/workout";
import { cn, uid } from "@/lib/utils";
import { reorder, useDragReorder } from "@/lib/use-drag-reorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExercisePicker } from "@/components/dashboard/exercise-picker";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

const weekOptions = [4, 8, 12];
const dayOptions = [3, 4, 5, 6];

export function WorkoutBuilder({
  initial,
  onSaved,
}: {
  initial?: WorkoutProgram | null;
  onSaved?: () => void;
}) {
  const { clients, saveProgram } = useApp();
  const { toast } = useToast();
  const [program, setProgram] = useState<WorkoutProgram>(initial ?? newProgram(8));
  const [activeWeek, setActiveWeek] = useState(0);
  const [picker, setPicker] = useState<{ dayId: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const setWeeks = (count: number) => {
    setProgram((p) => {
      const schedule = Array.from({ length: count }).map(
        (_, i) => p.schedule[i] ?? { week: i + 1, days: [] }
      );
      return { ...p, weeks: count, schedule };
    });
    setActiveWeek((a) => Math.min(a, count - 1));
  };

  const week = program.schedule[activeWeek];

  const updateWeekDays = (days: TrainingDay[]) =>
    setProgram((p) => ({
      ...p,
      schedule: p.schedule.map((w, i) => (i === activeWeek ? { ...w, days } : w)),
    }));

  const toggleDay = (weekday: string) => {
    const exists = week.days.find((d) => d.day === weekday);
    if (exists) {
      updateWeekDays(week.days.filter((d) => d.day !== weekday));
    } else {
      const day = newTrainingDay(weekday);
      const days = [...week.days, day].sort(
        (a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day)
      );
      updateWeekDays(days);
      setExpanded(day.id);
    }
  };

  const updateDay = (dayId: string, patch: Partial<TrainingDay>) =>
    updateWeekDays(week.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)));

  const addExercise = (dayId: string, ex: Exercise) => {
    const day = week.days.find((d) => d.id === dayId);
    if (!day) return;
    const pe = exerciseToProgram(ex);
    const muscles = Array.from(new Set([...day.muscles, ex.muscle])) as MuscleGroup[];
    updateDay(dayId, { exercises: [...day.exercises, pe], muscles });
    toast(`${ex.name} added`, { variant: "success" });
  };

  const updateExercise = (dayId: string, exId: string, patch: Partial<ProgramExercise>) => {
    const day = week.days.find((d) => d.id === dayId);
    if (!day) return;
    updateDay(dayId, {
      exercises: day.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)),
    });
  };

  const removeExercise = (dayId: string, exId: string) => {
    const day = week.days.find((d) => d.id === dayId);
    if (!day) return;
    const remaining = day.exercises.filter((e) => e.id !== exId);
    updateDay(dayId, {
      exercises: remaining,
      muscles: Array.from(new Set(remaining.map((e) => e.muscle))) as MuscleGroup[],
    });
  };

  const reorderExercises = (dayId: string, from: number, to: number) => {
    const day = week.days.find((d) => d.id === dayId);
    if (!day) return;
    updateDay(dayId, { exercises: reorder(day.exercises, from, to) });
  };

  const copyDayToAllWeeks = (day: TrainingDay) => {
    setProgram((p) => ({
      ...p,
      schedule: p.schedule.map((w, i) => {
        if (i === activeWeek) return w;
        const clone: TrainingDay = {
          ...day,
          id: uid("td"),
          exercises: day.exercises.map((e) => ({ ...e, id: uid("pe") })),
        };
        const days = [...w.days.filter((d) => d.day !== day.day), clone].sort(
          (a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day)
        );
        return { ...w, days };
      }),
    }));
    toast(`Copied ${day.day} to all weeks`, { variant: "success" });
  };

  const save = () => {
    if (!program.name.trim()) return toast("Give your program a name", { variant: "error" });
    saveProgram({ ...program, updatedAt: new Date().toISOString() });
    toast("Program saved", { variant: "success" });
    onSaved?.();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Settings */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader><CardTitle>Program Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Program name</Label>
              <Input value={program.name} onChange={(e) => setProgram({ ...program, name: e.target.value })} placeholder="e.g. PPL Hypertrophy" />
            </div>
            <div>
              <Label>Client</Label>
              <Select value={program.client ?? ""} onChange={(e) => setProgram({ ...program, client: e.target.value || undefined })}>
                <option value="">Unassigned</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Goal</Label>
              <Select value={program.goal} onChange={(e) => setProgram({ ...program, goal: e.target.value })}>
                {GOALS.map((g) => <option key={g}>{g}</option>)}
              </Select>
            </div>
            <div>
              <Label>Duration (weeks)</Label>
              <div className="flex gap-1.5">
                {weekOptions.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeeks(w)}
                    className={cn(
                      "flex-1 rounded-lg border py-1.5 text-sm font-semibold transition-colors",
                      program.weeks === w ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Days per week (target)</Label>
              <div className="flex gap-1.5">
                {dayOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => setProgram({ ...program, daysPerWeek: d })}
                    className={cn(
                      "flex-1 rounded-lg border py-1.5 text-sm font-semibold transition-colors",
                      program.daysPerWeek === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={program.difficulty} onChange={(e) => setProgram({ ...program, difficulty: e.target.value })}>
                {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <Label>Equipment</Label>
              <Select value={program.equipment} onChange={(e) => setProgram({ ...program, equipment: e.target.value })}>
                {EQUIPMENT.map((e) => <option key={e}>{e}</option>)}
              </Select>
            </div>
            <Button className="w-full" onClick={save}>
              <Save className="h-4 w-4" /> Save Program
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        {/* Week selector */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {program.schedule.map((w, i) => (
            <button
              key={w.week}
              onClick={() => setActiveWeek(i)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                i === activeWeek ? "bg-brand-gradient text-white" : "border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Week {w.week}
            </button>
          ))}
        </div>

        {/* Weekday toggles */}
        <Card className="p-4">
          <Label>Training days for Week {week.week}</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((wd) => {
              const active = week.days.some((d) => d.day === wd);
              return (
                <button
                  key={wd}
                  onClick={() => toggleDay(wd)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
                    active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {wd.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Day cards */}
        {week.days.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Select training days above to start building Week {week.week}.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {week.days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                isOpen={expanded === day.id}
                onToggle={() => setExpanded(expanded === day.id ? null : day.id)}
                showCopy={program.weeks > 1}
                onLabel={(label) => updateDay(day.id, { label })}
                onUpdateExercise={(exId, patch) => updateExercise(day.id, exId, patch)}
                onRemoveExercise={(exId) => removeExercise(day.id, exId)}
                onReorderExercise={(from, to) => reorderExercises(day.id, from, to)}
                onAddExercise={() => setPicker({ dayId: day.id })}
                onCopyToWeeks={() => copyDayToAllWeeks(day)}
              />
            ))}
          </div>
        )}
      </div>

      <ExercisePicker
        open={!!picker}
        onClose={() => setPicker(null)}
        onPick={(ex) => picker && addExercise(picker.dayId, ex)}
      />
    </div>
  );
}

function DayCard({
  day,
  isOpen,
  onToggle,
  showCopy,
  onLabel,
  onUpdateExercise,
  onRemoveExercise,
  onReorderExercise,
  onAddExercise,
  onCopyToWeeks,
}: {
  day: TrainingDay;
  isOpen: boolean;
  onToggle: () => void;
  showCopy: boolean;
  onLabel: (label: string) => void;
  onUpdateExercise: (exId: string, patch: Partial<ProgramExercise>) => void;
  onRemoveExercise: (exId: string) => void;
  onReorderExercise: (from: number, to: number) => void;
  onAddExercise: () => void;
  onCopyToWeeks: () => void;
}) {
  const dnd = useDragReorder(onReorderExercise);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Dumbbell className="h-4 w-4" />
          </span>
          <div>
            <p className="font-bold text-foreground">{day.label}</p>
            <p className="text-xs text-muted-foreground">
              {day.day} · {day.exercises.length} exercises
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden flex-wrap gap-1 sm:flex">
            {day.muscles.map((m) => (
              <Badge key={m} variant="secondary">{m}</Badge>
            ))}
          </div>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && (
        <CardContent className="border-t border-border pt-4">
          <div className="mb-3">
            <Label>Day label</Label>
            <Input value={day.label} onChange={(e) => onLabel(e.target.value)} placeholder="e.g. Push Day" />
          </div>

          {day.exercises.length > 0 && (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="w-6 pb-2" />
                    <th className="pb-2 font-semibold">Exercise</th>
                    <th className="pb-2 font-semibold">Sets</th>
                    <th className="pb-2 font-semibold">Reps</th>
                    <th className="pb-2 font-semibold">Rest</th>
                    <th className="pb-2 font-semibold">Notes</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex, i) => (
                    <tr
                      key={ex.id}
                      {...dnd.containerProps(i)}
                      className={cn(
                        "border-t border-border/60 transition-colors",
                        dnd.dragIndex === i && "opacity-40",
                        dnd.overIndex === i && dnd.dragIndex !== null && "bg-primary/10"
                      )}
                    >
                      <td className="py-2 pr-1 align-middle">
                        <button
                          type="button"
                          aria-label="Drag to reorder exercise"
                          {...dnd.handleProps(i)}
                          className="cursor-grab text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="py-2 pr-2">
                        <p className="font-semibold text-foreground">{ex.name}</p>
                        <span className="text-xs text-muted-foreground">{ex.muscle}</span>
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={ex.sets} onChange={(e) => onUpdateExercise(ex.id, { sets: Number(e.target.value) || 0 })} className="w-14 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:border-primary/60" />
                      </td>
                      <td className="py-2 pr-2">
                        <input value={ex.reps} onChange={(e) => onUpdateExercise(ex.id, { reps: e.target.value })} className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:border-primary/60" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={ex.rest} onChange={(e) => onUpdateExercise(ex.id, { rest: Number(e.target.value) || 0 })} className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:border-primary/60" />
                      </td>
                      <td className="py-2 pr-2">
                        <input value={ex.notes} onChange={(e) => onUpdateExercise(ex.id, { notes: e.target.value })} placeholder="—" className="w-full min-w-[80px] rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:border-primary/60" />
                      </td>
                      <td className="py-2">
                        <button onClick={() => onRemoveExercise(ex.id)} aria-label="Remove" className="text-muted-foreground hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onAddExercise}>
              <Plus className="h-4 w-4" /> Add Exercise
            </Button>
            {showCopy && (
              <Button size="sm" variant="ghost" onClick={onCopyToWeeks}>
                <Copy className="h-4 w-4" /> Copy to all weeks
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
