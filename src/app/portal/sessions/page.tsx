"use client";

import { useMemo } from "react";
import Link from "next/link";
import { appUrl } from "@/lib/hosts";
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  History,
  Video,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { clientEvents, matchOrders } from "@/lib/portal";
import { orderType } from "@/lib/delivery";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatDate, formatTime } from "@/lib/utils";

interface SessionItem {
  key: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  link?: string;
  past?: boolean;
}

export default function PortalSessions() {
  const { clientUser, orders, events } = useApp();
  const today = new Date().toISOString().slice(0, 10);

  const { awaiting, upcoming, past } = useMemo(() => {
    if (!clientUser)
      return { awaiting: [], upcoming: [] as SessionItem[], past: [] as SessionItem[] };

    const myOrders = matchOrders(orders, clientUser);
    const serviceOrders = myOrders.filter((o) => orderType(o) === "Service");
    const awaiting = serviceOrders.filter(
      (o) => !o.sessionDate && o.fulfillment !== "Completed"
    );

    const items: SessionItem[] = [
      ...clientEvents(events, clientUser).map((e) => ({
        key: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        link: e.meetingLink,
      })),
      ...serviceOrders
        .filter((o) => o.sessionDate)
        .map((o) => ({
          key: o.id,
          title: o.product,
          date: o.sessionDate!.slice(0, 10),
          time: o.sessionDate!.slice(11, 16),
        })),
      ...clientUser.sessions
        .filter((s) => s.completed)
        .map((s) => ({
          key: s.id,
          title: s.type,
          date: s.date.slice(0, 10),
          time: s.date.slice(11, 16),
          past: true,
        })),
    ];

    const upcoming = items
      .filter((i) => !i.past && i.date >= today)
      .sort((a, b) => (a.date + (a.time ?? "") < b.date + (b.time ?? "") ? -1 : 1));
    const past = items
      .filter((i) => i.past || i.date < today)
      .sort((a, b) => (a.date + (a.time ?? "") > b.date + (b.time ?? "") ? -1 : 1));

    return { awaiting, upcoming, past };
  }, [clientUser, orders, events, today]);

  if (!clientUser) return null;

  const nothing =
    awaiting.length === 0 && upcoming.length === 0 && past.length === 0;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">Sessions</h2>
        <p className="text-sm text-muted-foreground">
          Your 1-on-1 calls and check-ins with your coach.
        </p>
      </div>

      {/* Awaiting booking */}
      {awaiting.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-warning">
            Ready to book
          </h3>
          {awaiting.map((o) => (
            <Card
              key={o.id}
              className="flex flex-col gap-3 border-warning/30 bg-warning/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15 text-warning">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{o.product}</p>
                  <p className="text-sm text-muted-foreground">
                    Pick a time that works for you.
                  </p>
                </div>
              </div>
              <a
                href={appUrl(`/book/${o.id}`)}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <CalendarCheck className="h-4 w-4" /> Book now
              </a>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Upcoming
        </h3>
        {upcoming.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <CalendarCheck className="h-7 w-7 text-muted-foreground" />
            <p className="font-bold text-foreground">No upcoming sessions</p>
            <p className="text-sm text-muted-foreground">
              Booked sessions will appear here.
            </p>
          </Card>
        ) : (
          upcoming.map((s) => (
            <Card
              key={s.key}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {formatDate(s.date, "short").split(" ")[0]}
                  </span>
                  <span className="text-lg font-extrabold leading-none">
                    {new Date(s.date).getDate()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{s.title}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(s.date, "long")}
                    {s.time && ` · ${formatTime(s.time)}`}
                  </p>
                </div>
              </div>
              {s.link ? (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  <Video className="h-4 w-4" /> Join call
                </a>
              ) : (
                <Badge variant="primary">
                  <Video className="mr-1 h-3.5 w-3.5" /> Link soon
                </Badge>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <History className="h-4 w-4" /> Past
          </h3>
          <Card className="divide-y divide-border">
            {past.map((s) => (
              <div key={s.key} className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.date, "long")}
                    {s.time && ` · ${formatTime(s.time)}`}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {nothing && (
        <Card className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          <p className="font-bold text-foreground">No sessions yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When you buy a coaching package or call, you&apos;ll book and manage it here.
          </p>
        </Card>
      )}
    </div>
  );
}
