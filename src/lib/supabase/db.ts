import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CalendarEvent,
  Client,
  CoachingPackage,
  Conversation,
  Creator,
  MealPlan,
  Message,
  Order,
  Product,
  Review,
  SessionNote,
  WorkoutProgram,
} from "@/lib/types";
import { isOversized } from "@/lib/security";

/**
 * Reject oversized / unserialisable payloads before they ever reach Postgres.
 * This is the single choke-point that every write passes through, so a bloated
 * or malformed object from any form is stopped here (callers surface the error
 * via toast). Complements per-field input limits in the UI.
 */
function assertSize(value: unknown, what: string): void {
  if (isOversized(value)) {
    throw new Error(`This ${what} is too large to save.`);
  }
}

/**
 * Throw on a Supabase write error so the caller's `.catch(reportError)` surfaces
 * it as a toast — no more silent save failures.
 */
function done(res: { error: { message: string } | null }, what: string): void {
  if (res.error) throw new Error(`Couldn't save ${what}: ${res.error.message}`);
}

/**
 * Data-access layer between the app's domain types and the Supabase schema
 * (see supabase/schema.sql). Type-specific / nested fields that don't have a
 * dedicated column are stashed in a `meta`/`metrics`/`socials` jsonb column.
 *
 * Every function here is a no-op-safe wrapper: callers in the store only invoke
 * them in Supabase mode, and surface errors via toast.
 */

type Row = Record<string, unknown>;

function shortTime(iso?: string): string {
  if (!iso) return "now";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "now";
  }
}

// ---------------------------------------------------------------------------
// profiles  <->  Creator
// ---------------------------------------------------------------------------
export function rowToCreator(r: Row): Creator {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    email: (r.email as string) ?? "",
    username: (r.username as string) ?? "",
    niche: (r.niche as string) ?? "",
    bio: (r.bio as string) ?? "",
    location: (r.location as string) ?? "",
    meetingLink: (r.meeting_link as string) ?? undefined,
    avatarSeed: (r.avatar_seed as string) ?? "",
    avatarUrl: (r.avatar_url as string) ?? undefined,
    bannerColor: (r.banner_color as string) ?? "#7c3aed",
    followers: (r.followers as number) ?? 0,
    plan: (r.plan as Creator["plan"]) ?? "Free",
    planExpiresAt: (r.plan_expires_at as string) ?? undefined,
    trial: (r.trial as boolean) ?? false,
    socials: (r.socials as Creator["socials"]) ?? {},
    coachingPackages: (r.coaching_packages as CoachingPackage[]) ?? [],
    sessionNotes: (r.session_notes as SessionNote[]) ?? [],
    isDemo: false,
  };
}

function creatorToProfileRow(c: Partial<Creator>): Row {
  const row: Row = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.name !== undefined) row.name = c.name;
  if (c.email !== undefined) row.email = c.email;
  if (c.username !== undefined) row.username = c.username;
  if (c.niche !== undefined) row.niche = c.niche;
  if (c.bio !== undefined) row.bio = c.bio;
  if (c.location !== undefined) row.location = c.location;
  if (c.meetingLink !== undefined) row.meeting_link = c.meetingLink;
  if (c.avatarSeed !== undefined) row.avatar_seed = c.avatarSeed;
  if (c.avatarUrl !== undefined) row.avatar_url = c.avatarUrl;
  if (c.bannerColor !== undefined) row.banner_color = c.bannerColor;
  if (c.followers !== undefined) row.followers = c.followers;
  if (c.plan !== undefined) row.plan = c.plan;
  if (c.planExpiresAt !== undefined) row.plan_expires_at = c.planExpiresAt ?? null;
  if (c.trial !== undefined) row.trial = c.trial;
  if (c.socials !== undefined) row.socials = c.socials;
  if (c.coachingPackages !== undefined) row.coaching_packages = c.coachingPackages;
  if (c.sessionNotes !== undefined) row.session_notes = c.sessionNotes;
  return row;
}

export async function getProfile(sb: SupabaseClient, id: string): Promise<Creator | null> {
  const { data } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  return data ? rowToCreator(data) : null;
}

/**
 * Public storefront lookup. Reads the email-free `public_profiles` view, never
 * the base table — so a creator's email is never exposed to anonymous visitors.
 */
export async function getProfileByUsername(
  sb: SupabaseClient,
  username: string
): Promise<Creator | null> {
  const { data } = await sb
    .from("public_profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return data ? rowToCreator(data) : null;
}

/** Public, email-free profile by id (e.g. the coach shown in a client's portal). */
export async function getPublicProfile(
  sb: SupabaseClient,
  id: string
): Promise<Creator | null> {
  const { data } = await sb
    .from("public_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? rowToCreator(data) : null;
}

export async function updateProfile(
  sb: SupabaseClient,
  id: string,
  patch: Partial<Creator>
): Promise<void> {
  assertSize(patch, "profile");
  const row = creatorToProfileRow(patch);
  delete row.id;
  done(await sb.from("profiles").update(row).eq("id", id), "profile");
}

/** Create a creator's profile row (called once on signup). Idempotent upsert. */
export async function insertProfile(sb: SupabaseClient, c: Creator): Promise<void> {
  assertSize(c, "profile");
  const { error } = await sb.from("profiles").upsert(creatorToProfileRow(c));
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// products
// ---------------------------------------------------------------------------
export function rowToProduct(r: Row): Product {
  const meta = (r.meta as Row) ?? {};
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    type: (r.type as Product["type"]) ?? "Digital",
    category: (r.category as Product["category"]) ?? "Programs",
    description: (r.description as string) ?? "",
    price: Number(r.price ?? 0),
    compareAt: r.compare_at != null ? Number(r.compare_at) : undefined,
    status: (r.status as Product["status"]) ?? "Draft",
    sales: (meta.sales as number) ?? 0,
    revenue: (meta.revenue as number) ?? 0,
    imageSeed: (r.image_seed as string) ?? "",
    tags: (r.tags as string[]) ?? [],
    imageUrl: meta.imageUrl as string | undefined,
    recurring: meta.recurring as boolean | undefined,
    badge: meta.badge as Product["badge"],
    rating: (meta.rating as number) ?? 0,
    reviewCount: (meta.reviewCount as number) ?? 0,
    fileType: meta.fileType as string | undefined,
    filePath: meta.filePath as string | undefined,
    fileName: meta.fileName as string | undefined,
    weight: meta.weight as string | undefined,
    sku: meta.sku as string | undefined,
    stock: meta.stock as number | undefined,
    duration: meta.duration as number | undefined,
    maxClients: meta.maxClients as number | undefined,
    deliveryMethod: meta.deliveryMethod as string | undefined,
  };
}

function productToRow(creatorId: string, p: Product): Row {
  return {
    id: p.id,
    creator_id: creatorId,
    name: p.name,
    type: p.type,
    category: p.category,
    description: p.description,
    price: p.price,
    compare_at: p.compareAt ?? null,
    status: p.status,
    image_seed: p.imageSeed,
    tags: p.tags,
    meta: {
      sales: p.sales,
      revenue: p.revenue,
      imageUrl: p.imageUrl,
      recurring: p.recurring,
      badge: p.badge,
      rating: p.rating,
      reviewCount: p.reviewCount,
      fileType: p.fileType,
      filePath: p.filePath,
      fileName: p.fileName,
      weight: p.weight,
      sku: p.sku,
      stock: p.stock,
      duration: p.duration,
      maxClients: p.maxClients,
      deliveryMethod: p.deliveryMethod,
    },
  };
}

export async function listProducts(sb: SupabaseClient, creatorId: string): Promise<Product[]> {
  const { data } = await sb
    .from("products")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToProduct);
}

export async function listPublishedProducts(
  sb: SupabaseClient,
  creatorId: string
): Promise<Product[]> {
  const { data } = await sb
    .from("products")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "Published");
  return (data ?? []).map(rowToProduct);
}

export async function upsertProduct(
  sb: SupabaseClient,
  creatorId: string,
  p: Product
): Promise<void> {
  assertSize(p, "product");
  done(await sb.from("products").upsert(productToRow(creatorId, p)), "product");
}

export async function deleteProduct(sb: SupabaseClient, id: string): Promise<void> {
  done(await sb.from("products").delete().eq("id", id), "product");
}

// ---------------------------------------------------------------------------
// clients
// ---------------------------------------------------------------------------
export function rowToClient(r: Row): Client {
  const m = (r.metrics as Row) ?? {};
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    handle: (r.handle as string) ?? "",
    email: (r.email as string) ?? "",
    phone: (r.phone as string) ?? "",
    age: (m.age as number) ?? 0,
    location: (m.location as string) ?? "",
    goal: (r.goal as Client["goal"]) ?? "Maintain",
    status: (r.status as Client["status"]) ?? "Active",
    // portalStatus lives inside the metrics jsonb (no dedicated column needed);
    // fall back to a legacy portal_status column if one exists.
    portalStatus:
      (m.portalStatus as Client["portalStatus"]) ??
      (r.portal_status as Client["portalStatus"]) ??
      "none",
    avatarSeed: (r.avatar_seed as string) ?? "",
    startDate: (r.start_date as string) ?? new Date().toISOString(),
    weeksTotal: (m.weeksTotal as number) ?? 0,
    weeksCompleted: (m.weeksCompleted as number) ?? 0,
    height: (m.height as number) ?? 0,
    startWeight: (m.startWeight as number) ?? 0,
    currentWeight: (m.currentWeight as number) ?? 0,
    bodyFat: (m.bodyFat as number) ?? 0,
    notes: (r.notes as string) ?? "",
    package: m.package as string | undefined,
    activePlans: (m.activePlans as number) ?? 0,
    mealPlanId: (r.meal_plan_id as string) ?? undefined,
    programId: (r.program_id as string) ?? undefined,
    weighIns: (m.weighIns as Client["weighIns"]) ?? [],
    measurements: (m.measurements as Client["measurements"]) ?? [],
    sessions: (m.sessions as Client["sessions"]) ?? [],
    payments: (m.payments as Client["payments"]) ?? [],
  };
}

function clientToRow(creatorId: string, c: Client): Row {
  return {
    id: c.id,
    creator_id: creatorId,
    name: c.name,
    handle: c.handle,
    email: c.email,
    phone: c.phone,
    goal: c.goal,
    status: c.status,
    avatar_seed: c.avatarSeed,
    start_date: c.startDate,
    meal_plan_id: c.mealPlanId ?? null,
    program_id: c.programId ?? null,
    notes: c.notes,
    metrics: {
      age: c.age,
      location: c.location,
      portalStatus: c.portalStatus ?? "none",
      weeksTotal: c.weeksTotal,
      weeksCompleted: c.weeksCompleted,
      height: c.height,
      startWeight: c.startWeight,
      currentWeight: c.currentWeight,
      bodyFat: c.bodyFat,
      package: c.package,
      activePlans: c.activePlans,
      weighIns: c.weighIns,
      measurements: c.measurements,
      sessions: c.sessions,
      payments: c.payments,
    },
  };
}

export async function listClients(sb: SupabaseClient, creatorId: string): Promise<Client[]> {
  const { data } = await sb
    .from("clients")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToClient);
}

export async function deleteClient(sb: SupabaseClient, id: string): Promise<void> {
  done(await sb.from("clients").delete().eq("id", id), "client");
}

/**
 * Client-portal: resolve the signed-in client's own managed record by email.
 * Relies on the "client reads self" RLS policy. Also returns the owning
 * creator_id so the portal can show the real coach.
 */
export async function getClientByEmail(
  sb: SupabaseClient,
  email: string
): Promise<{ client: Client; creatorId: string } | null> {
  const { data } = await sb
    .from("clients")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (!data) return null;
  return { client: rowToClient(data), creatorId: data.creator_id as string };
}

export async function upsertClient(
  sb: SupabaseClient,
  creatorId: string,
  c: Client
): Promise<void> {
  assertSize(c, "client");
  done(await sb.from("clients").upsert(clientToRow(creatorId, c)), "client");
}

// ---------------------------------------------------------------------------
// meal_plans
// ---------------------------------------------------------------------------
export function rowToMealPlan(r: Row): MealPlan {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    client: (r.client as string) ?? undefined,
    calorieTarget: (r.calorie_target as number) ?? 0,
    protein: (r.protein as number) ?? 0,
    carbs: (r.carbs as number) ?? 0,
    fat: (r.fat as number) ?? 0,
    dietType: (r.diet_type as string[]) ?? [],
    days: (r.days as MealPlan["days"]) ?? [],
    updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
  };
}

function mealPlanToRow(creatorId: string, p: MealPlan): Row {
  return {
    id: p.id,
    creator_id: creatorId,
    name: p.name,
    client: p.client ?? null,
    calorie_target: p.calorieTarget,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat,
    diet_type: p.dietType,
    days: p.days,
    updated_at: p.updatedAt,
  };
}

export async function listMealPlans(sb: SupabaseClient, creatorId: string): Promise<MealPlan[]> {
  const { data } = await sb
    .from("meal_plans")
    .select("*")
    .eq("creator_id", creatorId)
    .order("updated_at", { ascending: false });
  return (data ?? []).map(rowToMealPlan);
}

export async function upsertMealPlan(
  sb: SupabaseClient,
  creatorId: string,
  p: MealPlan
): Promise<void> {
  assertSize(p, "meal plan");
  done(await sb.from("meal_plans").upsert(mealPlanToRow(creatorId, p)), "meal plan");
}

/** Client-portal: read a single meal plan assigned to the signed-in client. */
export async function getMealPlan(
  sb: SupabaseClient,
  id: string
): Promise<MealPlan | null> {
  const { data } = await sb.from("meal_plans").select("*").eq("id", id).maybeSingle();
  return data ? rowToMealPlan(data) : null;
}

export async function deleteMealPlan(sb: SupabaseClient, id: string): Promise<void> {
  done(await sb.from("meal_plans").delete().eq("id", id), "meal plan");
}

// ---------------------------------------------------------------------------
// workout_programs
// ---------------------------------------------------------------------------
export function rowToProgram(r: Row): WorkoutProgram {
  return {
    id: r.id as string,
    name: (r.name as string) ?? "",
    goal: (r.goal as string) ?? "",
    weeks: (r.weeks as number) ?? 0,
    daysPerWeek: (r.days_per_week as number) ?? 0,
    difficulty: (r.difficulty as string) ?? "",
    equipment: (r.equipment as string) ?? "",
    client: (r.client as string) ?? undefined,
    schedule: (r.schedule as WorkoutProgram["schedule"]) ?? [],
    updatedAt: (r.updated_at as string) ?? new Date().toISOString(),
  };
}

function programToRow(creatorId: string, p: WorkoutProgram): Row {
  return {
    id: p.id,
    creator_id: creatorId,
    name: p.name,
    goal: p.goal,
    weeks: p.weeks,
    days_per_week: p.daysPerWeek,
    difficulty: p.difficulty,
    equipment: p.equipment,
    client: p.client ?? null,
    schedule: p.schedule,
    updated_at: p.updatedAt,
  };
}

export async function listPrograms(
  sb: SupabaseClient,
  creatorId: string
): Promise<WorkoutProgram[]> {
  const { data } = await sb
    .from("workout_programs")
    .select("*")
    .eq("creator_id", creatorId)
    .order("updated_at", { ascending: false });
  return (data ?? []).map(rowToProgram);
}

export async function upsertProgram(
  sb: SupabaseClient,
  creatorId: string,
  p: WorkoutProgram
): Promise<void> {
  assertSize(p, "program");
  done(await sb.from("workout_programs").upsert(programToRow(creatorId, p)), "program");
}

/** Client-portal: read a single workout program assigned to the signed-in client. */
export async function getProgram(
  sb: SupabaseClient,
  id: string
): Promise<WorkoutProgram | null> {
  const { data } = await sb
    .from("workout_programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? rowToProgram(data) : null;
}

export async function deleteProgram(sb: SupabaseClient, id: string): Promise<void> {
  done(await sb.from("workout_programs").delete().eq("id", id), "program");
}

// ---------------------------------------------------------------------------
// calendar_events
// ---------------------------------------------------------------------------
export function rowToEvent(r: Row): CalendarEvent {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "",
    type: (r.type as CalendarEvent["type"]) ?? "Coaching Session",
    clientId: (r.client_id as string) ?? undefined,
    clientName: (r.client_name as string) ?? undefined,
    date: (r.date as string) ?? "",
    time: (r.time as string) ?? "09:00",
    duration: (r.duration as number) ?? 60,
    meetingLink: (r.meeting_link as string) ?? undefined,
    notes: (r.notes as string) ?? "",
    color: (r.color as string) ?? "#7c3aed",
  };
}

function eventToRow(creatorId: string, e: CalendarEvent): Row {
  return {
    id: e.id,
    creator_id: creatorId,
    title: e.title,
    type: e.type,
    client_id: e.clientId ?? null,
    client_name: e.clientName ?? null,
    date: e.date,
    time: e.time,
    duration: e.duration,
    meeting_link: e.meetingLink ?? null,
    notes: e.notes,
    color: e.color,
  };
}

export async function listEvents(
  sb: SupabaseClient,
  creatorId: string
): Promise<CalendarEvent[]> {
  const { data } = await sb
    .from("calendar_events")
    .select("*")
    .eq("creator_id", creatorId);
  return (data ?? []).map(rowToEvent);
}

export async function upsertEvent(
  sb: SupabaseClient,
  creatorId: string,
  e: CalendarEvent
): Promise<void> {
  assertSize(e, "event");
  done(await sb.from("calendar_events").upsert(eventToRow(creatorId, e)), "event");
}

export async function deleteEvent(sb: SupabaseClient, id: string): Promise<void> {
  done(await sb.from("calendar_events").delete().eq("id", id), "event");
}

// ---------------------------------------------------------------------------
// orders
// ---------------------------------------------------------------------------
export function rowToOrder(r: Row): Order {
  return {
    id: r.id as string,
    client: (r.client_name as string) ?? "",
    email: (r.client_email as string) ?? undefined,
    product: (r.product as string) ?? "",
    productId: (r.product_id as string) ?? undefined,
    type: (r.type as Order["type"]) ?? undefined,
    quantity: (r.quantity as number) ?? undefined,
    amount: Number(r.amount ?? 0),
    date: (r.date as string) ?? "",
    status: (r.status as Order["status"]) ?? "Completed",
    method: (r.method as string) ?? "Card",
    fulfillment: (r.fulfillment as Order["fulfillment"]) ?? undefined,
    address: (r.address as string) ?? undefined,
    tracking: (r.tracking as string) ?? undefined,
    sessionDate: (r.session_date as string) ?? undefined,
  };
}

function orderToRow(creatorId: string, o: Order): Row {
  return {
    id: o.id,
    creator_id: creatorId,
    client_name: o.client,
    client_email: o.email ?? null,
    product: o.product,
    product_id: o.productId ?? null,
    type: o.type ?? null,
    quantity: o.quantity ?? 1,
    amount: o.amount,
    date: o.date,
    status: o.status,
    method: o.method,
    fulfillment: o.fulfillment ?? null,
    address: o.address ?? null,
    tracking: o.tracking ?? null,
    session_date: o.sessionDate ?? null,
  };
}

export async function listOrders(sb: SupabaseClient, creatorId: string): Promise<Order[]> {
  const { data } = await sb
    .from("orders")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToOrder);
}

/** Orders placed under a buyer's email (client-portal view). */
export async function listOrdersByEmail(sb: SupabaseClient, email: string): Promise<Order[]> {
  const { data } = await sb
    .from("orders")
    .select("*")
    .ilike("client_email", email);
  return (data ?? []).map(rowToOrder);
}

export async function insertOrder(
  sb: SupabaseClient,
  creatorId: string,
  o: Order
): Promise<void> {
  assertSize(o, "order");
  done(await sb.from("orders").insert(orderToRow(creatorId, o)), "order");
}

export async function updateOrder(
  sb: SupabaseClient,
  id: string,
  patch: Partial<Order>
): Promise<void> {
  const row: Row = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.fulfillment !== undefined) row.fulfillment = patch.fulfillment;
  if (patch.tracking !== undefined) row.tracking = patch.tracking;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.sessionDate !== undefined) row.session_date = patch.sessionDate;
  done(await sb.from("orders").update(row).eq("id", id), "order");
}

// ---------------------------------------------------------------------------
// conversations + messages
// ---------------------------------------------------------------------------
export async function listConversations(
  sb: SupabaseClient,
  creatorId: string
): Promise<Conversation[]> {
  const { data: convos } = await sb
    .from("conversations")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  if (!convos || convos.length === 0) return [];

  const ids = convos.map((c) => c.id as string);
  const { data: msgs } = await sb
    .from("messages")
    .select("*")
    .in("conversation_id", ids)
    .order("created_at", { ascending: true });

  const byConvo = new Map<string, Message[]>();
  for (const m of msgs ?? []) {
    const list = byConvo.get(m.conversation_id as string) ?? [];
    list.push({
      id: m.id as string,
      from: m.sender as Message["from"],
      text: m.text as string,
      time: shortTime(m.created_at as string),
    });
    byConvo.set(m.conversation_id as string, list);
  }

  return convos.map((c) => ({
    id: c.id as string,
    clientId: (c.client_id as string) ?? "",
    clientName: (c.client_name as string) ?? "",
    clientAvatar: (c.client_avatar as string) ?? "",
    unread: (c.unread as number) ?? 0,
    messages: byConvo.get(c.id as string) ?? [],
  }));
}

export async function insertConversation(
  sb: SupabaseClient,
  creatorId: string,
  c: Conversation
): Promise<void> {
  assertSize(c, "conversation");
  done(
    await sb.from("conversations").upsert({
      id: c.id,
      creator_id: creatorId,
      client_id: c.clientId,
      client_name: c.clientName,
      client_avatar: c.clientAvatar,
      unread: c.unread,
    }),
    "conversation"
  );
}

export async function insertMessage(
  sb: SupabaseClient,
  conversationId: string,
  msg: Message
): Promise<void> {
  assertSize(msg, "message");
  done(
    await sb.from("messages").insert({
      id: msg.id,
      conversation_id: conversationId,
      sender: msg.from,
      text: msg.text,
    }),
    "message"
  );
}

// ---------------------------------------------------------------------------
// reviews
// ---------------------------------------------------------------------------
function rowToReview(r: Row): Review {
  return {
    id: r.id as string,
    creatorId: r.creator_id as string,
    productId: (r.product_id as string) ?? undefined,
    clientEmail: (r.client_email as string) ?? "",
    clientName: (r.client_name as string) ?? "",
    rating: Number(r.rating ?? 5),
    text: (r.text as string) ?? "",
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
  };
}

/** Public: all reviews for a creator's storefront (newest first). */
export async function listReviews(sb: SupabaseClient, creatorId: string): Promise<Review[]> {
  const { data } = await sb
    .from("reviews")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToReview);
}

/** The signed-in client's existing review for this creator, if any. */
export async function getMyReview(
  sb: SupabaseClient,
  creatorId: string,
  email: string
): Promise<Review | null> {
  const { data } = await sb
    .from("reviews")
    .select("*")
    .eq("creator_id", creatorId)
    .ilike("client_email", email)
    .maybeSingle();
  return data ? rowToReview(data) : null;
}

/** Client creates/updates their review (RLS requires a matching purchase). */
export async function upsertReview(sb: SupabaseClient, review: Review): Promise<void> {
  assertSize(review, "review");
  const { error } = await sb.from("reviews").upsert({
    id: review.id,
    creator_id: review.creatorId,
    product_id: review.productId ?? null,
    client_email: review.clientEmail,
    client_name: review.clientName,
    rating: review.rating,
    text: review.text,
  });
  if (error) throw new Error(error.message);
}

export async function setConversationUnread(
  sb: SupabaseClient,
  conversationId: string,
  unread: number
): Promise<void> {
  done(
    await sb.from("conversations").update({ unread }).eq("id", conversationId),
    "conversation"
  );
}

// ---------------------------------------------------------------------------
// Client-portal scoped reads (RLS filters rows to the signed-in client)
// ---------------------------------------------------------------------------

/** The creator that owns the orders placed under this email (for the guest case). */
export async function getCoachIdByEmail(
  sb: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data } = await sb
    .from("orders")
    .select("creator_id")
    .ilike("client_email", email)
    .limit(1)
    .maybeSingle();
  return (data?.creator_id as string) ?? null;
}

/** Calendar events booked for the signed-in client (RLS scoped). */
export async function listClientEvents(sb: SupabaseClient): Promise<CalendarEvent[]> {
  const { data } = await sb.from("calendar_events").select("*");
  return (data ?? []).map(rowToEvent);
}

/** The signed-in client's conversation thread + messages (RLS scoped). */
export async function listClientConversations(
  sb: SupabaseClient
): Promise<Conversation[]> {
  const { data: convos } = await sb.from("conversations").select("*");
  if (!convos || convos.length === 0) return [];
  const ids = convos.map((c) => c.id as string);
  const { data: msgs } = await sb
    .from("messages")
    .select("*")
    .in("conversation_id", ids)
    .order("created_at", { ascending: true });

  const byConvo = new Map<string, Message[]>();
  for (const m of msgs ?? []) {
    const list = byConvo.get(m.conversation_id as string) ?? [];
    list.push({
      id: m.id as string,
      from: m.sender as Message["from"],
      text: m.text as string,
      time: shortTime(m.created_at as string),
    });
    byConvo.set(m.conversation_id as string, list);
  }

  return convos.map((c) => ({
    id: c.id as string,
    clientId: (c.client_id as string) ?? "",
    clientName: (c.client_name as string) ?? "",
    clientAvatar: (c.client_avatar as string) ?? "",
    unread: (c.unread as number) ?? 0,
    messages: byConvo.get(c.id as string) ?? [],
  }));
}
