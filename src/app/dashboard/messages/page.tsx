"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Apple,
  CalendarPlus,
  Dumbbell,
  Search,
  Send,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { LIMITS } from "@/lib/security";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MessagesPage() {
  const { conversations, clients, sendMessage, markRead, events } = useApp();
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileChat, setMobileChat] = useState(false);

  const filtered = useMemo(
    () =>
      conversations.filter((c) =>
        c.clientName.toLowerCase().includes(query.toLowerCase())
      ),
    [conversations, query]
  );

  const active = conversations.find((c) => c.id === activeId);
  const activeClient = clients.find((c) => c.id === active?.clientId);
  const nextSession = events
    .filter((e) => e.clientId === active?.clientId && e.date >= "2026-06-17")
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0];

  const select = (id: string) => {
    setActiveId(id);
    markRead(id);
    setMobileChat(true);
  };

  const send = () => {
    if (!draft.trim() || !active) return;
    sendMessage(active.id, draft.trim());
    setDraft("");
  };

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 text-xl font-extrabold tracking-tight text-foreground">Messages</h2>

      <Card className="grid h-[calc(100dvh-220px)] min-h-[480px] grid-cols-1 overflow-hidden [&>*]:min-w-0 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px]">
        {/* Conversation list */}
        <div className={cn("flex flex-col border-r border-border", mobileChat && "hidden md:flex")}>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none"
              />
            </div>
          </div>
          <div className="thin-scrollbar flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => select(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border/60 p-3 text-left transition-colors hover:bg-white/[0.03]",
                    c.id === activeId && "bg-white/[0.04]"
                  )}
                >
                  <Avatar name={c.clientName} seed={c.clientAvatar} size={42} ring />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{c.clientName}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{last?.time}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{last?.text}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat */}
        <div className={cn("flex flex-col", !mobileChat && "hidden md:flex")}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <button onClick={() => setMobileChat(false)} className="md:hidden" aria-label="Back">
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <Avatar name={active.clientName} seed={active.clientAvatar} size={38} ring />
                <div>
                  <p className="text-sm font-bold text-foreground">{active.clientName}</p>
                  <p className="text-xs text-success">● Online</p>
                </div>
              </div>

              <div className="thin-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex", m.from === "creator" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        m.from === "creator"
                          ? "rounded-br-sm bg-brand-gradient text-white"
                          : "rounded-bl-sm bg-secondary text-foreground"
                      )}
                    >
                      <p>{m.text}</p>
                      <p className={cn("mt-0.5 text-[10px]", m.from === "creator" ? "text-white/70" : "text-muted-foreground")}>
                        {m.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  maxLength={LIMITS.textarea}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none"
                />
                <Button size="icon" onClick={send} aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>

        {/* Client info */}
        <div className="hidden flex-col border-l border-border p-4 xl:flex">
          {activeClient ? (
            <>
              <div className="flex flex-col items-center text-center">
                <Avatar name={activeClient.name} seed={activeClient.avatarSeed} size={64} ring />
                <p className="mt-2 font-bold text-foreground">{activeClient.name}</p>
                <p className="text-xs text-muted-foreground">{activeClient.handle}</p>
                <Badge variant="primary" className="mt-2">{activeClient.goal}</Badge>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Current package</p>
                  <p className="text-sm font-bold text-foreground">{activeClient.package ?? "None"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Next session</p>
                  <p className="text-sm font-bold text-foreground">
                    {nextSession ? `${nextSession.date} · ${nextSession.time}` : "Not scheduled"}
                  </p>
                </div>
              </div>

              <Link
                href={`/dashboard/clients/${activeClient.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")}
              >
                View Full Profile
              </Link>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick actions</p>
                <Link href="/dashboard/diet-planner" className={cn(buttonVariants({ variant: "subtle", size: "sm" }), "w-full justify-start")}>
                  <Apple className="h-4 w-4" /> Assign Diet Plan
                </Link>
                <Link href="/dashboard/workout-builder" className={cn(buttonVariants({ variant: "subtle", size: "sm" }), "w-full justify-start")}>
                  <Dumbbell className="h-4 w-4" /> Assign Workout
                </Link>
                <Link href="/dashboard/calendar" className={cn(buttonVariants({ variant: "subtle", size: "sm" }), "w-full justify-start")}>
                  <CalendarPlus className="h-4 w-4" /> Book Session
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No client selected</p>
          )}
        </div>
      </Card>
    </div>
  );
}
