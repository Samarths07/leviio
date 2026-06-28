"use client";

import { useState } from "react";
import type { Client, ClientGoal } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { coachingPackages } from "@/lib/mock-data";

const goals: ClientGoal[] = ["Weight Loss", "Muscle Gain", "Maintain", "Athletic Performance"];

const empty = {
  name: "",
  email: "",
  phone: "",
  age: "",
  height: "",
  weight: "",
  goal: "Weight Loss" as ClientGoal,
  notes: "",
  pkg: "",
};

export function AddClientDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addClient } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter a name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const weight = Number(form.weight) || 70;
    const client: Client = {
      id: uid("client"),
      name: form.name.trim(),
      handle: "@" + form.name.toLowerCase().replace(/\s/g, ""),
      email: form.email.trim(),
      phone: form.phone || "—",
      age: Number(form.age) || 30,
      location: "—",
      goal: form.goal,
      status: "Active",
      portalStatus: "none",
      avatarSeed: form.name,
      startDate: new Date().toISOString(),
      weeksTotal: 12,
      weeksCompleted: 0,
      height: Number(form.height) || 170,
      startWeight: weight,
      currentWeight: weight,
      bodyFat: 22,
      notes: form.notes,
      package: form.pkg || undefined,
      activePlans: 0,
      weighIns: [{ week: "W1", weight }],
      measurements: [],
      sessions: [],
      payments: [],
    };
    addClient(client);
    toast(`${client.name} added. They can sign up at the portal with this email — approve them when ready.`, { variant: "success" });
    setForm({ ...empty });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Client" description="Create a new client profile." size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Full name</Label>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Jordan Carter" />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div className="col-span-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@email.com" />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+1 555 000 0000" />
          </div>
          <div>
            <Label>Age</Label>
            <Input type="number" value={form.age} onChange={(e) => set({ age: e.target.value })} placeholder="30" />
          </div>
          <div>
            <Label>Height (cm)</Label>
            <Input type="number" value={form.height} onChange={(e) => set({ height: e.target.value })} placeholder="170" />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input type="number" value={form.weight} onChange={(e) => set({ weight: e.target.value })} placeholder="70" />
          </div>
          <div>
            <Label>Goal</Label>
            <Select value={form.goal} onChange={(e) => set({ goal: e.target.value as ClientGoal })}>
              {goals.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Assign package</Label>
            <Select value={form.pkg} onChange={(e) => set({ pkg: e.target.value })}>
              <option value="">None</option>
              {coachingPackages.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} placeholder="Anything important about this client..." />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Add Client
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
