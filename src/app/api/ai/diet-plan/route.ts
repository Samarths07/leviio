import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { aiConfigured, generateDietPlan } from "@/lib/ai/generate-diet";
import { guard } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generate a meal plan with AI. Creator-authenticated. */
export async function POST(req: Request) {
  const limited = guard(req, { name: "ai-diet", max: 10, windowMs: 60_000 });
  if (limited) return limited;

  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "AI isn't configured. Add ANTHROPIC_API_KEY to enable it." },
      { status: 503 }
    );
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const goal = String(body.goal ?? "General fitness").slice(0, 80);
  const calories = Math.max(800, Math.min(6000, Number(body.calories) || 2000));
  const dietType = Array.isArray(body.dietType)
    ? body.dietType.map((d) => String(d)).slice(0, 6)
    : [];
  const days = Math.max(1, Math.min(14, Number(body.days) || 7));
  const notes = String(body.notes ?? "").slice(0, 400);

  try {
    const plan = await generateDietPlan({ goal, calories, dietType, days, notes });
    return NextResponse.json({ plan });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}
