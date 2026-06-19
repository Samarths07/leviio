"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Video,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { creator as seedCreator } from "@/lib/mock-data";
import type { CalendarEvent } from "@/lib/types";
import { cn, formatDate, formatTime, uid } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00"];

function nextDays(count: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 1; i <= count; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    if (day.getDay() !== 0) out.push(day); // skip Sundays
  }
  return out.slice(0, count);
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, updateOrder, addEvent, hydrated, user } = useApp();
  const { toast } = useToast();
  const creator = user ?? seedCreator;
  const accent = creator.bannerColor;

  const days = useMemo(() => nextDays(10), []);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const order = orders.find((o) => o.id === id);
  const alreadyBooked =
    !!order && (!!order.sessionDate || order.fulfillment === "Booked" || order.fulfillment === "Completed");

  const confirm = () => {
    if (!order || !date || !time) return;
    setSaving(true);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    // Stored as a local datetime (no timezone shift) so the booked time displays as picked.
    const sessionDate = `${dateStr}T${time}:00`;

    const event: CalendarEvent = {
      id: uid("evt"),
      title: `${order.product} — ${order.client.split(" ")[0]}`,
      type: "Coaching Session",
      clientName: order.client,
      date: dateStr,
      time,
      duration: 60,
      meetingLink: "https://meet.google.com/abc-defg-hij",
      notes: `Booked via storefront. Order #${order.id}. Client: ${order.client}${order.email ? ` (${order.email})` : ""}.`,
      color: accent,
    };

    setTimeout(() => {
      addEvent(event);
      updateOrder(order.id, { fulfillment: "Booked", sessionDate });
      setSaving(false);
      toast("Session booked! 🎉", { variant: "success" });
    }, 500);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Logo />
          <span className="text-xs text-muted-foreground">Booking</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {!hydrated ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !order ? (
          <Card className="p-8 text-center">
            <h1 className="text-lg font-bold text-foreground">Booking link not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This link may have expired or the order is on another device.
            </p>
            <Link href={`/${creator.username}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              Visit the store
            </Link>
          </Card>
        ) : alreadyBooked ? (
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-xl font-extrabold text-foreground">You&apos;re booked!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.product} with {creator.name}
            </p>
            {order.sessionDate && (
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {formatDate(order.sessionDate, "long")} at {formatTime(order.sessionDate.slice(11, 16))}
                </span>
              </div>
            )}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Video className="h-3.5 w-3.5" /> A meeting link will be shared before your session.
            </p>
          </Card>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Book your session</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.product} with <span className="font-semibold text-foreground">{creator.name}</span>
              </p>
            </div>

            <Card className="p-5 sm:p-6">
              {/* Pick a day */}
              <p className="mb-2.5 text-sm font-bold text-foreground">
                <span style={{ color: accent }}>1.</span> Choose a day
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {days.map((d) => {
                  const sel = date && d.toDateString() === date.toDateString();
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setDate(d)}
                      className={cn(
                        "rounded-xl border p-2.5 text-center transition-colors",
                        sel ? "border-transparent text-white" : "border-border text-foreground hover:border-primary/40"
                      )}
                      style={sel ? { backgroundColor: accent } : undefined}
                    >
                      <span className="block text-[10px] font-semibold uppercase opacity-80">
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="block text-lg font-extrabold leading-tight">{d.getDate()}</span>
                      <span className="block text-[10px] opacity-80">
                        {d.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Pick a time */}
              <p className="mb-2.5 mt-5 text-sm font-bold text-foreground">
                <span style={{ color: accent }}>2.</span> Choose a time
              </p>
              <div className="flex flex-wrap gap-2">
                {SLOTS.map((s) => {
                  const sel = time === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setTime(s)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                        sel ? "border-transparent text-white" : "border-border text-foreground hover:border-primary/40"
                      )}
                      style={sel ? { backgroundColor: accent } : undefined}
                    >
                      <Clock className="h-3.5 w-3.5" /> {formatTime(s)}
                    </button>
                  );
                })}
              </div>

              <Button
                className="mt-6 w-full"
                style={{ backgroundColor: accent }}
                disabled={!date || !time || saving}
                onClick={confirm}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                {date && time ? `Confirm ${formatDate(date, "short")} at ${formatTime(time)}` : "Select a day & time"}
              </Button>
            </Card>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-foreground">Leviio</span>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
