"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { useApp } from "@/lib/store";
import { creator as seedCreator } from "@/lib/mock-data";
import { clientConversation } from "@/lib/portal";
import { LIMITS } from "@/lib/security";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PortalMessages() {
  const {
    clientUser,
    conversations,
    user,
    sendMessage,
    createConversation,
    coach: portalCoach,
  } = useApp();
  const { toast } = useToast();
  const coach = portalCoach ?? user ?? seedCreator;
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const conv = clientUser
    ? clientConversation(conversations, clientUser)
    : undefined;
  const messages = conv?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  if (!clientUser) return null;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const id = conv?.id ?? createConversation(clientUser);
    sendMessage(id, text, "client");
    setDraft("");
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h2 className="mb-4 text-xl font-extrabold tracking-tight text-foreground">
        Messages
      </h2>

      <Card className="flex h-[calc(100dvh-220px)] min-h-[440px] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Avatar name={coach.name} seed={coach.avatarSeed} size={40} ring />
          <div>
            <p className="text-sm font-bold text-foreground">{coach.name}</p>
            <p className="text-xs text-success">● Usually replies within a day</p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="thin-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="m-auto max-w-xs text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                Start the conversation
              </p>
              <p className="mt-1">
                Ask {coach.name.split(" ")[0]} a question about your plan, form, or
                progress.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.from === "client";
              return (
                <div
                  key={m.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                      mine
                        ? "rounded-br-sm bg-brand-gradient text-white"
                        : "rounded-bl-sm bg-secondary text-foreground"
                    )}
                  >
                    <p>{m.text}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-[10px]",
                        mine ? "text-white/70" : "text-muted-foreground"
                      )}
                    >
                      {m.time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2 border-t border-border p-3">
          <button
            aria-label="Emoji"
            onClick={() => toast("Emoji picker (demo).", { variant: "info" })}
            className="text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            aria-label="Attach"
            onClick={() => toast("Attachments (demo).", { variant: "info" })}
            className="text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            value={draft}
            maxLength={LIMITS.textarea}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message ${coach.name.split(" ")[0]}...`}
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none"
          />
          <Button size="icon" onClick={send} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
