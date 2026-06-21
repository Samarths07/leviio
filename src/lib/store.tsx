"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import {
  calendarEvents as seedEvents,
  clients as seedClients,
  conversations as seedConversations,
  creator as seedCreator,
  mealPlans as seedMealPlans,
  products as seedProducts,
  transactions as seedOrders,
  workoutPrograms as seedPrograms,
} from "./mock-data";
import type {
  CalendarEvent,
  CartItem,
  Client,
  Conversation,
  Creator,
  MealPlan,
  Message,
  Order,
  Plan,
  Product,
  WorkoutProgram,
} from "./types";
import { newTrialExpiry, uid } from "./utils";
import { isOversized } from "./security";
import { makeGuestClient } from "./portal";
import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase/config";
import * as db from "./supabase/db";
import type { Session } from "@supabase/supabase-js";

/**
 * The store runs in one of two modes (see src/lib/supabase/config.ts):
 *  - Supabase mode  → real auth + database (production with env vars set).
 *  - Mock mode      → localStorage + seed data (local dev / demo deploy).
 * `USING_SUPABASE` is decided once from env at module load.
 */
const USING_SUPABASE = isSupabaseConfigured();

/**
 * Normalizes a stored/seed creator into the current plan model.
 * Migrates legacy plans to a fresh Pro free-trial and ensures a trial
 * expiry exists so the countdown timer always has something to show.
 */
function normalizeUser(u: Creator): Creator {
  const plan: Plan = u.plan === "Free" || u.plan === "Pro" ? u.plan : "Pro";
  if (plan === "Free") {
    return { ...u, plan, trial: false, planExpiresAt: undefined };
  }
  return {
    ...u,
    plan,
    trial: u.trial ?? true,
    planExpiresAt: u.planExpiresAt ?? newTrialExpiry(),
  };
}

const KEYS = {
  auth: "leviio_auth",
  clientAuth: "leviio_client_auth",
  products: "leviio_products",
  clients: "leviio_clients",
  mealPlans: "leviio_mealplans",
  programs: "leviio_programs",
  events: "leviio_events",
  conversations: "leviio_conversations",
  cart: "leviio_cart",
  orders: "leviio_orders",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  // Reject oversized / unserialisable payloads before persisting.
  if (isOversized(value)) {
    if (typeof console !== "undefined") {
      console.warn(`[leviio] skipped oversized write to "${key}"`);
    }
    return;
  }
  try {
    const serialized = JSON.stringify(value);
    // Skip no-op writes. Besides saving work, this breaks the cross-tab echo
    // loop: a tab applying another tab's update would otherwise re-persist the
    // identical value and bounce a storage event straight back, forever.
    if (localStorage.getItem(key) === serialized) return;
    localStorage.setItem(key, serialized);
  } catch {
    /* quota exceeded or unavailable — ignore */
  }
}

interface AppContextValue {
  hydrated: boolean;
  /** True when the store is backed by Supabase (vs. localStorage demo mode). */
  usingSupabase: boolean;
  // auth
  user: Creator | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    data: Partial<Creator> & { name: string; email: string; password?: string }
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (patch: Partial<Creator>) => void;
  // client portal auth (the customer side)
  /** The signed-in client's coach (Supabase portal mode); null in mock mode. */
  coach: Creator | null;
  clientUser: Client | null;
  clientLogin: (email: string) => Client | null;
  /** Supabase portal: email a magic link to the client. Returns send status. */
  clientLoginOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  clientLogout: () => void;
  // products
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // clients
  clients: Client[];
  addClient: (c: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  // meal plans
  mealPlans: MealPlan[];
  saveMealPlan: (p: MealPlan) => void;
  deleteMealPlan: (id: string) => void;
  // programs
  programs: WorkoutProgram[];
  saveProgram: (p: WorkoutProgram) => void;
  deleteProgram: (id: string) => void;
  // events
  events: CalendarEvent[];
  addEvent: (e: CalendarEvent) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  // conversations
  conversations: Conversation[];
  sendMessage: (
    conversationId: string,
    text: string,
    from?: "creator" | "client"
  ) => void;
  markRead: (conversationId: string) => void;
  /** Find or create the conversation thread for a client; returns its id. */
  createConversation: (client: Client) => string;
  // cart
  cart: CartItem[];
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, qty: number) => void;
  clearCart: () => void;
  // orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const sb = useMemo(() => getSupabaseBrowser(), []);
  const expiredNotified = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<Creator | null>(null);
  const [clientUser, setClientUser] = useState<Client | null>(null);
  const [coach, setCoach] = useState<Creator | null>(null);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(seedMealPlans);
  const [programs, setPrograms] = useState<WorkoutProgram[]>(seedPrograms);
  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents);
  const [conversations, setConversations] =
    useState<Conversation[]>(seedConversations);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(seedOrders);

  // Surface a background-persistence failure without losing the optimistic UI.
  const reportError = useCallback(
    (err: unknown, what: string) => {
      console.error(`[leviio] failed to save ${what}`, err);
      toast(`Couldn't save ${what}. Check your connection.`, { variant: "error" });
    },
    [toast]
  );

  // Load every slice of a creator's data from Supabase into state.
  const loadCreatorData = useCallback(
    async (creatorId: string) => {
      if (!sb) return;
      const [prods, cls, meals, progs, evts, ords, convos] = await Promise.all([
        db.listProducts(sb, creatorId),
        db.listClients(sb, creatorId),
        db.listMealPlans(sb, creatorId),
        db.listPrograms(sb, creatorId),
        db.listEvents(sb, creatorId),
        db.listOrders(sb, creatorId),
        db.listConversations(sb, creatorId),
      ]);
      setProducts(prods);
      setClients(cls);
      setMealPlans(meals);
      setPrograms(progs);
      setEvents(evts);
      setOrders(ords);
      setConversations(convos);
    },
    [sb]
  );

  // Clear every server-backed slice (used on logout / no session).
  const clearData = useCallback(() => {
    setProducts([]);
    setClients([]);
    setMealPlans([]);
    setPrograms([]);
    setEvents([]);
    setOrders([]);
    setConversations([]);
    setCoach(null);
  }, []);

  // Load the signed-in client's own data (orders, assigned plan/program,
  // sessions, messages, coach) via the RLS-scoped client-portal queries.
  const loadClientData = useCallback(
    async (email: string) => {
      if (!sb) return;
      const managed = await db.getClientByEmail(sb, email);
      const ords = await db.listOrdersByEmail(sb, email);
      let resolved: Client | null = managed?.client ?? null;
      let coachId: string | null = managed?.creatorId ?? null;
      if (!resolved && ords.length) {
        resolved = makeGuestClient(email, ords[0].client);
        coachId = await db.getCoachIdByEmail(sb, email);
      }
      if (!resolved) {
        setClientUser(null);
        return;
      }
      setClientUser(resolved);
      setOrders(ords);
      setClients([resolved]);
      setProducts([]);

      const meals: MealPlan[] = [];
      const progs: WorkoutProgram[] = [];
      if (resolved.mealPlanId) {
        const mp = await db.getMealPlan(sb, resolved.mealPlanId);
        if (mp) meals.push(mp);
      }
      if (resolved.programId) {
        const pr = await db.getProgram(sb, resolved.programId);
        if (pr) progs.push(pr);
      }
      setMealPlans(meals);
      setPrograms(progs);
      setEvents(await db.listClientEvents(sb));
      setConversations(await db.listClientConversations(sb));
      // Coach is shown to the client → use the email-free public profile.
      if (coachId) setCoach(await db.getPublicProfile(sb, coachId));
    },
    [sb]
  );

  // Interpret a Supabase session: a user WITH a profile is a creator; a user
  // WITHOUT one is a portal client (magic-link). See supabase/schema.sql.
  const applySession = useCallback(
    async (session: Session | null) => {
      if (!sb) return;
      if (!session?.user) {
        setUser(null);
        setClientUser(null);
        clearData();
        return;
      }
      const profile = await db.getProfile(sb, session.user.id);
      if (profile) {
        setClientUser(null);
        setCoach(null);
        setUser(normalizeUser(profile));
        await loadCreatorData(session.user.id);
      } else if (session.user.email) {
        setUser(null);
        await loadClientData(session.user.email);
      } else {
        setUser(null);
        setClientUser(null);
        clearData();
      }
    },
    [sb, clearData, loadCreatorData, loadClientData]
  );

  // ---- Hydration ----------------------------------------------------------
  useEffect(() => {
    // Mock mode: hydrate from localStorage + seeds (original behaviour).
    if (!USING_SUPABASE || !sb) {
      const storedUser = read<Creator | null>(KEYS.auth, null);
      if (storedUser) {
        const normalized = normalizeUser(storedUser);
        setUser(normalized);
        write(KEYS.auth, normalized);
      } else {
        setUser(null);
      }
      setClientUser(read<Client | null>(KEYS.clientAuth, null));
      setProducts(read(KEYS.products, seedProducts));
      setClients(read(KEYS.clients, seedClients));
      setMealPlans(read(KEYS.mealPlans, seedMealPlans));
      setPrograms(read(KEYS.programs, seedPrograms));
      setEvents(read(KEYS.events, seedEvents));
      setConversations(read(KEYS.conversations, seedConversations));
      setCart(read(KEYS.cart, []));
      setOrders(read(KEYS.orders, seedOrders));
      setHydrated(true);
      return;
    }

    // Supabase mode: resolve the current session, then subscribe to changes.
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!active) return;
      await applySession(session);
      setCart(read(KEYS.cart, []));
      if (active) setHydrated(true);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (active) applySession(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [sb, applySession]);

  // ---- localStorage persistence (mock mode only; cart always) -------------
  const persist = useCallback(
    (key: string, value: unknown) => {
      if (hydrated && !USING_SUPABASE) write(key, value);
    },
    [hydrated]
  );

  useEffect(() => persist(KEYS.products, products), [products, persist]);
  useEffect(() => persist(KEYS.clients, clients), [clients, persist]);
  useEffect(() => persist(KEYS.mealPlans, mealPlans), [mealPlans, persist]);
  useEffect(() => persist(KEYS.programs, programs), [programs, persist]);
  useEffect(() => persist(KEYS.events, events), [events, persist]);
  useEffect(
    () => persist(KEYS.conversations, conversations),
    [conversations, persist]
  );
  useEffect(() => persist(KEYS.orders, orders), [orders, persist]);
  // Cart persists locally in both modes (it's pre-checkout, client-only state).
  useEffect(() => {
    if (hydrated) write(KEYS.cart, cart);
  }, [cart, hydrated]);

  // Cross-tab sync via the Storage API — mock mode only. (In Supabase mode,
  // cross-device sync would use Supabase Realtime; see README Phase B.)
  useEffect(() => {
    if (!hydrated || USING_SUPABASE) return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.newValue == null) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(e.newValue);
      } catch {
        return;
      }
      switch (e.key) {
        case KEYS.conversations:
          setConversations(parsed as Conversation[]);
          break;
        case KEYS.orders:
          setOrders(parsed as Order[]);
          break;
        case KEYS.products:
          setProducts(parsed as Product[]);
          break;
        case KEYS.clients:
          setClients(parsed as Client[]);
          break;
        case KEYS.mealPlans:
          setMealPlans(parsed as MealPlan[]);
          break;
        case KEYS.programs:
          setPrograms(parsed as WorkoutProgram[]);
          break;
        case KEYS.events:
          setEvents(parsed as CalendarEvent[]);
          break;
        case KEYS.cart:
          setCart(parsed as CartItem[]);
          break;
        case KEYS.auth:
          setUser(parsed as Creator | null);
          break;
        case KEYS.clientAuth:
          setClientUser(parsed as Client | null);
          break;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  // Plan expiry automation — when a Pro plan/trial lapses, auto-downgrade to Free.
  useEffect(() => {
    if (!hydrated) return;
    const check = () => {
      setUser((prev) => {
        if (
          prev &&
          prev.plan === "Pro" &&
          prev.planExpiresAt &&
          Date.parse(prev.planExpiresAt) <= Date.now()
        ) {
          const downgraded: Creator = {
            ...prev,
            plan: "Free",
            trial: false,
            planExpiresAt: undefined,
          };
          if (USING_SUPABASE && sb) {
            db.updateProfile(sb, downgraded.id, {
              plan: "Free",
              trial: false,
              planExpiresAt: undefined,
            }).catch((e) => reportError(e, "your plan"));
          } else {
            write(KEYS.auth, downgraded);
          }
          if (!expiredNotified.current) {
            expiredNotified.current = true;
            setTimeout(
              () =>
                toast("Your Pro plan has expired — you're now on the Free plan.", {
                  variant: "info",
                }),
              0
            );
          }
          return downgraded;
        }
        return prev;
      });
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [hydrated, toast, sb, reportError]);

  // ---- auth ---------------------------------------------------------------
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      expiredNotified.current = false;

      if (USING_SUPABASE && sb) {
        const { data, error } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error || !data.user) return false;
        let profile = await db.getProfile(sb, data.user.id);
        if (!profile) {
          // First login on a confirm-email project: create the profile now,
          // backfilled from the metadata captured at signup.
          const md = (data.user.user_metadata ?? {}) as {
            name?: string;
            username?: string;
          };
          const fallbackName =
            md.name || data.user.email?.split("@")[0] || "Creator";
          profile = {
            id: data.user.id,
            name: fallbackName,
            email: data.user.email ?? email.trim(),
            username:
              md.username ||
              fallbackName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16),
            niche: "",
            bio: "",
            location: "",
            avatarSeed: fallbackName,
            bannerColor: "#7c3aed",
            followers: 0,
            plan: "Pro",
            trial: true,
            planExpiresAt: newTrialExpiry(),
            socials: {},
            isDemo: false,
          };
          await db.insertProfile(sb, profile).catch(() => {});
        }
        setUser(normalizeUser(profile));
        await loadCreatorData(data.user.id);
        return true;
      }

      // Mock auth: preserve an existing account's plan/expiry; brand-new logins
      // start on a fresh 1-month Pro trial (via normalizeUser).
      const existing = read<Creator | null>(KEYS.auth, null);
      const base = existing ?? seedCreator;
      const u = normalizeUser({
        ...base,
        email: email || base.email || seedCreator.email,
      });
      setUser(u);
      write(KEYS.auth, u);
      return true;
    },
    [sb, loadCreatorData]
  );

  const signup = useCallback(
    async (
      data: Partial<Creator> & { name: string; email: string; password?: string }
    ): Promise<boolean> => {
      const username =
        data.username ||
        data.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);

      if (USING_SUPABASE && sb) {
        const { data: res, error } = await sb.auth.signUp({
          email: data.email.trim(),
          password: data.password ?? "",
          options: { data: { name: data.name, username } },
        });
        if (error) {
          toast(error.message, { variant: "error" });
          return false;
        }
        // Email-confirmation projects return no session until the link is clicked.
        if (!res.session) {
          toast("Check your email to confirm your account, then log in.", {
            variant: "info",
          });
          return false;
        }
        // Create the creator's profile row (the app, not a trigger, owns this).
        const creator: Creator = {
          id: res.user!.id,
          name: data.name,
          email: data.email.trim(),
          username,
          niche: data.niche ?? "",
          bio: "",
          location: "",
          avatarSeed: data.name,
          bannerColor: "#7c3aed",
          followers: 0,
          plan: "Pro",
          trial: true,
          planExpiresAt: newTrialExpiry(),
          socials: {},
          isDemo: false,
        };
        await db
          .insertProfile(sb, creator)
          .catch((e) => reportError(e, "your profile"));
        setUser(normalizeUser(creator));
        return true;
      }

      // Mock sign-up: start a 1-month free Pro trial.
      const u = normalizeUser({
        ...seedCreator,
        ...data,
        id: "creator_" + Math.random().toString(36).slice(2, 8),
        username,
        isDemo: false,
        plan: "Pro",
        trial: true,
        planExpiresAt: newTrialExpiry(),
      });
      setUser(u);
      write(KEYS.auth, u);
      return true;
    },
    [sb, toast, reportError]
  );

  const logout = useCallback(() => {
    setUser(null);
    if (USING_SUPABASE && sb) {
      sb.auth.signOut();
    } else {
      write(KEYS.auth, null);
    }
  }, [sb]);

  const updateUser = useCallback(
    (patch: Partial<Creator>) => {
      // Re-arm the expiry notification whenever the user (re)activates Pro.
      if (patch.plan === "Pro") expiredNotified.current = false;
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        if (USING_SUPABASE && sb) {
          db.updateProfile(sb, prev.id, patch).catch((e) =>
            reportError(e, "your profile")
          );
        } else {
          write(KEYS.auth, next);
        }
        return next;
      });
    },
    [sb, reportError]
  );

  // ---- client portal auth -------------------------------------------------
  // Resolve a buyer email to a managed client, or (failing that) to a guest
  // client built from their storefront orders. Returns null if no purchases.
  const clientLogin = useCallback(
    (email: string): Client | null => {
      const e = email.trim().toLowerCase();
      if (!e) return null;
      const managed = clients.find((c) => c.email?.toLowerCase() === e);
      let resolved: Client | null = managed ?? null;
      if (!resolved) {
        const order = orders.find((o) => o.email?.toLowerCase() === e);
        if (order) resolved = makeGuestClient(e, order.client);
      }
      if (resolved) {
        setClientUser(resolved);
        write(KEYS.clientAuth, resolved);
      }
      return resolved;
    },
    [clients, orders]
  );

  // Supabase portal: send a passwordless magic link to the client's email.
  const clientLoginOtp = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      if (!(USING_SUPABASE && sb))
        return { ok: false, error: "Supabase not configured" };
      const base =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (typeof window !== "undefined" ? window.location.origin : "");
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${base}/portal` },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [sb]
  );

  const clientLogout = useCallback(() => {
    setClientUser(null);
    setCoach(null);
    if (USING_SUPABASE && sb) {
      sb.auth.signOut();
    } else {
      write(KEYS.clientAuth, null);
    }
  }, [sb]);

  // ---- products -----------------------------------------------------------
  const addProduct = useCallback(
    (p: Product) => {
      setProducts((prev) => [p, ...prev]);
      if (USING_SUPABASE && sb && user)
        db.upsertProduct(sb, user.id, p).catch((e) => reportError(e, "product"));
    },
    [sb, user, reportError]
  );
  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) =>
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
        const updated = next.find((p) => p.id === id);
        if (USING_SUPABASE && sb && user && updated)
          db.upsertProduct(sb, user.id, updated).catch((e) =>
            reportError(e, "product")
          );
        return next;
      }),
    [sb, user, reportError]
  );
  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (USING_SUPABASE && sb)
        db.deleteProduct(sb, id).catch((e) => reportError(e, "product"));
    },
    [sb, reportError]
  );

  // ---- clients ------------------------------------------------------------
  const addClient = useCallback(
    (c: Client) => {
      setClients((prev) => [c, ...prev]);
      if (USING_SUPABASE && sb && user)
        db.upsertClient(sb, user.id, c).catch((e) => reportError(e, "client"));
    },
    [sb, user, reportError]
  );
  const updateClient = useCallback(
    (id: string, patch: Partial<Client>) =>
      setClients((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
        const updated = next.find((c) => c.id === id);
        if (USING_SUPABASE && sb && user && updated)
          db.upsertClient(sb, user.id, updated).catch((e) =>
            reportError(e, "client")
          );
        return next;
      }),
    [sb, user, reportError]
  );

  // ---- meal plans ---------------------------------------------------------
  const saveMealPlan = useCallback(
    (p: MealPlan) => {
      setMealPlans((prev) => {
        const exists = prev.some((x) => x.id === p.id);
        return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      });
      if (USING_SUPABASE && sb && user)
        db.upsertMealPlan(sb, user.id, p).catch((e) =>
          reportError(e, "meal plan")
        );
    },
    [sb, user, reportError]
  );
  const deleteMealPlan = useCallback(
    (id: string) => {
      setMealPlans((prev) => prev.filter((p) => p.id !== id));
      if (USING_SUPABASE && sb)
        db.deleteMealPlan(sb, id).catch((e) => reportError(e, "meal plan"));
    },
    [sb, reportError]
  );

  // ---- programs -----------------------------------------------------------
  const saveProgram = useCallback(
    (p: WorkoutProgram) => {
      setPrograms((prev) => {
        const exists = prev.some((x) => x.id === p.id);
        return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      });
      if (USING_SUPABASE && sb && user)
        db.upsertProgram(sb, user.id, p).catch((e) => reportError(e, "program"));
    },
    [sb, user, reportError]
  );
  const deleteProgram = useCallback(
    (id: string) => {
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      if (USING_SUPABASE && sb)
        db.deleteProgram(sb, id).catch((e) => reportError(e, "program"));
    },
    [sb, reportError]
  );

  // ---- events -------------------------------------------------------------
  const addEvent = useCallback(
    (e: CalendarEvent) => {
      setEvents((prev) => [...prev, e]);
      if (USING_SUPABASE && sb && user)
        db.upsertEvent(sb, user.id, e).catch((err) => reportError(err, "event"));
    },
    [sb, user, reportError]
  );
  const updateEvent = useCallback(
    (id: string, patch: Partial<CalendarEvent>) =>
      setEvents((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        const updated = next.find((e) => e.id === id);
        if (USING_SUPABASE && sb && user && updated)
          db.upsertEvent(sb, user.id, updated).catch((err) =>
            reportError(err, "event")
          );
        return next;
      }),
    [sb, user, reportError]
  );
  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (USING_SUPABASE && sb)
        db.deleteEvent(sb, id).catch((err) => reportError(err, "event"));
    },
    [sb, reportError]
  );

  // ---- conversations ------------------------------------------------------
  const sendMessage = useCallback(
    (
      conversationId: string,
      text: string,
      from: "creator" | "client" = "creator"
    ) => {
      const msg: Message = {
        id: uid("m"),
        from,
        text,
        time: "now",
      };
      let nextUnread = 0;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          nextUnread = from === "client" ? c.unread + 1 : c.unread;
          return {
            ...c,
            messages: [...c.messages, msg],
            // a client message is unread from the creator's perspective
            unread: nextUnread,
          };
        })
      );
      if (USING_SUPABASE && sb) {
        db.insertMessage(sb, conversationId, msg).catch((e) =>
          reportError(e, "message")
        );
        if (from === "client")
          db.setConversationUnread(sb, conversationId, nextUnread).catch(() => {});
      }
    },
    [sb, reportError]
  );
  const markRead = useCallback(
    (conversationId: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
      );
      if (USING_SUPABASE && sb)
        db.setConversationUnread(sb, conversationId, 0).catch(() => {});
    },
    [sb]
  );
  // Find-or-create a thread for a client. Idempotent: a deterministic id keeps
  // repeated calls (and a follow-up sendMessage) pointing at the same thread.
  const createConversation = useCallback(
    (client: Client): string => {
      const existing = conversations.find((c) => c.clientId === client.id);
      if (existing) return existing.id;
      const conv: Conversation = {
        id: "conv_" + client.id,
        clientId: client.id,
        clientName: client.name,
        clientAvatar: client.avatarSeed,
        unread: 0,
        messages: [],
      };
      setConversations((prev) =>
        prev.some((c) => c.clientId === client.id) ? prev : [conv, ...prev]
      );
      if (USING_SUPABASE && sb && user)
        db.insertConversation(sb, user.id, conv).catch((e) =>
          reportError(e, "conversation")
        );
      return conv.id;
    },
    [conversations, sb, user, reportError]
  );

  // ---- cart (client-only, both modes) -------------------------------------
  const addToCart = useCallback((p: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === p.id ? { ...i, quantity: i.quantity + qty } : i
        );
      return [...prev, { product: p, quantity: qty }];
    });
  }, []);
  const removeFromCart = useCallback(
    (id: string) => setCart((prev) => prev.filter((i) => i.product.id !== id)),
    []
  );
  const updateCartQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product.id !== id)
        : prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i))
    );
  }, []);
  const clearCart = useCallback(() => setCart([]), []);

  // ---- orders -------------------------------------------------------------
  const addOrder = useCallback(
    (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      if (USING_SUPABASE && sb && user)
        db.insertOrder(sb, user.id, order).catch((e) => reportError(e, "order"));
    },
    [sb, user, reportError]
  );
  const updateOrder = useCallback(
    (id: string, patch: Partial<Order>) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
      if (USING_SUPABASE && sb)
        db.updateOrder(sb, id, patch).catch((e) => reportError(e, "order"));
    },
    [sb, reportError]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      usingSupabase: USING_SUPABASE,
      user,
      login,
      signup,
      logout,
      updateUser,
      coach,
      clientUser,
      clientLogin,
      clientLoginOtp,
      clientLogout,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      clients,
      addClient,
      updateClient,
      mealPlans,
      saveMealPlan,
      deleteMealPlan,
      programs,
      saveProgram,
      deleteProgram,
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      conversations,
      sendMessage,
      markRead,
      createConversation,
      cart,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      orders,
      addOrder,
      updateOrder,
    }),
    [
      hydrated, user, login, signup, logout, updateUser,
      coach, clientUser, clientLogin, clientLoginOtp, clientLogout,
      products, addProduct, updateProduct, deleteProduct,
      clients, addClient, updateClient,
      mealPlans, saveMealPlan, deleteMealPlan,
      programs, saveProgram, deleteProgram,
      events, addEvent, updateEvent, deleteEvent,
      conversations, sendMessage, markRead, createConversation,
      cart, addToCart, removeFromCart, updateCartQty, clearCart,
      orders, addOrder, updateOrder,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
