import type {
  Exercise,
  ProgramExercise,
  TrainingDay,
  WorkoutProgram,
  WorkoutWeek,
} from "./types";
import { uid } from "./utils";

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const GOALS = [
  "Fat Loss",
  "Muscle Building",
  "Endurance",
  "Strength",
  "General Fitness",
];

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export const EQUIPMENT = ["Full Gym", "Dumbbells Only", "Bodyweight", "Home Gym"];

export function emptyWeek(week: number): WorkoutWeek {
  return { week, days: [] };
}

export function newProgram(weeks = 8): WorkoutProgram {
  return {
    id: uid("prog"),
    name: "",
    goal: "Muscle Building",
    weeks,
    daysPerWeek: 3,
    difficulty: "Intermediate",
    equipment: "Full Gym",
    schedule: Array.from({ length: weeks }).map((_, i) => emptyWeek(i + 1)),
    updatedAt: new Date().toISOString(),
  };
}

export function exerciseToProgram(ex: Exercise): ProgramExercise {
  return {
    id: uid("pe"),
    name: ex.name,
    muscle: ex.muscle,
    sets: 3,
    reps: "10-12",
    rest: 60,
    notes: "",
  };
}

export function newTrainingDay(day: string): TrainingDay {
  return {
    id: uid("td"),
    day,
    label: `${day} Workout`,
    muscles: [],
    exercises: [],
  };
}
