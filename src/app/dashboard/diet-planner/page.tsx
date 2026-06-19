"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Apple,
  Copy,
  Edit2,
  LayoutGrid,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import type { MealPlan, MealTemplate } from "@/lib/types";
import { mealTemplates } from "@/lib/mock-data";
import { emptyDay, newPlan } from "@/lib/diet";
import { formatDate, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { DietBuilder } from "@/components/dashboard/diet-builder";
import { AssignClientDialog } from "@/components/dashboard/assign-client-dialog";

const tabs = [
  { value: "plans", label: "My Plans" },
  { value: "create", label: "Create New" },
  { value: "templates", label: "Template Library" },
];

function templateToPlan(t: MealTemplate): MealPlan {
  return {
    id: uid("plan"),
    name: `${t.name} (copy)`,
    calorieTarget: t.calorieTarget,
    protein: t.protein,
    carbs: t.carbs,
    fat: t.fat,
    dietType: t.dietType,
    days: Array.from({ length: t.days }).map((_, i) => emptyDay(`Day ${i + 1}`)),
    updatedAt: new Date().toISOString(),
  };
}

function DietInner() {
  const params = useSearchParams();
  const { mealPlans, clients, saveMealPlan, deleteMealPlan, updateClient } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState(params.get("tab") === "create" ? "create" : "plans");
  const [builderInit, setBuilderInit] = useState<MealPlan | null>(null);
  const [assigning, setAssigning] = useState<MealPlan | null>(null);

  const startNew = () => {
    setBuilderInit(newPlan(7));
    setTab("create");
  };
  const edit = (p: MealPlan) => {
    setBuilderInit(p);
    setTab("create");
  };
  const useTemplate = (t: MealTemplate) => {
    setBuilderInit(templateToPlan(t));
    setTab("create");
    toast(`Loaded "${t.name}" template`, { variant: "success" });
  };
  const duplicate = (p: MealPlan) => {
    saveMealPlan({ ...p, id: uid("plan"), name: `${p.name} (copy)`, updatedAt: new Date().toISOString() });
    toast("Plan duplicated", { variant: "success" });
  };
  const assignToClient = (clientId: string, clientName: string) => {
    if (!assigning) return;
    updateClient(clientId, { mealPlanId: assigning.id });
    saveMealPlan({ ...assigning, client: clientName });
    toast(`Assigned "${assigning.name}" to ${clientName}`, { variant: "success" });
    setAssigning(null);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">Diet Planner</h2>
          <p className="text-sm text-muted-foreground">
            Build macro-balanced meal plans for your clients.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "plans" && (
        mealPlans.length === 0 ? (
          <EmptyState
            icon={Apple}
            title="No meal plans yet"
            description="Create your first meal plan or start from a template."
            action={<Button onClick={startNew}><Plus className="h-4 w-4" /> New Plan</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mealPlans.map((p) => (
              <Card key={p.id} hover className="p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 text-success">
                    <Apple className="h-5 w-5" />
                  </span>
                  <Badge variant="secondary">{p.days.length} days</Badge>
                </div>
                <h3 className="mt-3 font-bold text-foreground">{p.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {p.client ? `For ${p.client}` : "Unassigned"} · edited {formatDate(p.updatedAt, "short")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="primary">{p.calorieTarget} kcal</Badge>
                  <Badge variant="outline">{p.protein}/{p.carbs}/{p.fat}</Badge>
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
                  <Button size="sm" variant="ghost" onClick={() => { deleteMealPlan(p.id); toast("Plan deleted", { variant: "info" }); }}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "create" && (
        <DietBuilder
          key={builderInit?.id ?? "new"}
          initial={builderInit ?? newPlan(7)}
          onSaved={() => setTab("plans")}
        />
      )}

      {tab === "templates" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mealTemplates.map((t) => (
            <Card key={t.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <LayoutGrid className="h-5 w-5" />
                </span>
                <Badge variant="secondary">{t.goal}</Badge>
              </div>
              <h3 className="mt-3 font-bold text-foreground">{t.name}</h3>
              <p className="text-xs text-muted-foreground">{t.days}-day plan</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="primary">{t.calorieTarget} kcal</Badge>
                <Badge variant="outline">{t.protein}/{t.carbs}/{t.fat}</Badge>
                {t.dietType.map((d) => (
                  <Badge key={d} variant="secondary">{d}</Badge>
                ))}
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => useTemplate(t)}>
                Use Template
              </Button>
            </Card>
          ))}
        </div>
      )}

      <AssignClientDialog
        open={!!assigning}
        onClose={() => setAssigning(null)}
        title="Assign meal plan"
        itemName={assigning?.name}
        onAssign={assignToClient}
      />
    </div>
  );
}

export default function DietPlannerPage() {
  return (
    <Suspense>
      <DietInner />
    </Suspense>
  );
}
