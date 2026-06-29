import { NextResponse } from "next/server";
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

    const convId = `conv_${client.id as string}`;

    // Ensure the thread exists (owned by the coach).
    const { data: existing } = await admin
      .from("conversations")
      .select("id, unread")
      .eq("id", convId)
      .maybeSingle();
    if (!existing) {
      await admin.from("conversations").insert({
        id: convId,
        creator_id: client.creator_id,
        client_id: client.id,
        client_name: client.name,
        client_avatar: client.avatar_seed ?? "",
        unread: 1,
      });
    } else {
      await admin
        .from("conversations")
        .update({ unread: ((existing.unread as number) ?? 0) + 1 })
        .eq("id", convId);
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
