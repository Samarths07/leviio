import { NextResponse } from "next/server";
import { guard, DEFAULT_LIMIT } from "@/lib/rate-limit";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  rowToClient,
  rowToOrder,
  rowToMealPlan,
  rowToProgram,
  rowToEvent,
} from "@/lib/supabase/db";
import type { Conversation, Message } from "@/lib/types";

export const runtime = "nodejs";

function shortTime(iso?: string): string {
  if (!iso) return "now";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "now";
  }
}

/**
 * One service-role call that returns EVERYTHING the signed-in client's portal
 * needs — their record, coach, orders, assigned meal plan + program, sessions,
 * and message threads. Using service-role means the portal works even if the
 * client-side RLS policies aren't present, so assigned plans/sessions/messages
 * always show. Keyed strictly to the authenticated user's own email.
 */
export async function GET(req: Request) {
  const limited = guard(req, { name: "portal-me", ...DEFAULT_LIMIT });
  if (limited) return limited;

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ client: null }, { status: 200 });

  try {
    const admin = createAdminClient();
    const email = user.email;

    const { data: clientRows } = await admin
      .from("clients")
      .select("*")
      .ilike("email", email)
      .limit(1);
    const clientRow = clientRows?.[0];

    // Orders (also resolves the coach for non-managed buyers).
    const { data: orderRows } = await admin
      .from("orders")
      .select("*")
      .ilike("client_email", email);
    const orders = (orderRows ?? []).map(rowToOrder);

    if (!clientRow) {
      // Storefront buyer with no managed record — still return their orders.
      const coachId = orderRows?.[0]?.creator_id ?? null;
      return NextResponse.json({ client: null, coachId, orders });
    }

    const client = rowToClient(clientRow);
    const coachId = clientRow.creator_id as string;

    // Assigned meal plan + program.
    let mealPlan = null;
    if (client.mealPlanId) {
      const { data } = await admin.from("meal_plans").select("*").eq("id", client.mealPlanId).maybeSingle();
      if (data) mealPlan = rowToMealPlan(data);
    }
    let program = null;
    if (client.programId) {
      const { data } = await admin.from("workout_programs").select("*").eq("id", client.programId).maybeSingle();
      if (data) program = rowToProgram(data);
    }

    // Sessions booked for this client.
    // Sanitize the name before interpolating into the PostgREST filter string
    // (strip the chars that could alter the .or() expression).
    const safeName = client.name.replace(/[,()*]/g, " ").trim();
    const { data: eventRows } = await admin
      .from("calendar_events")
      .select("*")
      .eq("creator_id", coachId)
      .or(`client_id.eq.${client.id},client_name.ilike.${safeName}`);
    const events = (eventRows ?? []).map(rowToEvent);

    // Message thread(s) for this client + their messages.
    const { data: convoRows } = await admin
      .from("conversations")
      .select("*")
      .eq("client_id", client.id);
    let conversations: Conversation[] = [];
    if (convoRows && convoRows.length) {
      const ids = convoRows.map((c) => c.id as string);
      const { data: msgRows } = await admin
        .from("messages")
        .select("*")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true });
      const byConvo = new Map<string, Message[]>();
      for (const m of msgRows ?? []) {
        const list = byConvo.get(m.conversation_id as string) ?? [];
        list.push({
          id: m.id as string,
          from: m.sender as Message["from"],
          text: m.text as string,
          time: shortTime(m.created_at as string),
        });
        byConvo.set(m.conversation_id as string, list);
      }
      conversations = convoRows.map((c) => ({
        id: c.id as string,
        clientId: (c.client_id as string) ?? "",
        clientName: (c.client_name as string) ?? "",
        clientAvatar: (c.client_avatar as string) ?? "",
        unread: (c.unread as number) ?? 0,
        messages: byConvo.get(c.id as string) ?? [],
      }));
    }

    return NextResponse.json({
      client,
      coachId,
      orders,
      mealPlan,
      program,
      events,
      conversations,
    });
  } catch {
    return NextResponse.json({ client: null });
  }
}
