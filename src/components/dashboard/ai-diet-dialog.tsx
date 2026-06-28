"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { MealPlan } from "@/lib/types";
import { DIET_TYPES } from "@/lib/diet";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Maintenance",
  "Recomposition",
  "Athletic Performance",
  "General Fitness",
];

export function AiDietDialog({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (plan: MealPlan) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    goal: "Weight Loss",
    calories: "2000",
    dietType: "Standard",
    days: "7",
    notes: "",
  });

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: form.goal,
          calories: Number(form.calories),
          dietType: [form.dietType],
          days: Number(form.days),
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed.");
      onGenerated(data.plan as MealPlan);
      toast("Plan generated — review and save it", { variant: "success" });
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Generation failed.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Generate with AI" size="md">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Describe the client&apos;s needs and AI will draft a full meal plan you can review and edit.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Goal</Label>
            <Select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </Select>
          </div>
          <div>
            <Label>Diet type</Label>
            <Select value={form.dietType} onChange={(e) => setForm({ ...form, dietType: e.target.value })}>
              {DIET_TYPES.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Daily calories</Label>
            <Input
              type="number"
              min={800}
              max={6000}
              value={form.calories}
              onChange={(e) => setForm({ ...form, calories: e.target.value })}
            />
          </div>
          <div>
            <Label>Number of days</Label>
            <Select value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })}>
              {[1, 3, 5, 7, 10, 14].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "day" : "days"}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Notes & allergies (optional)</Label>
          <Textarea
            rows={2}
            value={form.notes}
            placeholder="e.g. lactose intolerant, high protein, no seafood, prep-friendly meals"
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate Plan"}
          </Button>
        </div>
        {loading && (
          <p className="text-center text-xs text-muted-foreground">
            This can take 15-30 seconds. Hang tight.
          </p>
        )}
      </div>
    </Dialog>
  );
}
