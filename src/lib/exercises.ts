import type { Exercise, MuscleGroup } from "./types";

const raw: Record<MuscleGroup, [string, string, Exercise["difficulty"]][]> = {
  Chest: [
    ["Barbell Bench Press", "Barbell", "Intermediate"],
    ["Incline Dumbbell Press", "Dumbbells", "Intermediate"],
    ["Cable Flyes", "Cable", "Beginner"],
    ["Push-ups", "Bodyweight", "Beginner"],
    ["Dips", "Bodyweight", "Intermediate"],
    ["Machine Chest Press", "Machine", "Beginner"],
    ["Decline Bench Press", "Barbell", "Advanced"],
    ["Dumbbell Pullover", "Dumbbells", "Intermediate"],
    ["Pec Deck", "Machine", "Beginner"],
    ["Svend Press", "Plate", "Beginner"],
  ],
  Back: [
    ["Pull-ups", "Bodyweight", "Advanced"],
    ["Lat Pulldown", "Cable", "Beginner"],
    ["Seated Cable Row", "Cable", "Beginner"],
    ["Deadlift", "Barbell", "Advanced"],
    ["Face Pulls", "Cable", "Beginner"],
    ["Bent-Over Barbell Row", "Barbell", "Intermediate"],
    ["Single-Arm Dumbbell Row", "Dumbbells", "Beginner"],
    ["T-Bar Row", "Barbell", "Intermediate"],
    ["Chin-ups", "Bodyweight", "Intermediate"],
    ["Straight-Arm Pulldown", "Cable", "Beginner"],
  ],
  Shoulders: [
    ["Overhead Press", "Barbell", "Intermediate"],
    ["Lateral Raises", "Dumbbells", "Beginner"],
    ["Front Raises", "Dumbbells", "Beginner"],
    ["Arnold Press", "Dumbbells", "Intermediate"],
    ["Rear Delt Flyes", "Dumbbells", "Beginner"],
    ["Seated DB Shoulder Press", "Dumbbells", "Beginner"],
    ["Cable Lateral Raise", "Cable", "Intermediate"],
    ["Upright Row", "Barbell", "Intermediate"],
    ["Shrugs", "Dumbbells", "Beginner"],
    ["Machine Shoulder Press", "Machine", "Beginner"],
    ["Cable Rear Delt Fly", "Cable", "Intermediate"],
  ],
  Legs: [
    ["Back Squat", "Barbell", "Intermediate"],
    ["Leg Press", "Machine", "Beginner"],
    ["Romanian Deadlift", "Barbell", "Intermediate"],
    ["Leg Curls", "Machine", "Beginner"],
    ["Calf Raises", "Machine", "Beginner"],
    ["Walking Lunges", "Dumbbells", "Beginner"],
    ["Bulgarian Split Squat", "Dumbbells", "Advanced"],
    ["Leg Extensions", "Machine", "Beginner"],
    ["Goblet Squat", "Dumbbells", "Beginner"],
    ["Hip Thrust", "Barbell", "Intermediate"],
    ["Hack Squat", "Machine", "Intermediate"],
  ],
  Arms: [
    ["Barbell Curl", "Barbell", "Beginner"],
    ["Hammer Curl", "Dumbbells", "Beginner"],
    ["Tricep Pushdown", "Cable", "Beginner"],
    ["Skull Crushers", "Barbell", "Intermediate"],
    ["Diamond Push-ups", "Bodyweight", "Intermediate"],
    ["Preacher Curl", "Barbell", "Intermediate"],
    ["Concentration Curl", "Dumbbells", "Beginner"],
    ["Overhead Tricep Extension", "Dumbbells", "Beginner"],
    ["Cable Curl", "Cable", "Beginner"],
    ["Close-Grip Bench Press", "Barbell", "Intermediate"],
  ],
  Core: [
    ["Plank", "Bodyweight", "Beginner"],
    ["Crunches", "Bodyweight", "Beginner"],
    ["Russian Twists", "Bodyweight", "Beginner"],
    ["Hanging Leg Raises", "Bodyweight", "Advanced"],
    ["Cable Crunches", "Cable", "Intermediate"],
    ["Bicycle Crunches", "Bodyweight", "Beginner"],
    ["Mountain Climbers", "Bodyweight", "Beginner"],
    ["Ab Wheel Rollout", "Equipment", "Advanced"],
    ["Dead Bug", "Bodyweight", "Beginner"],
    ["Side Plank", "Bodyweight", "Beginner"],
  ],
  Cardio: [
    ["Treadmill Run", "Machine", "Beginner"],
    ["Cycling", "Machine", "Beginner"],
    ["Jump Rope", "Equipment", "Beginner"],
    ["Stair Climber", "Machine", "Intermediate"],
    ["HIIT Intervals", "Bodyweight", "Advanced"],
    ["Rowing Machine", "Machine", "Intermediate"],
    ["Elliptical", "Machine", "Beginner"],
    ["Box Jumps", "Equipment", "Intermediate"],
    ["Assault Bike", "Machine", "Advanced"],
    ["Sled Push", "Equipment", "Advanced"],
  ],
  "Full Body": [
    ["Kettlebell Swings", "Kettlebell", "Intermediate"],
    ["Burpees", "Bodyweight", "Intermediate"],
    ["Clean & Press", "Barbell", "Advanced"],
    ["Thrusters", "Barbell", "Advanced"],
    ["Turkish Get-up", "Kettlebell", "Advanced"],
    ["Farmer's Carry", "Dumbbells", "Beginner"],
    ["Wall Balls", "Equipment", "Intermediate"],
    ["Battle Ropes", "Equipment", "Intermediate"],
    ["Man Makers", "Dumbbells", "Advanced"],
    ["Devil Press", "Dumbbells", "Advanced"],
  ],
};

const descByMuscle: Record<MuscleGroup, string> = {
  Chest: "Builds pressing strength and chest hypertrophy.",
  Back: "Develops a wide, thick, strong back.",
  Shoulders: "Builds rounded, capped delts and overhead strength.",
  Legs: "Drives lower-body strength and size.",
  Arms: "Isolates the biceps and triceps for growth.",
  Core: "Strengthens the abs and stabilizers.",
  Cardio: "Improves conditioning and burns calories.",
  "Full Body": "Explosive, compound, full-body movement.",
};

export const exercises: Exercise[] = Object.entries(raw).flatMap(
  ([muscle, list]) =>
    list.map(([name, equipment, difficulty], i) => ({
      id: `ex_${muscle.toLowerCase().replace(/\s/g, "")}_${i}`,
      name,
      muscle: muscle as MuscleGroup,
      equipment,
      difficulty,
      description: descByMuscle[muscle as MuscleGroup],
    }))
);

export const muscleGroups: MuscleGroup[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Arms",
  "Core",
  "Cardio",
  "Full Body",
];

export function findExercise(name: string): Exercise | undefined {
  return exercises.find((e) => e.name === name);
}
