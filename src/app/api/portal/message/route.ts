import { NextResponse } from "next/server";
import { guard } from "@/lib/rate-limit";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * A signed-in client sends a message to their coach. Persists via service-role
 * so it works without client-side RLS insert policies, and creates the thread
 * (owned by the coach) on first message. Keyed to the authenticated client's
 * own email — they can only message their own coach.
 */
export async function POST(req: Request) {
  const limited = guard(req, { name: "portal-message", max: 20, windowMs: 60_000 });
  if (limited) return limited;

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const text = String(body.text ?? "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "Empty message." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("clients")
      .select("id, name, avatar_seed, creator_id")
      .ilike("email", user.email)
      .limit(1);
    const client = rows?.[0];
    if (!client) return NextResponse.json({ error: "No coach linked to this account." }, { status: 404 });

    // Find-or-create the thread by client_id. The DB generates the conversation
    // id (works whether the id column is uuid or text — never construct it).
    const { data: existing } = await admin
      .from("conversations")
      .select("id, unread")
      .eq("client_id", client.id)
      .limit(1)
      .maybeSingle();

    let convId: string;
    if (existing) {
      convId = existing.id as string;
      await admin
        .from("conversations")
        .update({ unread: ((existing.unread as number) ?? 0) + 1 })
        .eq("id", convId);
    } else {
      const { data: created, error: convErr } = await admin
        .from("conversations")
        .insert({
          creator_id: client.creator_id,
          client_id: client.id,
          client_name: client.name,
          client_avatar: client.avatar_seed ?? "",
          unread: 1,
        })
        .select("id")
        .single();
      if (convErr || !created) {
        return NextResponse.json(
          { error: convErr?.message ?? "Couldn't open the thread." },
          { status: 500 }
        );
      }
      convId = created.id as string;
    }

    const { error } = await admin.from("messages").insert({
      conversation_id: convId,
      sender: "client",
      text,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't send message." },
      { status: 500 }
    );
  }
}
