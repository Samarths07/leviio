"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Dumbbell,
  Library,
  MessageCircle,
  Package,
  Utensils,
  Video,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { creator as seedCreator } from "@/lib/mock-data";
import {
  clientConversation,
  clientEvents,
  clientMealPlan,
  clientProgram,
  matchOrders,
} from "@/lib/portal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatDate, formatTime } from "@/lib/utils";

export default function PortalHome() {
  const {
    clientUser,
    orders,
    mealPlans,
    programs,
    events,
    conversations,
    user,
    coach: portalCoach,
  } = useApp();
  const coach = portalCoach ?? user ?? seedCreator;

  if (!clientUser) return null;

  const myOrders = matchOrders(orders, clientUser);
  const plan = clientMealPlan(mealPlans, clientUser);
  const program = clientProgram(programs, clientUser);
  const conv = clientConversation(conversations, clientUser);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [
    ...clientEvents(events, clientUser)
      .filter((e) => e.date >= today)
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        link: e.meetingLink,
      })),
    ...myOrders
      .filter((o) => o.sessionDate && o.sessionDate.slice(0, 10) >= today)
      .map((o) => ({
        id: o.id,
        title: o.product,
        date: o.sessionDate!.slice(0, 10),
        time: o.sessionDate!.slice(11, 16),
        link: undefined as string | undefined,
      })),
  ].sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));

  const nextSession = upcoming[0];

  const quickLinks = [
    {
      href: "/portal/library",
      label: "My Library",
      desc: `${myOrders.length} purchase${myOrders.length === 1 ? "" : "s"}`,
      icon: Library,
    },
    {
      href: "/portal/plan",
      label: "My Plan",
      desc: plan || program ? "Diet & workout" : "Not assigned yet",
      icon: Utensils,
    },
    {
      href: "/portal/sessions",
      label: "Sessions",
      desc: nextSession ? "Upcoming booked" : "Book a session",
      icon: CalendarCheck,
    },
    {
      href: "/portal/messages",
      label: "Messages",
      desc: conv?.messages.length ? "Chat with coach" : "Say hello",
      icon: MessageCircle,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
      {/* Welcome */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={clientUser.name} seed={clientUser.avatarSeed} size={52} ring />
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              {clientUser.name.split(" ")[0]} 👋
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background/40 px-3 py-2">
          <Avatar name={coach.name} seed={coach.avatarSeed} src={coach.avatarUrl} size={34} ring />
          <div>
            <p className="text-[11px] text-muted-foreground">Your coach</p>
            <p className="text-sm font-bold text-foreground">{coach.name}</p>
          </div>
        </div>
      </Card>

      {/* Next session */}
      {nextSession ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Next session
                </p>
                <p className="mt-0.5 font-bold text-foreground">{nextSession.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(nextSession.date, "long")} · {formatTime(nextSession.time)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {nextSession.link && (
                <a
                  href={nextSession.link}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  <Video className="h-4 w-4" /> Join call
                </a>
              )}
              <Link
                href="/portal/sessions"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                All sessions
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">No upcoming sessions</p>
              <p className="text-sm text-muted-foreground">
                Book a 1-on-1 from your sessions tab.
              </p>
            </div>
          </div>
          <Link
            href="/portal/sessions"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View sessions
          </Link>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((q) => {
          const Icon = q.icon;
          return (
            <Link key={q.href} href={q.href}>
              <Card hover className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground">{q.label}</p>
                  <p className="truncate text-sm text-muted-foreground">{q.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent purchases */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-foreground">Recent purchases</h3>
          <Link
            href="/portal/library"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {myOrders.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <Package className="h-7 w-7 text-muted-foreground" />
            <p className="font-bold text-foreground">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">
              Your purchases will appear here.
            </p>
            <Link
              href={`/${coach.username}`}
              className={cn(buttonVariants({ size: "sm" }), "mt-1")}
            >
              Browse store
            </Link>
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {myOrders.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  {o.type === "Service" ? (
                    <CalendarCheck className="h-5 w-5" />
                  ) : o.type === "Physical" ? (
                    <Package className="h-5 w-5" />
                  ) : (
                    <Dumbbell className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{o.product}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(o.date)} · #{o.id.replace(/^#/, "")}
                  </p>
                </div>
                <Badge variant="success">{o.fulfillment ?? "Delivered"}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Link
        href="/portal/library"
        className={cn(buttonVariants({ variant: "subtle" }), "w-full sm:hidden")}
      >
        <Library className="h-4 w-4" /> Open my library
      </Link>
    </div>
  );
}
