import type { MealPlan } from "@/lib/types";
import { uid } from "@/lib/utils";

// Server-only. Calls the Anthropic Messages API (no SDK) and returns a
// structured meal plan that conforms to the app's MealPlan type.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

export function aiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface DietInput {
  goal: string;
  calories: number;
  dietType: string[];
  days: number;
  notes?: string;
}

// Shape Claude returns via the tool (ids are added server-side afterwards).
interface AiFood {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
interface AiMeal {
  slot: string;
  name: string;
  items: AiFood[];
}
interface AiDay {
  label: string;
  meals: AiMeal[];
}
interface AiPlan {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  days: AiDay[];
}

const planTool = {
  name: "create_meal_plan",
  description:
    "Return a complete, macro-balanced fitness meal plan as structured data.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Short descriptive plan name." },
      protein: { type: "number", description: "Protein as a % of daily calories (0-100)." },
      carbs: { type: "number", description: "Carbs as a % of daily calories (0-100)." },
      fat: { type: "number", description: "Fat as a % of daily calories (0-100)." },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "e.g. 'Day 1'." },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slot: { type: "string", description: "Breakfast, Lunch, Dinner, Snack, etc." },
                  name: { type: "string", description: "Name of the meal." },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        portion: { type: "string", description: "e.g. '150g' or '1 cup'." },
                        calories: { type: "number" },
                        protein: { type: "number", description: "grams" },
                        carbs: { type: "number", description: "grams" },
                        fat: { type: "number", description: "grams" },
                      },
                      required: ["name", "portion", "calories", "protein", "carbs", "fat"],
                    },
                  },
                },
                required: ["slot", "name", "items"],
              },
            },
          },
          required: ["label", "meals"],
        },
      },
    },
    required: ["name", "protein", "carbs", "fat", "days"],
  },
} as const;

const num = (v: unknown, fallback = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
};

export async function generateDietPlan(input: DietInput): Promise<MealPlan> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AI is not configured.");

  const days = Math.max(1, Math.min(14, input.days || 7));
  const diet = input.dietType.length ? input.dietType.join(", ") : "Standard";

  const prompt = [
    `Create a ${days}-day meal plan for a fitness client.`,
    `Goal: ${input.goal}.`,
    `Daily calorie target: ~${input.calories} kcal.`,
    `Diet type / restrictions: ${diet}.`,
    input.notes ? `Additional notes & allergies: ${input.notes}` : "",
    "",
    "Requirements:",
    `- Provide all ${days} days. Each day should have 3-5 meals (breakfast, lunch, dinner, optional snacks).`,
    "- Use real, common foods with realistic portions and accurate per-item macros in grams.",
    `- Each day's food items should sum to roughly the daily calorie target (~${input.calories} kcal).`,
    "- Vary meals across days; do not repeat the exact same day.",
    "- Respect the diet type and any allergies strictly.",
    "Return the plan using the create_meal_plan tool only.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      tools: [planTool],
      tool_choice: { type: "tool", name: "create_meal_plan" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}). ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; input?: unknown }>;
  };
  const toolUse = (data.content ?? []).find((b) => b.type === "tool_use");
  if (!toolUse?.input) throw new Error("AI did not return a plan. Please try again.");
  const out = toolUse.input as AiPlan;

  const plan: MealPlan = {
    id: uid("plan"),
    name: out.name?.trim() || `${input.goal} plan`,
    calorieTarget: input.calories,
    protein: num(out.protein, 30),
    carbs: num(out.carbs, 40),
    fat: num(out.fat, 30),
    dietType: input.dietType.length ? input.dietType : ["Standard"],
    days: (out.days ?? []).slice(0, days).map((d, i) => ({
      id: uid("day"),
      label: d.label?.trim() || `Day ${i + 1}`,
      meals: (d.meals ?? []).map((m) => ({
        id: uid("meal"),
        slot: m.slot?.trim() || "Meal",
        name: m.name?.trim() || m.slot?.trim() || "Meal",
        items: (m.items ?? []).map((it) => ({
          id: uid("food"),
          name: it.name?.trim() || "Item",
          portion: it.portion?.trim() || "",
          calories: num(it.calories),
          protein: num(it.protein),
          carbs: num(it.carbs),
          fat: num(it.fat),
        })),
      })),
    })),
    updatedAt: new Date().toISOString(),
  };

  if (plan.days.length === 0) throw new Error("AI returned an empty plan. Please try again.");
  return plan;
}
