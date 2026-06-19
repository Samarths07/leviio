import type { DietDay, Meal, MealPlan } from "./types";
import { uid } from "./utils";

export const MEAL_SLOTS = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Afternoon Snack",
  "Dinner",
];

export const DIET_TYPES = [
  "Standard",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Paleo",
  "Gluten-Free",
];

export function emptyMeal(slot: string): Meal {
  return { id: uid("meal"), slot, name: slot, items: [] };
}

export function emptyDay(label: string): DietDay {
  return {
    id: uid("day"),
    label,
    meals: MEAL_SLOTS.map(emptyMeal),
  };
}

export function newPlan(days = 7): MealPlan {
  return {
    id: uid("plan"),
    name: "",
    calorieTarget: 2000,
    protein: 30,
    carbs: 40,
    fat: 30,
    dietType: ["Standard"],
    days: Array.from({ length: days }).map((_, i) => emptyDay(`Day ${i + 1}`)),
    updatedAt: new Date().toISOString(),
  };
}

export function macroGrams(calories: number, p: number, c: number, f: number) {
  return {
    protein: Math.round((calories * (p / 100)) / 4),
    carbs: Math.round((calories * (c / 100)) / 4),
    fat: Math.round((calories * (f / 100)) / 9),
  };
}

export function mealTotals(meal: Meal) {
  return meal.items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      protein: acc.protein + i.protein,
      carbs: acc.carbs + i.carbs,
      fat: acc.fat + i.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function dayTotals(day: DietDay) {
  return day.meals.reduce(
    (acc, m) => {
      const t = mealTotals(m);
      return {
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
