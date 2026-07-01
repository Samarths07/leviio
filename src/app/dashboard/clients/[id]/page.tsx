"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Apple,
  ArrowLeft,
  CalendarClock,
  CreditCard,
  Dumbbell,
  Mail,
  MapPin,
  Phone,
  Plus,
  Ruler,
  Target,
  TrendingDown,
  UserPlus,
  Users,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { Measurement } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatus } from "@/components/dashboard/order-status";
import { InvitePortalDialog } from "@/components/dashboard/invite-portal-dialog";
import { WeightLineChart } from "@/components/dashboard/charts";
import { useToast } from "@/components/ui/toast";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "progress", label: "Progress" },
  { value: "plans", label: "Plans" },
  { value: "sessions", label: "Sessions" },
  { value: "payments", label: "Payments" },
];

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { clients, updateClient } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [inviteOpen, setInviteOpen] = useState(false);

  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <EmptyState
        icon={Users}
        title="Client not found"
        description="This client may have been removed."
        action={
          <Link href="/dashboard/clients" className={buttonVariants({ variant: "outline" })}>
            Back to clients
          </Link>
        }
      />
    );
  }

  const lost = +(client.startWeight - client.currentWeight).toFixed(1);
  const progress = Math.round((client.weeksCompleted / client.weeksTotal) * 100);

  return (
    <div className="animate-fade-in space-y-5">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      {/* Header card */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={client.name} seed={client.avatarSeed} size={64} ring />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                  {client.name}
                </h2>
                {client.status === "VIP" && <Badge variant="warning">VIP</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{client.handle}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge variant="primary">{client.goal}</Badge>
                <Badge variant="secondary">{progress}% complete</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Invite to portal
            </Button>
            <Link
              href="/dashboard/messages"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Message
            </Link>
            <Link
              href="/dashboard/calendar"
              className={buttonVariants({ size: "sm" })}
            >
              Book Session
            </Link>
          </div>
        </div>
      </Card>

      <InvitePortalDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        client={client}
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} variant="underline" />

      {tab === "overview" && (
        <OverviewTab client={client} lost={lost} onSaveNotes={(notes) => {
          updateClient(client.id, { notes });
          toast("Notes saved", { variant: "success" });
        }} />
      )}
      {tab === "progress" && <ProgressTab client={client} lost={lost} onUpdate={(m) => updateClient(client.id, { measurements: m })} />}
      {tab === "plans" && <PlansTab client={client} />}
      {tab === "sessions" && <SessionsTab client={client} onAdd={(s) => updateClient(client.id, { sessions: s })} />}
      {tab === "payments" && <PaymentsTab client={client} />}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/[0.04] text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OverviewTab({
  client,
  lost,
  onSaveNotes,
}: {
  client: any;
  lost: number;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(client.notes);
  const { toast } = useToast();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Client Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow icon={Mail} label="Email" value={client.email} />
          <InfoRow icon={Phone} label="Phone" value={client.phone} />
          <InfoRow icon={Users} label="Age" value={`${client.age} years`} />
          <InfoRow icon={MapPin} label="Location" value={client.location} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Body Metrics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Start" value={`${client.startWeight}kg`} />
          <Metric label="Current" value={`${client.currentWeight}kg`} />
          <Metric label="Height" value={`${client.height}cm`} />
          <Metric label="Body fat" value={`${client.bodyFat}%`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Goal & Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-foreground">{client.goal}</p>
              <p className="text-sm text-muted-foreground">
                {client.weeksTotal}-week program · started {formatDate(client.startDate, "short")}
              </p>
            </div>
          </div>
          {client.package && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background/40 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Coaching package</p>
                <p className="font-bold text-foreground">{client.package}</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => onSaveNotes(notes)}
            rows={4}
            placeholder="Add private notes about this client (auto-saved on blur)..."
          />
          <p className="mt-2 text-xs text-muted-foreground">Notes auto-save when you click away.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressTab({
  client,
  lost,
  onUpdate,
}: {
  client: any;
  lost: number;
  onUpdate: (m: Measurement[]) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ waist: "", hips: "", chest: "", arms: "", thighs: "" });

  const add = () => {
    const m: Measurement = {
      date: new Date().toISOString(),
      waist: Number(form.waist) || 0,
      hips: Number(form.hips) || 0,
      chest: Number(form.chest) || 0,
      arms: Number(form.arms) || 0,
      thighs: Number(form.thighs) || 0,
    };
    onUpdate([...client.measurements, m]);
    toast("Measurement logged", { variant: "success" });
    setForm({ waist: "", hips: "", chest: "", arms: "", thighs: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Weight Tracking</CardTitle></CardHeader>
          <CardContent>
            <WeightLineChart data={client.weighIns} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15 text-success">
                <TrendingDown className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-foreground">
                  {lost >= 0 ? "−" : "+"}{Math.abs(lost)}kg
                </p>
                <p className="text-xs text-muted-foreground">Since start</p>
              </div>
            </div>
            <Metric label="Current weight" value={`${client.currentWeight}kg`} />
            <Metric label="Body fat" value={`${client.bodyFat}%`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Measurements (cm)</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Log Measurement
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {client.measurements.length === 0 ? (
            <p className="px-5 text-sm text-muted-foreground">No measurements logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-y border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Waist</th>
                    <th className="px-3 py-2.5 font-semibold">Hips</th>
                    <th className="px-3 py-2.5 font-semibold">Chest</th>
                    <th className="px-3 py-2.5 font-semibold">Arms</th>
                    <th className="px-3 py-2.5 font-semibold">Thighs</th>
                  </tr>
                </thead>
                <tbody>
                  {client.measurements.map((m: Measurement, i: number) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(m.date, "short")}</td>
                      <td className="px-3 py-3 font-semibold text-foreground">{m.waist}</td>
                      <td className="px-3 py-3 font-semibold text-foreground">{m.hips}</td>
                      <td className="px-3 py-3 font-semibold text-foreground">{m.chest}</td>
                      <td className="px-3 py-3 font-semibold text-foreground">{m.arms}</td>
                      <td className="px-3 py-3 font-semibold text-foreground">{m.thighs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="Log Measurement" size="sm">
        <div className="grid grid-cols-2 gap-3">
          {(["waist", "hips", "chest", "arms", "thighs"] as const).map((k) => (
            <div key={k}>
              <Label className="capitalize">{k} (cm)</Label>
              <Input
                type="number"
                value={(form as any)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={add}>Save</Button>
        </div>
      </Dialog>
    </div>
  );
}

function PlansTab({ client }: { client: any }) {
  const { toast } = useToast();
  const { mealPlans, programs, updateClient, saveMealPlan, saveProgram } = useApp();
  const [pickProgram, setPickProgram] = useState(false);
  const [pickMeal, setPickMeal] = useState(false);

  const program =
    programs.find((p) => p.id === client.programId) ??
    programs.find((p) => p.client === client.name);
  const meal =
    mealPlans.find((p) => p.id === client.mealPlanId) ??
    mealPlans.find((p) => p.client === client.name);

  const assignProgram = (p: any) => {
    updateClient(client.id, { programId: p.id });
    saveProgram({ ...p, client: client.name });
    toast(`Assigned "${p.name}" to ${client.name}`, { variant: "success" });
    setPickProgram(false);
  };
  const assignMeal = (p: any) => {
    updateClient(client.id, { mealPlanId: p.id });
    saveMealPlan({ ...p, client: client.name });
    toast(`Assigned "${p.name}" to ${client.name}`, { variant: "success" });
    setPickMeal(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Active Workout Program</CardTitle></CardHeader>
        <CardContent>
          {program ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Dumbbell className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-foreground">{program.name}</p>
                <p className="text-xs text-muted-foreground">
                  {program.weeks} weeks · {program.daysPerWeek} days/week · {program.difficulty}
                </p>
              </div>
              <Link href="/dashboard/workout-builder" className={buttonVariants({ variant: "subtle", size: "sm" })}>
                View
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Dumbbell className="h-4 w-4" /> No program assigned yet.
            </div>
          )}
          <Button variant="outline" className="mt-3 w-full" onClick={() => setPickProgram(true)}>
            <Plus className="h-4 w-4" /> {program ? "Change program" : "Assign program"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active Meal Plan</CardTitle></CardHeader>
        <CardContent>
          {meal ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/15 text-success">
                <Apple className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-foreground">{meal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {meal.calorieTarget} kcal/day · {meal.protein}P/{meal.carbs}C/{meal.fat}F
                </p>
              </div>
              <Link href="/dashboard/diet-planner" className={buttonVariants({ variant: "subtle", size: "sm" })}>
                View
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Apple className="h-4 w-4" /> No meal plan assigned yet.
            </div>
          )}
          <Button variant="outline" className="mt-3 w-full" onClick={() => setPickMeal(true)}>
            <Plus className="h-4 w-4" /> {meal ? "Change meal plan" : "Assign meal plan"}
          </Button>
        </CardContent>
      </Card>

      {/* Program picker */}
      <Dialog open={pickProgram} onClose={() => setPickProgram(false)} title="Assign a program" size="sm">
        <div className="thin-scrollbar max-h-[50vh] space-y-1.5 overflow-y-auto">
          {programs.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No programs yet — create one in the Workout Builder.
            </p>
          )}
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => assignProgram(p)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Dumbbell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.weeks} weeks · {p.goal}</p>
              </div>
              {client.programId === p.id && <Badge variant="success">Current</Badge>}
            </button>
          ))}
        </div>
      </Dialog>

      {/* Meal plan picker */}
      <Dialog open={pickMeal} onClose={() => setPickMeal(false)} title="Assign a meal plan" size="sm">
        <div className="thin-scrollbar max-h-[50vh] space-y-1.5 overflow-y-auto">
          {mealPlans.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No meal plans yet — create one in the Diet Planner.
            </p>
          )}
          {mealPlans.map((p) => (
            <button
              key={p.id}
              onClick={() => assignMeal(p)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
                <Apple className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.calorieTarget} kcal · {p.days.length} days</p>
              </div>
              {client.mealPlanId === p.id && <Badge variant="success">Current</Badge>}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}

function SessionsTab({ client, onAdd }: { client: any; onAdd: (s: any[]) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "1-on-1 Coaching", duration: "60", notes: "" });

  const add = () => {
    const s = {
      id: "sess_" + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      type: form.type,
      duration: Number(form.duration),
      notes: form.notes,
      completed: true,
    };
    onAdd([s, ...client.sessions]);
    toast("Session logged", { variant: "success" });
    setForm({ type: "1-on-1 Coaching", duration: "60", notes: "" });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Sessions</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Log Session
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {client.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
        ) : (
          client.sessions.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{s.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(s.date, "medium")} · {s.duration} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.completed ? "success" : "warning"}>
                    {s.completed ? "Completed" : "Upcoming"}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => setOpenNotes(openNotes === s.id ? null : s.id)}>
                    Notes
                  </Button>
                </div>
              </div>
              {openNotes === s.id && (
                <p className="mt-3 rounded-lg bg-background/60 p-3 text-sm text-muted-foreground">
                  {s.notes}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onClose={() => setOpen(false)} title="Log Session" size="sm">
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
          <div>
            <Label>Duration (min)</Label>
            <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={add}>Save</Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}

function PaymentsTab({ client }: { client: any }) {
  const total = client.payments.reduce((s: number, p: any) => s + p.amount, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Total spent</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{formatCurrency(total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Payments</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{client.payments.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Subscription</p>
          <p className="mt-1 text-base font-extrabold text-foreground">
            {client.package ? client.package : "None"}
          </p>
          {client.package && <Badge variant="success" className="mt-1">Active</Badge>}
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent className="px-0">
          {client.payments.length === 0 ? (
            <p className="px-5 text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-y border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-semibold">Date</th>
                    <th className="px-5 py-2.5 font-semibold">Product</th>
                    <th className="px-5 py-2.5 font-semibold">Method</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {client.payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(p.date, "short")}</td>
                      <td className="px-5 py-3 text-foreground/90">{p.product}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.method}</td>
                      <td className="px-5 py-3"><OrderStatus status={p.status} /></td>
                      <td className="px-5 py-3 text-right font-bold text-foreground">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
