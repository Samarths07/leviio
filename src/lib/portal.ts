import type {
  CalendarEvent,
  Client,
  Conversation,
  MealPlan,
  Order,
  WorkoutProgram,
} from "./types";

/**
 * Build a lightweight "guest" client for a storefront buyer who isn't one of
 * the creator's managed clients. They can see their purchases and message the
 * creator, but have no pre-assigned plans or history.
 */
export function makeGuestClient(email: string, name: string): Client {
  const clean = email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
  return {
    id: "guest_" + (clean || Math.random().toString(36).slice(2, 8)),
    name: name || email,
    handle: "@" + (name || email).toLowerCase().replace(/\s+/g, ""),
    email,
    phone: "",
    age: 0,
    location: "",
    goal: "Maintain",
    status: "Active",
    portalStatus: "approved", // storefront buyers don't need approval — they paid
    avatarSeed: name || email,
    startDate: new Date().toISOString(),
    weeksTotal: 0,
    weeksCompleted: 0,
    height: 0,
    startWeight: 0,
    currentWeight: 0,
    bodyFat: 0,
    notes: "",
    activePlans: 0,
    weighIns: [],
    measurements: [],
    sessions: [],
    payments: [],
  };
}

/** True when this client is an ad-hoc storefront buyer, not a managed client. */
export function isGuestClient(client: Client): boolean {
  return client.id.startsWith("guest_");
}

/** All orders belonging to a client — matched by purchase email or buyer name. */
export function matchOrders(orders: Order[], client: Client): Order[] {
  const email = client.email?.toLowerCase();
  return orders.filter(
    (o) =>
      (!!email && o.email?.toLowerCase() === email) || o.client === client.name
  );
}

/** The meal plan assigned to a client (by id, falling back to a name match). */
export function clientMealPlan(
  plans: MealPlan[],
  client: Client
): MealPlan | undefined {
  if (client.mealPlanId) {
    const byId = plans.find((p) => p.id === client.mealPlanId);
    if (byId) return byId;
  }
  return plans.find((p) => p.client === client.name);
}

/** The workout program assigned to a client (by id, falling back to a name match). */
export function clientProgram(
  programs: WorkoutProgram[],
  client: Client
): WorkoutProgram | undefined {
  if (client.programId) {
    const byId = programs.find((p) => p.id === client.programId);
    if (byId) return byId;
  }
  return programs.find((p) => p.client === client.name);
}

/** Calendar sessions scheduled for a client. */
export function clientEvents(
  events: CalendarEvent[],
  client: Client
): CalendarEvent[] {
  return events.filter(
    (e) => e.clientId === client.id || e.clientName === client.name
  );
}

/** The conversation thread between a client and the creator, if any. */
export function clientConversation(
  conversations: Conversation[],
  client: Client
): Conversation | undefined {
  return conversations.find((c) => c.clientId === client.id);
}
