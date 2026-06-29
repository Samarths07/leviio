import { exercises } from "./exercises";
import { seededRandom } from "./utils";
import type {
  CalendarEvent,
  Client,
  CoachingPackage,
  Conversation,
  Creator,
  DietDay,
  MealPlan,
  MealTemplate,
  Order,
  Plan,
  Product,
  RevenuePoint,
  SessionNote,
  TrainingDay,
  WorkoutProgram,
  WorkoutWeek,
} from "./types";

export const creator: Creator = {
  id: "creator_alisha",
  name: "Alisha Fernandez",
  email: "",
  username: "alishafits",
  niche: "Weight Loss & Toning",
  bio: "Helping busy women lose fat, build confidence, and feel strong. NASM-certified coach. 4,200+ transformations and counting. 🌱",
  location: "Los Angeles, CA",
  avatarSeed: "alisha-fernandez",
  bannerColor: "#7c3aed",
  followers: 4200,
  plan: "Pro",
  trial: true,
  socials: {
    instagram: "alishafits",
    youtube: "alishafits",
    tiktok: "alishafits",
    website: "alishafits.com",
  },
  isDemo: true,
};

// ---------------- Products ----------------
export const products: Product[] = [
  {
    id: "prod_shred",
    name: "12-Week Shred Program",
    type: "Digital",
    category: "Programs",
    description:
      "A complete 12-week fat-loss system with progressive workouts, follow-along videos, and a printable tracker.",
    price: 49,
    compareAt: 79,
    status: "Published",
    sales: 312,
    revenue: 15288,
    imageSeed: "shred-prog",
    tags: ["fat loss", "12-week", "video"],
    badge: "BESTSELLER",
    rating: 4.9,
    reviewCount: 284,
    fileType: "PDF + Video",
  },
  {
    id: "prod_meal",
    name: "Lean Muscle Meal Plan",
    type: "Digital",
    category: "Nutrition",
    description:
      "A 6-week high-protein meal plan engineered for lean muscle gains with grocery lists and prep guides.",
    price: 29,
    status: "Published",
    sales: 198,
    revenue: 5742,
    imageSeed: "meal-plan",
    tags: ["nutrition", "high-protein"],
    rating: 4.8,
    reviewCount: 142,
    fileType: "PDF",
  },
  {
    id: "prod_booty",
    name: "Booty Builder Guide",
    type: "Digital",
    category: "Programs",
    description:
      "8-week glute hypertrophy program with banded and barbell variations for the gym or home.",
    price: 39,
    status: "Published",
    sales: 256,
    revenue: 9984,
    imageSeed: "booty-guide",
    tags: ["glutes", "8-week"],
    badge: "BESTSELLER",
    rating: 4.9,
    reviewCount: 211,
    fileType: "PDF",
  },
  {
    id: "prod_macro",
    name: "Macro Masterclass",
    type: "Digital",
    category: "Nutrition",
    description:
      "A video course that demystifies macros, flexible dieting, and accurate tracking.",
    price: 59,
    compareAt: 89,
    status: "Published",
    sales: 87,
    revenue: 5133,
    imageSeed: "macro-class",
    tags: ["macros", "course"],
    rating: 4.7,
    reviewCount: 64,
    fileType: "Video Course",
  },
  {
    id: "prod_home",
    name: "30-Day Home Challenge",
    type: "Digital",
    category: "Programs",
    description:
      "No equipment, no excuses — 30 days of follow-along home workouts under 30 minutes.",
    price: 19,
    status: "Published",
    sales: 174,
    revenue: 3306,
    imageSeed: "home-challenge",
    tags: ["home", "30-day"],
    badge: "NEW",
    rating: 4.6,
    reviewCount: 96,
    fileType: "PDF",
  },
  {
    id: "prod_glute_bible",
    name: "Glute Activation Bible",
    type: "Digital",
    category: "Programs",
    description:
      "The complete library of glute activation circuits and warm-ups to fix dormant glutes.",
    price: 27,
    status: "Published",
    sales: 132,
    revenue: 3564,
    imageSeed: "glute-bible",
    tags: ["glutes", "activation"],
    rating: 4.8,
    reviewCount: 71,
    fileType: "PDF",
  },
  {
    id: "prod_bands",
    name: "Leviio Resistance Band Set",
    type: "Physical",
    category: "Merch",
    description:
      "5-piece fabric resistance band set with carry pouch. Non-slip, roll-resistant.",
    price: 35,
    status: "Published",
    sales: 89,
    revenue: 3115,
    imageSeed: "bands-set",
    tags: ["equipment"],
    rating: 4.8,
    reviewCount: 53,
    weight: "0.6kg",
    sku: "FP-BANDS-01",
    stock: 142,
  },
  {
    id: "prod_shaker",
    name: "Signature Shaker Bottle",
    type: "Physical",
    category: "Merch",
    description:
      "28oz leak-proof shaker with stainless mixing ball and soft-touch matte finish.",
    price: 25,
    status: "Published",
    sales: 64,
    revenue: 1600,
    imageSeed: "shaker-bottle",
    tags: ["merch"],
    rating: 4.6,
    reviewCount: 38,
    weight: "0.3kg",
    sku: "FP-SHKR-01",
    stock: 210,
  },
  {
    id: "prod_leggings",
    name: "Compression Leggings",
    type: "Physical",
    category: "Merch",
    description:
      "High-waisted, squat-proof compression leggings with hidden pocket. Buttery 4-way stretch.",
    price: 55,
    status: "Draft",
    sales: 0,
    revenue: 0,
    imageSeed: "leggings",
    tags: ["apparel"],
    badge: "NEW",
    rating: 0,
    reviewCount: 0,
    weight: "0.4kg",
    sku: "FP-LEG-01",
    stock: 60,
  },
  {
    id: "prod_coaching",
    name: "1-on-1 Monthly Coaching",
    type: "Service",
    category: "Coaching",
    description:
      "Fully personalized monthly coaching with custom plans, weekly check-ins, and unlimited support.",
    price: 199,
    status: "Published",
    sales: 38,
    revenue: 7562,
    imageSeed: "coaching-1on1",
    tags: ["coaching", "monthly"],
    recurring: true,
    badge: "BESTSELLER",
    rating: 5.0,
    reviewCount: 41,
    duration: 60,
    maxClients: 1,
    deliveryMethod: "Video call",
  },
  {
    id: "prod_custom_meal",
    name: "Custom Meal Plan",
    type: "Service",
    category: "Coaching",
    description:
      "A one-time consult delivering a fully personalized meal plan tailored to your goals.",
    price: 89,
    status: "Published",
    sales: 52,
    revenue: 4628,
    imageSeed: "custom-meal",
    tags: ["nutrition", "custom"],
    rating: 4.9,
    reviewCount: 33,
    duration: 45,
    maxClients: 1,
    deliveryMethod: "Video call",
  },
  {
    id: "prod_strategy",
    name: "60-Min Strategy Call",
    type: "Service",
    category: "Coaching",
    description:
      "A focused 60-minute call to audit and fix your fitness plan with a clear action roadmap.",
    price: 75,
    status: "Published",
    sales: 47,
    revenue: 3525,
    imageSeed: "strategy-call",
    tags: ["consult"],
    rating: 4.8,
    reviewCount: 29,
    duration: 60,
    maxClients: 1,
    deliveryMethod: "Video call",
  },
];

// ---------------- Clients ----------------
const clientNames = [
  "Jessica Moore",
  "Marcus Tate",
  "Priya Kapoor",
  "Daniel Reyes",
  "Sofia Lindqvist",
  "Tyler Brooks",
  "Hannah Wright",
  "Derek Owens",
  "Mia Castellano",
  "Jordan Blake",
  "Sara Nilsson",
  "Aaron Patel",
  "Emma Bennett",
  "Liam Carter",
  "Olivia Diaz",
];
const goals: Client["goal"][] = [
  "Weight Loss",
  "Muscle Gain",
  "Maintain",
  "Athletic Performance",
];
const cities = ["Los Angeles, CA", "Austin, TX", "Denver, CO", "Miami, FL", "Seattle, WA", "Chicago, IL"];

function makeClient(i: number): Client {
  const rand = seededRandom(i * 97 + 13);
  const name = clientNames[i];
  const goal = goals[i % goals.length];
  const status: Client["status"] =
    i % 7 === 0 ? "VIP" : i % 5 === 0 ? "Inactive" : "Active";
  const weeksTotal = [8, 12, 16][i % 3];
  const weeksCompleted = Math.min(
    weeksTotal,
    Math.floor(rand() * weeksTotal) + 1
  );
  const startWeight = 60 + Math.floor(rand() * 40);
  const lost = goal === "Weight Loss" ? rand() * 8 + 2 : -(rand() * 4);
  const currentWeight = +(startWeight - lost).toFixed(1);
  const startDate = new Date(2026, 0, 1 + i * 9).toISOString();

  const weighIns = Array.from({ length: Math.max(weeksCompleted, 4) }).map(
    (_, w) => ({
      week: `W${w + 1}`,
      weight: +(
        startWeight -
        (lost * (w + 1)) / Math.max(weeksCompleted, 4) +
        (rand() - 0.5)
      ).toFixed(1),
    })
  );

  const measurements = Array.from({ length: 3 }).map((_, m) => ({
    date: new Date(2026, 1 + m, 5).toISOString(),
    waist: +(80 - m * 1.5 + rand() * 2).toFixed(1),
    hips: +(98 - m * 1.2 + rand() * 2).toFixed(1),
    chest: +(92 - m * 0.8 + rand() * 2).toFixed(1),
    arms: +(30 + m * 0.3 + rand()).toFixed(1),
    thighs: +(58 - m * 0.7 + rand()).toFixed(1),
  }));

  const sessions = Array.from({ length: 4 }).map((_, s) => ({
    id: `sess_${i}_${s}`,
    date: new Date(2026, 4 + (s > 1 ? 1 : 0), 6 + s * 5, 10 + s).toISOString(),
    type: ["1-on-1 Coaching", "Check-in Call", "Consultation"][s % 3],
    duration: [45, 60, 30][s % 3],
    notes:
      "Great session. Reviewed progress, adjusted training volume, and set goals for next week.",
    completed: s < 2,
  }));

  const payments = Array.from({ length: 3 }).map((_, p) => ({
    id: `pay_${i}_${p}`,
    date: new Date(2026, 2 + p, 12).toISOString(),
    product: ["1-on-1 Monthly Coaching", "12-Week Shred Program", "Custom Meal Plan"][p % 3],
    amount: [199, 49, 89][p % 3],
    status: "Paid" as const,
    method: "Visa •• 4242",
  }));

  return {
    id: `client_${i}`,
    name,
    handle: "@" + name.toLowerCase().replace(/\s/g, ""),
    email: name.toLowerCase().replace(/\s/g, ".") + "@email.com",
    phone: `+1 (555) ${100 + i}-${1000 + i * 7}`,
    age: 24 + (i % 20),
    location: cities[i % cities.length],
    goal,
    status,
    avatarSeed: name,
    startDate,
    weeksTotal,
    weeksCompleted,
    height: 160 + (i % 25),
    startWeight,
    currentWeight,
    bodyFat: +(18 + rand() * 12).toFixed(1),
    notes:
      "Motivated and consistent. Prefers morning workouts. Slight knee sensitivity — avoid deep lunges.",
    package: i % 3 === 0 ? "Premium Coaching" : i % 3 === 1 ? "Basic Coaching" : undefined,
    activePlans: 1 + (i % 3),
    weighIns,
    measurements,
    sessions,
    payments,
  };
}

export const clients: Client[] = Array.from({ length: 15 }).map((_, i) =>
  makeClient(i)
);

// ---------------- Coaching ----------------
export const coachingPackages: CoachingPackage[] = [
  {
    id: "pkg_basic",
    name: "Basic Coaching",
    sessions: 4,
    price: 199,
    description: "4 monthly coaching sessions with training adjustments and chat support.",
  },
  {
    id: "pkg_premium",
    name: "Premium Coaching",
    sessions: 8,
    price: 349,
    description: "8 sessions with weekly check-ins, custom training, and accountability.",
    popular: true,
  },
  {
    id: "pkg_elite",
    name: "Elite Coaching",
    sessions: 16,
    price: 599,
    description: "16 sessions plus a custom meal plan and priority 24h support.",
    includesMealPlan: true,
  },
];

export const sessionNotes: SessionNote[] = clients.slice(0, 6).map((c, i) => ({
  id: `note_${i}`,
  clientId: c.id,
  clientName: c.name,
  clientAvatar: c.avatarSeed,
  date: new Date(2026, 5, 16 - i).toISOString(),
  note:
    [
      "Hit a new squat PR today! Energy is much higher since adjusting carbs. Keep current plan.",
      "Struggled with adherence over the weekend. Set up a simpler meal prep routine for next week.",
      "Down 1.2kg this week. Sleeping better. Added an extra cardio session per their request.",
      "Reviewed form on deadlifts — much improved. Increasing load by 5% next week.",
      "Feeling unmotivated. Scheduled a mid-week check-in call for accountability.",
      "Measurements show waist down 2cm. Client thrilled. Maintaining current deficit.",
    ][i],
}));

// ---------------- Diet plans ----------------
function makeMeal(slot: string, name: string, items: [string, string, number, number, number, number][]) {
  return {
    id: `meal_${slot}_${Math.random().toString(36).slice(2, 6)}`,
    slot,
    name,
    items: items.map(([n, portion, cal, p, c, f], i) => ({
      id: `food_${slot}_${i}_${Math.random().toString(36).slice(2, 5)}`,
      name: n,
      portion,
      calories: cal,
      protein: p,
      carbs: c,
      fat: f,
    })),
  };
}

function makeDietDay(label: string): DietDay {
  return {
    id: `day_${label}_${Math.random().toString(36).slice(2, 6)}`,
    label,
    meals: [
      makeMeal("Breakfast", "Protein Oats", [
        ["Rolled oats", "60g", 228, 8, 40, 4],
        ["Whey protein", "30g", 120, 24, 3, 2],
        ["Blueberries", "80g", 46, 1, 11, 0],
      ]),
      makeMeal("Morning Snack", "Greek Yogurt", [
        ["Greek yogurt", "170g", 100, 17, 6, 0],
        ["Almonds", "20g", 116, 4, 4, 10],
      ]),
      makeMeal("Lunch", "Chicken & Rice", [
        ["Chicken breast", "150g", 248, 46, 0, 5],
        ["Jasmine rice", "150g", 195, 4, 42, 1],
        ["Broccoli", "100g", 34, 3, 7, 0],
      ]),
      makeMeal("Afternoon Snack", "Rice Cakes", [
        ["Rice cakes", "2 pieces", 70, 1, 15, 0],
        ["Peanut butter", "16g", 94, 4, 3, 8],
      ]),
      makeMeal("Dinner", "Salmon & Potato", [
        ["Salmon fillet", "150g", 280, 39, 0, 13],
        ["Sweet potato", "150g", 129, 2, 30, 0],
        ["Asparagus", "100g", 20, 2, 4, 0],
      ]),
    ],
  };
}

const dayLabels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

export const mealPlans: MealPlan[] = [
  {
    id: "plan_cut",
    name: "Jessica's Cutting Plan",
    client: "Jessica Moore",
    calorieTarget: 1600,
    protein: 40,
    carbs: 35,
    fat: 25,
    dietType: ["Standard", "Gluten-Free"],
    days: dayLabels.map(makeDietDay),
    updatedAt: new Date(2026, 5, 10).toISOString(),
  },
  {
    id: "plan_bulk",
    name: "Marcus Lean Bulk",
    client: "Marcus Tate",
    calorieTarget: 2800,
    protein: 30,
    carbs: 45,
    fat: 25,
    dietType: ["Standard"],
    days: dayLabels.map(makeDietDay),
    updatedAt: new Date(2026, 5, 4).toISOString(),
  },
];

export const mealTemplates: MealTemplate[] = [
  { id: "tpl_cut", name: "Classic Cut", calorieTarget: 1600, protein: 40, carbs: 35, fat: 25, days: 7, goal: "Weight Loss", dietType: ["Standard"] },
  { id: "tpl_bulk", name: "Lean Bulk", calorieTarget: 2800, protein: 30, carbs: 45, fat: 25, days: 7, goal: "Muscle Building", dietType: ["Standard"] },
  { id: "tpl_keto", name: "Keto Starter", calorieTarget: 1800, protein: 30, carbs: 10, fat: 60, days: 7, goal: "Weight Loss", dietType: ["Keto"] },
  { id: "tpl_vegan", name: "Vegan Athlete", calorieTarget: 2200, protein: 30, carbs: 50, fat: 20, days: 7, goal: "Performance", dietType: ["Vegan"] },
  { id: "tpl_maint", name: "Maintenance", calorieTarget: 2000, protein: 30, carbs: 40, fat: 30, days: 7, goal: "Maintain", dietType: ["Standard"] },
];

// ---------------- Workout programs ----------------
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function pickExercises(muscle: string, count: number) {
  return exercises
    .filter((e) => e.muscle === muscle)
    .slice(0, count)
    .map((e, i) => ({
      id: `pe_${e.id}_${i}_${Math.random().toString(36).slice(2, 5)}`,
      name: e.name,
      muscle: e.muscle,
      sets: 4,
      reps: ["8-10", "10-12", "12-15"][i % 3],
      rest: [90, 60, 75][i % 3],
      notes: "",
    }));
}

function makeTrainingDay(day: string, label: string, muscles: any[], count = 4): TrainingDay {
  return {
    id: `td_${day}_${Math.random().toString(36).slice(2, 6)}`,
    day,
    label,
    muscles,
    exercises: muscles.flatMap((m) => pickExercises(m, count)).slice(0, 6),
  };
}

function makeWeek(week: number, split: { day: string; label: string; muscles: any[] }[]): WorkoutWeek {
  return {
    week,
    days: split.map((s) => makeTrainingDay(s.day, s.label, s.muscles)),
  };
}

const pplSplit = [
  { day: "Monday", label: "Push Day", muscles: ["Chest", "Shoulders"] },
  { day: "Wednesday", label: "Pull Day", muscles: ["Back", "Arms"] },
  { day: "Friday", label: "Leg Day", muscles: ["Legs", "Core"] },
];

const upperLowerSplit = [
  { day: "Monday", label: "Upper Body", muscles: ["Chest", "Back"] },
  { day: "Tuesday", label: "Lower Body", muscles: ["Legs"] },
  { day: "Thursday", label: "Upper Body", muscles: ["Shoulders", "Arms"] },
  { day: "Saturday", label: "Lower + Core", muscles: ["Legs", "Core"] },
];

export const workoutPrograms: WorkoutProgram[] = [
  {
    id: "prog_jessica",
    name: "Jessica's Fat-Loss Circuit",
    goal: "Weight Loss",
    weeks: 8,
    daysPerWeek: 3,
    difficulty: "Beginner",
    equipment: "Minimal / Home",
    client: "Jessica Moore",
    schedule: Array.from({ length: 8 }).map((_, w) => makeWeek(w + 1, pplSplit)),
    updatedAt: new Date(2026, 5, 9).toISOString(),
  },
  {
    id: "prog_ppl",
    name: "Push Pull Legs — Hypertrophy",
    goal: "Muscle Building",
    weeks: 8,
    daysPerWeek: 3,
    difficulty: "Intermediate",
    equipment: "Full Gym",
    client: "Marcus Tate",
    schedule: Array.from({ length: 8 }).map((_, w) => makeWeek(w + 1, pplSplit)),
    updatedAt: new Date(2026, 5, 8).toISOString(),
  },
  {
    id: "prog_ul",
    name: "Upper/Lower Strength",
    goal: "Strength",
    weeks: 8,
    daysPerWeek: 4,
    difficulty: "Advanced",
    equipment: "Full Gym",
    client: "Jordan Blake",
    schedule: Array.from({ length: 8 }).map((_, w) => makeWeek(w + 1, upperLowerSplit)),
    updatedAt: new Date(2026, 4, 30).toISOString(),
  },
];

// ---------------- Calendar events ----------------
const eventColors: Record<string, string> = {
  "Coaching Session": "#7c3aed",
  "Check-in Call": "#3b82f6",
  "Product Launch": "#f59e0b",
  "Rest Day": "#71717a",
  Consultation: "#22c55e",
  "Group Call": "#ec4899",
};

function makeEvents(): CalendarEvent[] {
  const now = new Date(2026, 5, 17); // current date context
  const types: CalendarEvent["type"][] = [
    "Coaching Session",
    "Check-in Call",
    "Consultation",
    "Group Call",
    "Product Launch",
  ];
  const events: CalendarEvent[] = [];
  const rand = seededRandom(42);
  for (let i = 0; i < 20; i++) {
    const offset = Math.floor(rand() * 45) - 10; // -10 .. +35 days
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const type = types[i % types.length];
    const client = clients[i % clients.length];
    const hour = 8 + Math.floor(rand() * 9);
    events.push({
      id: `evt_${i}`,
      title: type === "Product Launch" ? "New Program Drop" : `${type} — ${client.name.split(" ")[0]}`,
      type,
      clientId: type === "Product Launch" ? undefined : client.id,
      clientName: type === "Product Launch" ? undefined : client.name,
      date: d.toISOString().slice(0, 10),
      time: `${hour.toString().padStart(2, "0")}:00`,
      duration: [30, 45, 60, 90][i % 4],
      meetingLink: "https://meet.google.com/abc-defg-hij",
      notes: "Review progress, update plan, and set next week's targets.",
      color: eventColors[type],
    });
  }
  return events.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export const calendarEvents: CalendarEvent[] = makeEvents();

// ---------------- Messages ----------------
export const conversations: Conversation[] = [
  {
    id: "conv_1",
    clientId: "client_0",
    clientName: "Jessica Moore",
    clientAvatar: "Jessica Moore",
    unread: 2,
    messages: [
      { id: "m1", from: "client", text: "Hey Alisha! Just finished week 3 of the shred 💪", time: "09:12" },
      { id: "m2", from: "creator", text: "Amazing work Jessica!! How are you feeling?", time: "09:15" },
      { id: "m3", from: "client", text: "Honestly so much stronger. The morning workouts are clicking now.", time: "09:16" },
      { id: "m4", from: "creator", text: "That's exactly what I love to hear. Did you weigh in today?", time: "09:18" },
      { id: "m5", from: "client", text: "Yes! Down another 0.8kg 🎉", time: "09:20" },
      { id: "m6", from: "client", text: "Quick q — can I swap the Friday cardio for a spin class?", time: "09:21" },
    ],
  },
  {
    id: "conv_2",
    clientId: "client_1",
    clientName: "Marcus Tate",
    clientAvatar: "Marcus Tate",
    unread: 0,
    messages: [
      { id: "m1", from: "creator", text: "Marcus, sent over your new PPL block for this week.", time: "Yesterday" },
      { id: "m2", from: "client", text: "Got it, thank you! Volume looks solid.", time: "Yesterday" },
      { id: "m3", from: "creator", text: "Push hard on the incline press, that's your weak point 😄", time: "Yesterday" },
      { id: "m4", from: "client", text: "Noted 🫡 will send a form video Thursday.", time: "Yesterday" },
    ],
  },
  {
    id: "conv_3",
    clientId: "client_2",
    clientName: "Priya Kapoor",
    clientAvatar: "Priya Kapoor",
    unread: 1,
    messages: [
      { id: "m1", from: "client", text: "Hi! I'm struggling with hitting my protein goal 😅", time: "Mon" },
      { id: "m2", from: "creator", text: "Totally normal! Let's add a protein shake mid-morning. Easy 30g.", time: "Mon" },
      { id: "m3", from: "client", text: "That helps. Any brand you recommend?", time: "Tue" },
    ],
  },
  {
    id: "conv_4",
    clientId: "client_3",
    clientName: "Daniel Reyes",
    clientAvatar: "Daniel Reyes",
    unread: 0,
    messages: [
      { id: "m1", from: "client", text: "Booked my strategy call for Friday!", time: "Wed" },
      { id: "m2", from: "creator", text: "Perfect, talk soon. Come with your top 3 goals 🙌", time: "Wed" },
    ],
  },
  {
    id: "conv_5",
    clientId: "client_4",
    clientName: "Sofia Lindqvist",
    clientAvatar: "Sofia Lindqvist",
    unread: 0,
    messages: [
      { id: "m1", from: "creator", text: "Sofia, your measurements are looking incredible this month!", time: "Thu" },
      { id: "m2", from: "client", text: "Thank you!! Couldn't have done it without the plan 💜", time: "Thu" },
      { id: "m3", from: "creator", text: "All you. Keep showing up.", time: "Thu" },
    ],
  },
];

// ---------------- Revenue / Orders / Transactions ----------------
export function revenueSeries(days: number): RevenuePoint[] {
  const rand = seededRandom(days * 31 + 7);
  const today = new Date(2026, 5, 17);
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const base = 180 + Math.sin(i / 3) * 60;
    const value = Math.round(base + rand() * 200);
    return { date: d.toISOString().slice(0, 10), revenue: Math.max(80, Math.min(380, value)) };
  });
}

export const revenue30 = revenueSeries(30);

const orderProducts = products.filter((p) => p.status === "Published");
function makeOrders(count: number): Order[] {
  const rand = seededRandom(count + 3);
  const statuses: Order["status"][] = ["Completed", "Completed", "Completed", "Processing", "Refunded"];
  const methods = ["Visa •• 4242", "Mastercard •• 8210", "PayPal", "Apple Pay"];
  const today = new Date(2026, 5, 17);
  return Array.from({ length: count }).map((_, i) => {
    const product = orderProducts[Math.floor(rand() * orderProducts.length)];
    const client = clients[Math.floor(rand() * clients.length)];
    const d = new Date(today);
    d.setDate(today.getDate() - Math.floor(rand() * 45));
    return {
      id: `#FP-${10500 - i}`,
      client: client.name,
      product: product.name,
      amount: product.price,
      date: d.toISOString().slice(0, 10),
      status: statuses[Math.floor(rand() * statuses.length)],
      method: methods[Math.floor(rand() * methods.length)],
    };
  });
}

// Deterministic orders for the demo portal client (Jessica Moore) so her
// "My Library" is populated across every product type on first load.
const JESSICA_EMAIL = "jessica.moore@email.com";
const portalSeedOrders: Order[] = [
  {
    id: "#FP-20001",
    client: "Jessica Moore",
    email: JESSICA_EMAIL,
    product: "12-Week Shred Program",
    productId: "prod_shred",
    type: "Digital",
    quantity: 1,
    amount: 49,
    date: "2026-05-02",
    status: "Completed",
    method: "Visa •• 4242",
    fulfillment: "Delivered",
  },
  {
    id: "#FP-20002",
    client: "Jessica Moore",
    email: JESSICA_EMAIL,
    product: "Lean Muscle Meal Plan",
    productId: "prod_meal",
    type: "Digital",
    quantity: 1,
    amount: 29,
    date: "2026-05-02",
    status: "Completed",
    method: "Visa •• 4242",
    fulfillment: "Delivered",
  },
  {
    id: "#FP-20003",
    client: "Jessica Moore",
    email: JESSICA_EMAIL,
    product: "1-on-1 Monthly Coaching",
    productId: "prod_coaching",
    type: "Service",
    quantity: 1,
    amount: 199,
    date: "2026-05-10",
    status: "Completed",
    method: "Visa •• 4242",
    fulfillment: "Booked",
    sessionDate: "2026-06-22T11:00:00",
  },
  {
    id: "#FP-20004",
    client: "Jessica Moore",
    email: JESSICA_EMAIL,
    product: "Leviio Resistance Band Set",
    productId: "prod_bands",
    type: "Physical",
    quantity: 1,
    amount: 35,
    date: "2026-06-12",
    status: "Completed",
    method: "Visa •• 4242",
    fulfillment: "Shipped",
    address: "14 Marine Drive, Mumbai 400020",
    tracking: "IND123456789",
  },
];

export const transactions: Order[] = [
  ...portalSeedOrders,
  ...makeOrders(60),
].sort((a, b) => (a.date < b.date ? 1 : -1));
export const recentOrders: Order[] = transactions.slice(0, 10);

export const topProducts = [...products]
  .filter((p) => p.revenue > 0)
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 5);

// ---------------- Dashboard summary ----------------
export const overviewStats = {
  revenueThisMonth: 4280,
  revenueChange: 12,
  activeClients: clients.filter((c) => c.status !== "Inactive").length,
  newClientsThisWeek: 3,
  productsSold: 127,
  upcomingSessions: 6,
};

export const analyticsStats = {
  totalRevenue: 12480,
  revenueChange: 18,
  newClients: 24,
  productsSold: 89,
  avgRevenuePerClient: 328,
  retentionRate: 78,
  avgLifetimeMonths: 4.2,
  activeClients: 38,
  churnedClients: 11,
};

export const categoryRevenue = [
  { name: "Programs", value: 32142, color: "#7c3aed" },
  { name: "Coaching", value: 15715, color: "#22c55e" },
  { name: "Nutrition", value: 10503, color: "#f59e0b" },
  { name: "Merch", value: 4715, color: "#3b82f6" },
];

export const acquisitionData = [
  { week: "W1", new: 6, returning: 12 },
  { week: "W2", new: 8, returning: 14 },
  { week: "W3", new: 5, returning: 17 },
  { week: "W4", new: 9, returning: 19 },
];

export const themeSwatches = [
  { name: "Violet", value: "#7c3aed" },
  { name: "Emerald", value: "#10b981" },
  { name: "Orange", value: "#f97316" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Amber", value: "#f59e0b" },
];


export const niches = [
  "Weight Loss",
  "Muscle Building",
  "Yoga & Flexibility",
  "Sports Performance",
  "Nutrition & Diet",
  "General Fitness",
];

export const TRIAL_DAYS = 30;

export interface PricingPlan {
  name: Plan;
  price: number;
  tagline: string;
  features: string[];
  cta: string;
  popular?: boolean;
  trialDays?: number;
  limits?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: 0,
    tagline: "Everything you need to get started",
    features: [
      "Up to 10 clients",
      "3 products",
      "Store builder",
      "Basic client CRM",
      "Community support",
    ],
    limits: true,
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: 399,
    tagline: "Unlimited everything for serious creators",
    popular: true,
    trialDays: TRIAL_DAYS,
    features: [
      "Unlimited clients",
      "Unlimited products",
      "All tools unlocked",
      "Diet & workout builders",
      "Custom domain",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start 1-Month Free Trial",
  },
];

export const landingTestimonials = [
  {
    name: "Alisha Fernandez",
    handle: "@alishafits",
    avatarSeed: "alisha-fernandez",
    rating: 5,
    quote:
      "Leviio replaced 5 different tools I was paying for. My clients love the experience and my revenue is up 40%.",
  },
  {
    name: "Jordan Blake",
    handle: "@jblakefitness",
    avatarSeed: "jordan-blake",
    rating: 5,
    quote:
      "The workout and diet builders are insane. I create a full client program in 10 minutes now.",
  },
  {
    name: "Mia Castellano",
    handle: "@miacfit",
    avatarSeed: "mia-castellano",
    rating: 5,
    quote:
      "Finally a platform built for fitness creators. The CRM and coaching hub keep me organized for the first time ever.",
  },
];

export const storeReviews = [
  { name: "Rachel P.", avatarSeed: "rachel-p", rating: 5, text: "The 12-week shred changed my life. Down 14kg and stronger than ever!" },
  { name: "Tom H.", avatarSeed: "tom-h", rating: 5, text: "Best coaching I've ever had. Alisha actually cares about your progress." },
  { name: "Nina K.", avatarSeed: "nina-k", rating: 5, text: "The meal plans are so easy to follow. No more guessing what to eat." },
  { name: "Carlos M.", avatarSeed: "carlos-m", rating: 4, text: "Great programs and fast support. Highly recommend the booty builder." },
];
