"use client";

// Tracks which coach messages a client has already seen (per client, in
// localStorage) so the portal can show an unread badge. The conversation's
// `unread` column is the creator's counter, so the client side needs its own.

import type { Conversation } from "./types";

export const PORTAL_READ_EVENT = "leviio:portal-read";

const key = (clientId: string) => `leviio_portal_seen_${clientId}`;

/** Number of messages sent by the coach in this thread. */
export function coachMessageCount(conv?: Conversation | null): number {
  if (!conv) return 0;
  return conv.messages.filter((m) => m.from === "creator").length;
}

function seen(clientId: string): number {
  try {
    return Number(localStorage.getItem(key(clientId)) ?? "0") || 0;
  } catch {
    return 0;
  }
}

/** Unseen coach messages for the client. */
export function unreadCoachMessages(clientId: string, conv?: Conversation | null): number {
  return Math.max(0, coachMessageCount(conv) - seen(clientId));
}

/** Mark the thread read up to the current coach message count. */
export function markPortalMessagesRead(clientId: string, conv?: Conversation | null): void {
  try {
    localStorage.setItem(key(clientId), String(coachMessageCount(conv)));
    window.dispatchEvent(new Event(PORTAL_READ_EVENT));
  } catch {
    /* ignore */
  }
}
