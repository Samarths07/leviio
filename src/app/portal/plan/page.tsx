"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, Flame, MessageCircle, Timer, Utensils } from "lucide-react";
import { useApp } from "@/lib/store";
import { clientMealPlan, clientProgram } from "@/lib/portal";
import type { MealPlan, WorkoutProgram } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { ExerciseImage } from "@/components/dashboard/exercise-image";
import { cn, formatDate } from "@/lib/utils";

export default function PortalPlan() {
  const { clientUser, mealPlans, programs } = useApp();
  const [tab, setTab] = useState("diet");

  const plan = useMemo(
    () => (clientUser ? clientMealPlan(mealPlans, clientUser) : undefined),
    [mealPlans, clientUser]
  );
  const program = useMemo(
    () => (clientUser ? clientProgram(programs, clientUser) : undefined),
    [programs, clientUser]
  );

  if (!clientUser) return null;

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">My Plan</h2>
        <p className="text-sm text-muted-foreground">
          Your personalized nutrition and training, set by your coach.
        </p>
      </div>

      <Tabs
        tabs={[
          { value: "diet", label: "Diet", icon: Utensils },
          { value: "workout", label: "Workout", icon: Dumbbell },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "diet" ? (
        plan ? (
          <DietView plan={plan} />
        ) : (
          <EmptyPlan
            icon={Utensils}
            title="No diet plan assigned yet"
            body="Your coach hasn't shared a meal plan with you. Message them to get started."
          />
        )
      ) : program ? (
        <WorkoutView program={program} />
      ) : (
        <EmptyPlan
          icon={Dumbbell}
          title="No workout program assigned yet"
          body="Your coach hasn't shared a training program yet. Reach out to request one."
        />
      )}
    </div>
  );
}

function DietView({ plan }: { plan: MealPlan }) {
  const [dayIdx, setDayIdx] = useState(0);
  const day = plan.days[dayIdx];

  const dayCalories = day?.meals.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.calories, 0),
    0
  );

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-foreground">{plan.name}</p>
            <p className="text-xs text-muted-foreground">
              Updated {formatDate(plan.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {plan.dietType.map((d) => (
              <Badge key={d} variant="secondary">
                {d}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Macro label="Calories" value={`${plan.calorieTarget}`} accent />
          <Macro label="Protein" value={`${plan.protein}%`} />
          <Macro label="Carbs" value={`${plan.carbs}%`} />
          <Macro label="Fat" value={`${plan.fat}%`} />
        </div>
      </Card>

      {/* Day selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {plan.days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setDayIdx(i)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              i === dayIdx
                ? "bg-brand-gradient text-white"
                : "border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {day && (
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <p className="font-bold text-foreground">{day.label}</p>
            <span className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Flame className="h-4 w-4" /> {dayCalories} kcal
            </span>
          </div>
          {day.meals.map((meal) => {
            const mealCals = meal.items.reduce((s, i) => s + i.calories, 0);
            return (
              <div key={meal.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {meal.slot}
                    </p>
                    <p className="font-bold text-foreground">{meal.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {mealCals} kcal
                  </span>
                </div>
                <div className="space-y-1.5">
                  {meal.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.portion}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                        <span>{item.calories} kcal</span>
                        <span className="hidden sm:inline">
                          P{item.protein} · C{item.carbs} · F{item.fat}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function WorkoutView({ program }: { program: WorkoutProgram }) {
  const [weekIdx, setWeekIdx] = useState(0);
  const week = program.schedule[weekIdx];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-foreground">{program.name}</p>
            <p className="text-xs text-muted-foreground">
              Updated {formatDate(program.updatedAt)}
            </p>
          </div>
          <Badge variant="primary">{program.goal}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Macro label="Weeks" value={`${program.weeks}`} accent />
          <Macro label="Days / wk" value={`${program.daysPerWeek}`} />
          <Macro label="Level" value={program.difficulty} />
          <Macro label="Equipment" value={program.equipment} />
        </div>
      </Card>

      {/* Week selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {program.schedule.map((w, i) => (
          <button
            key={w.week}
            onClick={() => setWeekIdx(i)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              i === weekIdx
                ? "bg-brand-gradient text-white"
                : "border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Week {w.week}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {week?.days.map((d) => (
          <Card key={d.id} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {d.day}
                </p>
                <p className="font-bold text-foreground">{d.label}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {d.muscles.map((m) => (
                  <Badge key={m} variant="secondary">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border">
              {d.exercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {ex.imageUrl && (
                      <ExerciseImage userId="" src={ex.imageUrl} editable={false} size={48} />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.muscle}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span className="font-bold text-foreground">
                      {ex.sets} × {ex.reps}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3.5 w-3.5" /> {ex.rest}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Macro({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
      <p
        className={cn(
          "text-lg font-extrabold",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyPlan({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="font-bold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      <Link
        href="/portal/messages"
        className={cn(buttonVariants({ size: "sm" }), "mt-2")}
      >
        <MessageCircle className="h-4 w-4" /> Message coach
      </Link>
    </Card>
  );
}
