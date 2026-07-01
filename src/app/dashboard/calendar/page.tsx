"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Video } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import type { CalendarEvent } from "@/lib/types";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TODAY = "2026-06-17";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const { events, deleteEvent } = useApp();
  const { toast } = useToast();
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date(2026, 5, 1));
  const [selected, setSelected] = useState(TODAY);
  const [open, setOpen] = useState(false);

  const byDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) (map[e.date] ??= []).push(e);
    return map;
  }, [events]);

  const dayEvents = (byDate[selected] ?? []).sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= TODAY)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 5),
    [events]
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">Calendar</h2>
          <p className="text-sm text-muted-foreground">Schedule and manage your sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            tabs={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }]}
            value={view}
            onChange={setView}
          />
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Session
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>
              {view === "month"
                ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
                : `Week of ${formatDate(selected, "medium")}`}
            </CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  view === "month"
                    ? setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                    : shiftSelected(-7)
                }
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-foreground/[0.06]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  view === "month"
                    ? setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                    : shiftSelected(7)
                }
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-foreground/[0.06]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {view === "month" ? (
              <MonthGrid cursor={cursor} byDate={byDate} selected={selected} onSelect={setSelected} />
            ) : (
              <WeekGrid selected={selected} byDate={byDate} onSelect={setSelected} />
            )}
            <Legend />
          </CardContent>
        </Card>

        {/* Day detail + upcoming */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>{formatDate(selected, "long")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events on this day.</p>
              ) : (
                dayEvents.map((e) => (
                  <div key={e.id} className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(e.time)} · {e.duration} min
                        </p>
                        {e.notes && <p className="mt-1 text-xs text-muted-foreground">{e.notes}</p>}
                      </div>
                      <button
                        onClick={() => { deleteEvent(e.id); toast("Event deleted", { variant: "info" }); }}
                        aria-label="Delete event"
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add to this day
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Upcoming Sessions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none"
                    style={{ backgroundColor: e.color + "26", color: e.color }}
                  >
                    {formatDate(e.date, "short").split(" ")[0]}
                    <span className="text-sm">{formatDate(e.date, "short").split(" ")[1]}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{e.clientName ?? e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.type} · {formatTime(e.time)}</p>
                  </div>
                  <a
                    href={e.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "subtle", size: "sm" })}
                  >
                    <Video className="h-3.5 w-3.5" /> Join
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <NewSessionDialog open={open} onClose={() => setOpen(false)} defaultDate={selected} />
    </div>
  );

  function shiftSelected(days: number) {
    const d = new Date(selected);
    d.setDate(d.getDate() + days);
    setSelected(ymd(d));
  }
}

function MonthGrid({
  cursor,
  byDate,
  selected,
  onSelect,
}: {
  cursor: Date;
  byDate: Record<string, CalendarEvent[]>;
  selected: string;
  onSelect: (d: string) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[11px] font-semibold text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const key = ymd(date);
          const evts = byDate[key] ?? [];
          const isToday = key === TODAY;
          const isSel = key === selected;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cn(
                "flex min-h-[64px] flex-col rounded-lg border p-1.5 text-left transition-colors",
                isSel ? "border-primary bg-primary/10" : "border-border hover:border-primary/30",
              )}
            >
              <span
                className={cn(
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday ? "bg-brand-gradient text-white" : "text-foreground"
                )}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {evts.slice(0, 4).map((e) => (
                  <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                ))}
                {evts.length > 4 && <span className="text-[9px] text-muted-foreground">+{evts.length - 4}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  selected,
  byDate,
  onSelect,
}: {
  selected: string;
  byDate: Record<string, CalendarEvent[]>;
  onSelect: (d: string) => void;
}) {
  const base = new Date(selected);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const key = ymd(d);
        const evts = (byDate[key] ?? []).sort((a, b) => a.time.localeCompare(b.time));
        const isSel = key === selected;
        const isToday = key === TODAY;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "flex min-h-[180px] flex-col gap-1 rounded-lg border p-2 text-left transition-colors",
              isSel ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            )}
          >
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {WEEKDAYS[d.getDay()]}
              </p>
              <p className={cn("text-sm font-bold", isToday ? "text-primary" : "text-foreground")}>
                {d.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {evts.map((e) => (
                <div
                  key={e.id}
                  className="rounded-md p-1 text-[10px] font-semibold leading-tight text-white"
                  style={{ backgroundColor: e.color }}
                >
                  <p className="truncate">{formatTime(e.time)}</p>
                  <p className="truncate font-medium opacity-90">{e.clientName ?? e.type}</p>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Coaching", color: "#7c3aed" },
    { label: "Check-in", color: "#3b82f6" },
    { label: "Launch", color: "#f59e0b" },
    { label: "Consultation", color: "#22c55e" },
    { label: "Group", color: "#ec4899" },
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
