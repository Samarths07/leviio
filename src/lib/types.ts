// ---------- Auth / Creator ----------
export type Plan = "Free" | "Pro";

export interface Creator {
  id: string;
  name: string;
  email: string;
  username: string;
  niche: string;
  bio: string;
  location: string;
  /** Default meeting room URL (Zoom/Meet/etc.) used for booked coaching sessions. */
  meetingLink?: string;
  avatarSeed: string;
  /** Uploaded profile photo URL (Supabase Storage); falls back to a generated avatar. */
  avatarUrl?: string;
  bannerColor: string;
  followers: number;
  plan: Plan;
  /** ISO timestamp when the current Pro plan / free trial expires */
  planExpiresAt?: string;
  /** True while the user is in their 1-month free Pro trial */
  trial?: boolean;
  socials: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    website?: string;
    /** Storefront hero banner image URL (stored here to avoid a schema change). */
    bannerUrl?: string;
  };
  /** Coaching offerings + freeform session notes (creator-managed, stored on profile). */
  coachingPackages?: CoachingPackage[];
  sessionNotes?: SessionNote[];
  isDemo?: boolean;
}

// ---------- Products ----------
export type ProductType = "Digital" | "Physical" | "Service" | "Membership";
export type ProductCategory = "Programs" | "Nutrition" | "Coaching" | "Merch";
export type ProductStatus = "Published" | "Draft";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  category: ProductCategory;
  description: string;
  price: number;
  compareAt?: number;
  status: ProductStatus;
  sales: number;
  revenue: number;
  imageSeed: string;
  /** Uploaded product image URL (Supabase Storage); falls back to a generated image. */
  imageUrl?: string;
  tags: string[];
  recurring?: boolean;
  badge?: "BESTSELLER" | "NEW";
  rating: number;
  reviewCount: number;
  // type-specific
  fileType?: string;
  /** Private storage path of the uploaded deliverable (digital products). */
  filePath?: string;
  /** Original filename of the deliverable, for display. */
  fileName?: string;
  weight?: string;
  sku?: string;
  stock?: number;
  duration?: number;
  maxClients?: number;
  deliveryMethod?: string;
}

// ---------- Clients ----------
export type ClientGoal =
  | "Weight Loss"
  | "Muscle Gain"
  | "Maintain"
  | "Athletic Performance";
export type ClientStatus = "Active" | "Inactive" | "VIP";

export interface Measurement {
  date: string;
  waist: number;
  hips: number;
  chest: number;
  arms: number;
  thighs: number;
}

export interface WeighIn {
  week: string;
  weight: number;
}

export interface ClientSession {
  id: string;
  date: string;
  type: string;
  duration: number;
  notes: string;
  completed: boolean;
}

export interface Payment {
  id: string;
  date: string;
  product: string;
  amount: number;
  status: "Paid" | "Pending" | "Refunded";
  method: string;
}

export interface Client {
  id: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  age: number;
  location: string;
  goal: ClientGoal;
  status: ClientStatus;
  /**
   * Portal access gate.
   *  - "none"     = added by the coach, hasn't signed up yet (no request).
   *  - "pending"  = the client signed up → request sent → coach can Approve.
   *  - "approved" = full portal access. Storefront buyers are auto-approved.
   */
  portalStatus?: "none" | "pending" | "approved";
  avatarSeed: string;
  startDate: string;
  weeksTotal: number;
  weeksCompleted: number;
  height: number; // cm
  startWeight: number; // kg
  currentWeight: number; // kg
  bodyFat: number; // %
  notes: string;
  package?: string;
  activePlans: number;
  /** id of the meal plan assigned to this client */
  mealPlanId?: string;
  /** id of the workout program assigned to this client */
  programId?: string;
  weighIns: WeighIn[];
  measurements: Measurement[];
  sessions: ClientSession[];
  payments: Payment[];
}

// ---------- Coaching ----------
export interface CoachingPackage {
  id: string;
  name: string;
  sessions: number;
  price: number;
  description: string;
  includesMealPlan?: boolean;
  popular?: boolean;
}

export interface SessionNote {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  date: string;
  note: string;
}

// ---------- Diet Planner ----------
export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  slot: string;
  name: string;
  items: FoodItem[];
}

export interface DietDay {
  id: string;
  label: string;
  meals: Meal[];
}

export interface MealPlan {
  id: string;
  name: string;
  client?: string;
  calorieTarget: number;
  protein: number; // %
  carbs: number; // %
  fat: number; // %
  dietType: string[];
  days: DietDay[];
  updatedAt: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  days: number;
  goal: string;
  dietType: string[];
}

// ---------- Workout Builder ----------
export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Legs"
  | "Arms"
  | "Core"
  | "Cardio"
  | "Full Body";

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
}

export interface ProgramExercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  sets: number;
  reps: string;
  rest: number;
  notes: string;
}

export interface TrainingDay {
  id: string;
  day: string;
  label: string;
  muscles: MuscleGroup[];
  exercises: ProgramExercise[];
}

export interface WorkoutWeek {
  week: number;
  days: TrainingDay[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  goal: string;
  weeks: number;
  daysPerWeek: number;
  difficulty: string;
  equipment: string;
  client?: string;
  schedule: WorkoutWeek[];
  updatedAt: string;
}

// ---------- Calendar ----------
export type EventType =
  | "Coaching Session"
  | "Check-in Call"
  | "Product Launch"
  | "Rest Day"
  | "Consultation"
  | "Group Call";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  clientId?: string;
  clientName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  meetingLink?: string;
  notes: string;
  color: string;
}

// ---------- Messages ----------
export interface Message {
  id: string;
  from: "creator" | "client";
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  messages: Message[];
  unread: number;
}

// ---------- Analytics / Orders ----------
export interface RevenuePoint {
  date: string;
  revenue: number;
}

export type Fulfillment =
  | "Delivered"
  | "Processing"
  | "Shipped"
  | "Awaiting booking"
  | "Booked"
  | "Completed";

export interface Order {
  id: string;
  client: string;
  email?: string;
  product: string;
  productId?: string;
  type?: ProductType;
  quantity?: number;
  amount: number;
  date: string;
  status: "Completed" | "Processing" | "Refunded";
  method: string;
  /** delivery / fulfillment status */
  fulfillment?: Fulfillment;
  /** shipping address for physical products */
  address?: string;
  /** tracking number once shipped */
  tracking?: string;
  /** booked session date/time for services (ISO) */
  sessionDate?: string;
}

// ---------- Cart (storefront) ----------
export interface CartItem {
  product: Product;
  quantity: number;
}

// ---------- Reviews ----------
export interface Review {
  id: string;
  creatorId: string;
  productId?: string;
  clientEmail: string;
  clientName: string;
  rating: number; // 1–5
  text: string;
  createdAt: string;
}
