"use client";

import { useState } from "react";
import type { CalendarEvent, EventType } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

const sessionTypes: EventType[] = [
  "Coaching Session",
  "Group Call",
  "Check-in Call",
  "Consultation",
];
const colors: Record<string, string> = {
  "Coaching Session": "#7c3aed",
  "Group Call": "#ec4899",
  "Check-in Call": "#3b82f6",
  Consultation: "#22c55e",
};

export function NewSessionDialog({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}) {
  const { clients, addEvent, user } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState({
    type: "Coaching Session" as EventType,
    clientId: clients[0]?.id ?? "",
    date: defaultDate ?? "2026-06-18",
    time: "10:00",
    duration: "60",
    link: user?.meetingLink ?? "",
    notes: "",
    reminder: true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === form.clientId);
    const evt: CalendarEvent = {
      id: uid("evt"),
      title: `${form.type}${client ? ` — ${client.name.split(" ")[0]}` : ""}`,
      type: form.type,
      clientId: client?.id,
      clientName: client?.name,
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      meetingLink: form.link,
      notes: form.notes,
      color: colors[form.type] ?? "#7c3aed",
    };
    addEvent(evt);
    toast("Session scheduled", { variant: "success" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="New Session" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Session type</Label>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}>
            {sessionTypes.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label>Client</Label>
          <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Time</Label>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Duration</Label>
          <Select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </Select>
        </div>
        <div>
          <Label>Meeting link</Label>
          <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">Send reminder</span>
          <Switch checked={form.reminder} onCheckedChange={(v) => setForm({ ...form, reminder: v })} aria-label="Send reminder" />
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1">Schedule Session</Button>
        </div>
      </form>
    </Dialog>
  );
}
