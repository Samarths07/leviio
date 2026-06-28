"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Wand2 } from "lucide-react";
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

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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
  password: "",
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
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter a name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (form.password.trim().length < 6) errs.password = "At least 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const email = form.email.trim();
    const password = form.password.trim();

    setSaving(true);
    // Provision the portal login first — if this fails we don't create a client
    // record that can't be logged into.
    let res: Response;
    try {
      res = await fetch("/api/portal/provision-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setSaving(false);
      toast("Couldn't reach the server. Try again.", { variant: "error" });
      return;
    }
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast(data?.error ?? "Couldn't create the login.", { variant: "error" });
      return;
    }

    const weight = Number(form.weight) || 70;
    const client: Client = {
      id: uid("client"),
      name: form.name.trim(),
      handle: "@" + form.name.toLowerCase().replace(/\s/g, ""),
      email,
      phone: form.phone || "—",
      age: Number(form.age) || 30,
      location: "—",
      goal: form.goal,
      status: "Active",
      portalStatus: "approved", // coach set the login → access granted immediately
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
    toast(
      data?.existed
        ? `${client.name} added. This email already has a portal account — they log in with their existing password.`
        : `${client.name} added. They can log in at the portal with ${email} and the password you set.`,
      { variant: "success" }
    );
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
          <div className="col-span-2">
            <Label>Portal password</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => set({ password: e.target.value })}
                placeholder="Set a password for the client"
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => set({ password: randomPassword() })}
                  aria-label="Generate password"
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <Wand2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-danger">{errors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Share this email + password with your client so they can log in.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating…" : "Add Client"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
