"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { DietDay, FoodItem, MealPlan } from "@/lib/types";
import {
  DIET_TYPES,
  dayTotals,
  emptyDay,
  macroGrams,
  mealTotals,
  newPlan,
} from "@/lib/diet";
import { cn, uid } from "@/lib/utils";
import { reorder, useDragReorder } from "@/lib/use-drag-reorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CaloriesBarChart } from "@/components/dashboard/charts";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

const durations = [1, 3, 5, 7];

export function DietBuilder({
  initial,
  onSaved,
}: {
  initial?: MealPlan | null;
  onSaved?: () => void;
}) {
  const { clients, saveMealPlan } = useApp();
  const { toast } = useToast();
  const [plan, setPlan] = useState<MealPlan>(initial ?? newPlan(7));
  const [activeDay, setActiveDay] = useState(0);

  const macroTotal = plan.protein + plan.carbs + plan.fat;
  const macroValid = macroTotal === 100;
  const grams = macroGrams(plan.calorieTarget, plan.protein, plan.carbs, plan.fat);

  const setDays = (count: number) => {
    setPlan((p) => {
      const days = Array.from({ length: count }).map(
        (_, i) => p.days[i] ?? emptyDay(`Day ${i + 1}`)
      );
      return { ...p, days };
    });
    setActiveDay((a) => Math.min(a, count - 1));
  };

  const updateDay = (index: number, day: DietDay) =>
    setPlan((p) => ({
      ...p,
      days: p.days.map((d, i) => (i === index ? day : d)),
    }));

  const toggleDietType = (t: string) =>
    setPlan((p) => ({
      ...p,
      dietType: p.dietType.includes(t)
        ? p.dietType.filter((x) => x !== t)
        : [...p.dietType, t],
    }));

  const copyDayToAll = () => {
    const source = plan.days[activeDay];
    setPlan((p) => ({
      ...p,
      days: p.days.map((d, i) =>
        i === activeDay
          ? d
          : {
              ...d,
              meals: source.meals.map((m) => ({
                ...m,
                id: uid("meal"),
                items: m.items.map((it) => ({ ...it, id: uid("food") })),
              })),
            }
      ),
    }));
    toast(`Copied ${source.label} to all days`, { variant: "success" });
  };

  const weeklyData = useMemo(
    () => plan.days.map((d) => ({ day: d.label.replace("Day ", "D"), calories: dayTotals(d).calories })),
    [plan.days]
  );
  const avg = useMemo(() => {
    const totals = plan.days.map(dayTotals);
    const n = totals.length || 1;
    return {
      calories: Math.round(totals.reduce((s, t) => s + t.calories, 0) / n),
      protein: Math.round(totals.reduce((s, t) => s + t.protein, 0) / n),
      carbs: Math.round(totals.reduce((s, t) => s + t.carbs, 0) / n),
      fat: Math.round(totals.reduce((s, t) => s + t.fat, 0) / n),
    };
  }, [plan.days]);

  const save = () => {
    if (!plan.name.trim()) return toast("Give your plan a name", { variant: "error" });
    if (!macroValid) return toast("Macro split must total 100%", { variant: "error" });
    saveMealPlan({ ...plan, updatedAt: new Date().toISOString() });
    toast("Meal plan saved", { variant: "success" });
    onSaved?.();
  };

  const day = plan.days[activeDay];

  const mealsDnd = useDragReorder((from, to) =>
    updateDay(activeDay, { ...day, meals: reorder(day.meals, from, to) })
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Settings sidebar */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader><CardTitle>Plan Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Plan name</Label>
              <Input value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} placeholder="e.g. Summer Cut" />
            </div>
            <div>
              <Label>Client</Label>
              <Select value={plan.client ?? ""} onChange={(e) => setPlan({ ...plan, client: e.target.value || undefined })}>
                <option value="">Unassigned</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Duration (days)</Label>
              <div className="flex gap-1.5">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={cn(
                      "flex-1 rounded-lg border py-1.5 text-sm font-semibold transition-colors",
                      plan.days.length === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Calorie target</Label>
              <Input
                type="number"
                value={plan.calorieTarget}
                onChange={(e) => setPlan({ ...plan, calorieTarget: Number(e.target.value) || 0 })}
              />
            </div>

            {/* Macro split */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Macro split</Label>
                <span className={cn("text-xs font-bold", macroValid ? "text-success" : "text-danger")}>
                  {macroTotal}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["protein", "carbs", "fat"] as const).map((m) => (
                  <div key={m}>
                    <Input
                      type="number"
                      value={plan[m]}
                      onChange={(e) => setPlan({ ...plan, [m]: Number(e.target.value) || 0 })}
                      className="text-center"
                    />
                    <p className="mt-1 text-center text-[10px] uppercase text-muted-foreground">{m.slice(0, 4)}</p>
                  </div>
                ))}
              </div>
              {!macroValid && <p className="mt-1 text-xs text-danger">Must total 100%</p>}
              <div className="mt-2 rounded-lg bg-background/40 p-2.5 text-center text-xs">
                <span className="font-bold text-foreground">{grams.protein}g</span>
                <span className="text-muted-foreground"> P · </span>
                <span className="font-bold text-foreground">{grams.carbs}g</span>
                <span className="text-muted-foreground"> C · </span>
                <span className="font-bold text-foreground">{grams.fat}g</span>
                <span className="text-muted-foreground"> F</span>
              </div>
            </div>

            <div>
              <Label>Diet type</Label>
              <div className="flex flex-wrap gap-1.5">
                {DIET_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleDietType(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                      plan.dietType.includes(t)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={save}>
              <Save className="h-4 w-4" /> Save Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Day editor */}
      <div className="space-y-4">
        {/* Day tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {plan.days.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setActiveDay(i)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  i === activeDay
                    ? "bg-brand-gradient text-white"
                    : "border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          {plan.days.length > 1 && (
            <Button size="sm" variant="outline" onClick={copyDayToAll} className="shrink-0">
              <Copy className="h-4 w-4" /> Copy to all
            </Button>
          )}
        </div>

        {/* Day summary */}
        <DaySummary day={day} target={plan.calorieTarget} />

        {/* Meals — drag the handle to reorder */}
        <div className="space-y-3">
          {day.meals.map((meal, mi) => (
            <MealCard
              key={meal.id}
              meal={meal}
              containerProps={mealsDnd.containerProps(mi)}
              handleProps={mealsDnd.handleProps(mi)}
              isDragging={mealsDnd.dragIndex === mi}
              isOver={mealsDnd.overIndex === mi && mealsDnd.dragIndex !== null}
              onChange={(updated) =>
                updateDay(activeDay, {
                  ...day,
                  meals: day.meals.map((m, i) => (i === mi ? updated : m)),
                })
              }
            />
          ))}
        </div>

        {/* Weekly summary */}
        <Card>
          <CardHeader><CardTitle>Weekly Macro Summary</CardTitle></CardHeader>
          <CardContent>
            <CaloriesBarChart data={weeklyData} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryStat label="Avg calories" value={`${avg.calories}`} />
              <SummaryStat label="Avg protein" value={`${avg.protein}g`} />
              <SummaryStat label="Avg carbs" value={`${avg.carbs}g`} />
              <SummaryStat label="Avg fat" value={`${avg.fat}g`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DaySummary({ day, target }: { day: DietDay; target: number }) {
  const t = dayTotals(day);
  const over = t.calories > target;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{day.label} total</p>
          <p className={cn("text-2xl font-extrabold", over ? "text-warning" : "text-foreground")}>
            {t.calories} <span className="text-sm font-medium text-muted-foreground">/ {target} kcal</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="primary">{t.protein}g P</Badge>
          <Badge variant="warning">{t.carbs}g C</Badge>
          <Badge variant="success">{t.fat}g F</Badge>
        </div>
      </div>
    </Card>
  );
}

function MealCard({
  meal,
  onChange,
  containerProps,
  handleProps,
  isDragging,
  isOver,
}: {
  meal: { id: string; slot: string; name: string; items: FoodItem[] };
  onChange: (m: any) => void;
  containerProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
  handleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  isOver?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [food, setFood] = useState({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" });
  const t = mealTotals(meal);

  const addFood = () => {
    if (!food.name.trim()) return;
    const item: FoodItem = {
      id: uid("food"),
      name: food.name.trim(),
      portion: food.portion || "1 serving",
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
      carbs: Number(food.carbs) || 0,
      fat: Number(food.fat) || 0,
    };
    onChange({ ...meal, items: [...meal.items, item] });
    setFood({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" });
    setAdding(false);
  };

  return (
    <Card
      {...containerProps}
      className={cn(
        "overflow-hidden transition-all",
        isDragging && "opacity-50",
        isOver && "ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-background/30 px-4 py-2.5">
        <button
          type="button"
          aria-label="Drag to reorder meal"
          {...handleProps}
          className="cursor-grab text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {meal.slot}
        </span>
        <input
          value={meal.name}
          onChange={(e) => onChange({ ...meal, name: e.target.value })}
          className="ml-2 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Meal name"
        />
        <span className="text-xs font-bold text-foreground">{t.calories} kcal</span>
      </div>

      <CardContent className="p-3">
        {meal.items.length > 0 && (
          <ul className="mb-2 space-y-1">
            {meal.items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.portion}</p>
                </div>
                <div className="hidden gap-2 text-xs text-muted-foreground sm:flex">
                  <span>{it.calories}kcal</span>
                  <span className="text-primary">{it.protein}P</span>
                  <span className="text-warning">{it.carbs}C</span>
                  <span className="text-success">{it.fat}F</span>
                </div>
                <button
                  onClick={() => onChange({ ...meal, items: meal.items.filter((x) => x.id !== it.id) })}
                  aria-label="Remove food"
                  className="text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {adding ? (
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <input className="col-span-2 sm:col-span-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60" placeholder="Food" value={food.name} onChange={(e) => setFood({ ...food, name: e.target.value })} />
              <input className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60" placeholder="Portion" value={food.portion} onChange={(e) => setFood({ ...food, portion: e.target.value })} />
              <input className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60" placeholder="kcal" type="number" value={food.calories} onChange={(e) => setFood({ ...food, calories: e.target.value })} />
              <input className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60" placeholder="P (g)" type="number" value={food.protein} onChange={(e) => setFood({ ...food, protein: e.target.value })} />
              <input className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60" placeholder="C (g)" type="number" value={food.carbs} onChange={(e) => setFood({ ...food, carbs: e.target.value })} />
              <input className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60" placeholder="F (g)" type="number" value={food.fat} onChange={(e) => setFood({ ...food, fat: e.target.value })} />
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={addFood} className="flex-1">
                <Check className="h-4 w-4" /> Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add Food Item
          </button>
        )}
      </CardContent>
    </Card>
  );
}
