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
import { getSupabaseBrowser } from "./supabase/config";
import * as db from "./supabase/db";
import type { Session } from "@supabase/supabase-js";

/**
 * Supabase-backed application store.
 *
 * All app data (profile, products, clients, plans, programs, events, orders,
 * messages) lives in Supabase Postgres — nothing is persisted to localStorage.
 * The only things kept in localStorage are the shopping cart (pre-checkout,
 * client-only) and the auth rate-limit counter (see src/lib/security.ts).
 *
 * Mutations update React state optimistically and persist to Supabase in the
 * background; failures are surfaced via toast without losing the optimistic UI.
 */

/**
 * Normalizes a stored creator into the current plan model: ensures a Pro plan
 * always has a trial flag + expiry so the countdown timer has something to show.
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

// The cart is the only app state kept client-side (it's pre-checkout and, for
// anonymous storefront buyers, has nowhere server-side to live yet).
const CART_KEY = "leviio_cart";

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(value: CartItem[]) {
  if (isOversized(value)) return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(value));
  } catch {
    /* quota exceeded or unavailable — ignore */
  }
}

interface AppContextValue {
  hydrated: boolean;
  // auth (creator)
  user: Creator | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    data: Partial<Creator> & { name: string; email: string; password?: string }
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (patch: Partial<Creator>) => void;
  // client portal auth (the customer side)
  /** The signed-in client's coach (public, email-free profile). */
  coach: Creator | null;
  clientUser: Client | null;
  /** Send a passwordless magic link to the client. Returns send status. */
  clientLogin: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; hasClient?: boolean }>;
  clientSignup: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; hasClient?: boolean }>;
  clientForgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updateAuthPassword: (password: string) => Promise<{ ok: boolean; error?: string }>;
  clientLogout: () => void;
  /** Re-fetch the signed-in client's own data (used by the approval waiting screen). */
  refreshClient: () => Promise<void>;
  // products
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // clients
  clients: Client[];
  addClient: (c: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  /** Grant a managed client portal access (one-time approval). */
  approveClient: (id: string) => void;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Surface a background-persistence failure without losing the optimistic UI.
  const reportError = useCallback(
    (err: unknown, what: string) => {
      console.error(`[leviio] failed to save ${what}`, err);
      // Surface the real reason (e.g. a missing column) instead of a vague
      // "check your connection" so schema/setup issues are obvious.
      const detail = err instanceof Error ? err.message : "";
      toast(detail || `Couldn't save ${what}. Check your connection.`, {
        variant: "error",
      });
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
    async (email: string): Promise<Client | null> => {
      if (!sb) return null;
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
        return null;
      }
      // First time a coach-added client signs in, turn their 'none' record into
      // a 'pending' request so the coach gets an Approve button.
      if (managed?.client && resolved.portalStatus === "none") {
        try {
          await fetch("/api/portal/request-access", { method: "POST" });
        } catch {
          // best-effort; the gate still blocks access until approved
        }
        resolved = { ...resolved, portalStatus: "pending" };
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
      return resolved;
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
    let active = true;
    setCart(readCart());

    if (!sb) {
      // Supabase isn't configured — render with empty state rather than crash.
      setHydrated(true);
      return;
    }

    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!active) return;
      await applySession(session);
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

  // Persist the cart (only) to localStorage.
  useEffect(() => {
    if (hydrated) writeCart(cart);
  }, [cart, hydrated]);

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
          if (sb) {
            db.updateProfile(sb, downgraded.id, {
              plan: "Free",
              trial: false,
              planExpiresAt: undefined,
            }).catch((e) => reportError(e, "your plan"));
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

  // ---- Realtime: live messaging -------------------------------------------
  // Append messages/threads created by the other party without a refresh.
  useEffect(() => {
    if (!sb || !hydrated || (!user && !clientUser)) return;
    const fmt = (iso?: string) => {
      try {
        return iso
          ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "now";
      } catch {
        return "now";
      }
    };
    const channel = sb
      .channel("rt-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as {
            id: string;
            conversation_id: string;
            sender: "creator" | "client";
            text: string;
            created_at: string;
          };
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== m.conversation_id) return c;
              if (c.messages.some((x) => x.id === m.id)) return c; // our own optimistic echo
              return {
                ...c,
                messages: [
                  ...c.messages,
                  { id: m.id, from: m.sender, text: m.text, time: fmt(m.created_at) },
                ],
                // a client message is unread from the creator's perspective
                unread: m.sender === "client" && !!user ? c.unread + 1 : c.unread,
              };
            })
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const conv = payload.new as {
            id: string;
            creator_id: string;
            client_id: string;
            client_name: string;
            client_avatar: string;
            unread: number;
          };
          if (!user || conv.creator_id !== user.id) return;
          setConversations((prev) =>
            prev.some((x) => x.id === conv.id)
              ? prev
              : [
                  {
                    id: conv.id,
                    clientId: conv.client_id,
                    clientName: conv.client_name,
                    clientAvatar: conv.client_avatar,
                    unread: conv.unread ?? 0,
                    messages: [],
                  },
                  ...prev,
                ]
          );
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, hydrated, user, clientUser]);

  // ---- auth ---------------------------------------------------------------
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!sb) {
        toast("Login unavailable — the database isn't connected.", {
          variant: "error",
        });
        return false;
      }
      expiredNotified.current = false;

      try {
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
        const fallbackName = md.name || data.user.email?.split("@")[0] || "Creator";
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
      } catch (e) {
        reportError(e, "login");
        return false;
      }
    },
    [sb, toast, loadCreatorData, reportError]
  );

  const signup = useCallback(
    async (
      data: Partial<Creator> & { name: string; email: string; password?: string }
    ): Promise<boolean> => {
      if (!sb) {
        toast("Sign-up unavailable — the database isn't connected.", {
          variant: "error",
        });
        return false;
      }
      const username =
        data.username ||
        data.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);

      try {
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
          toast(
            "Account created — check your email to confirm it, then log in. (Tip: turn off 'Confirm email' in Supabase to skip this.)",
            { variant: "info" }
          );
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
        await db.insertProfile(sb, creator);
        setUser(normalizeUser(creator));
        return true;
      } catch (e) {
        reportError(e, "your account");
        return false;
      }
    },
    [sb, toast, reportError]
  );

  const logout = useCallback(() => {
    setUser(null);
    sb?.auth.signOut();
  }, [sb]);

  const updateUser = useCallback(
    (patch: Partial<Creator>) => {
      // Re-arm the expiry notification whenever the user (re)activates Pro.
      if (patch.plan === "Pro") expiredNotified.current = false;
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        if (sb)
          db.updateProfile(sb, prev.id, patch).catch((e) =>
            reportError(e, "your profile")
          );
        return next;
      });
    },
    [sb, reportError]
  );

  // ---- client portal auth (email + password) ------------------------------
  // Existing client logs into the portal.
  const clientLogin = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string; hasClient?: boolean }> => {
      if (!sb) return { ok: false, error: "Supabase not configured" };
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session) {
        return { ok: false, error: error?.message ?? "Invalid email or password." };
      }
      const resolved = await loadClientData(email.trim());
      return { ok: true, hasClient: !!resolved };
    },
    [sb, loadClientData]
  );

  // First-time client creates their portal account (no email confirmation when
  // "Confirm email" is off in Supabase — so no SMTP needed).
  const clientSignup = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string; hasClient?: boolean }> => {
      if (!sb) return { ok: false, error: "Supabase not configured" };
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      if (!data.session) {
        return {
          ok: false,
          error: "Check your email to confirm your account, then log in.",
        };
      }
      const resolved = await loadClientData(email.trim());
      return { ok: true, hasClient: !!resolved };
    },
    [sb, loadClientData]
  );

  const clientLogout = useCallback(() => {
    setClientUser(null);
    setCoach(null);
    sb?.auth.signOut();
  }, [sb]);

  // Re-pull the signed-in client's record (e.g. to pick up a fresh approval).
  const refreshClient = useCallback(async () => {
    if (clientUser?.email) await loadClientData(clientUser.email);
  }, [clientUser, loadClientData]);

  // Email a password-reset link (needs SMTP configured in Supabase).
  const clientForgotPassword = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      if (!sb) return { ok: false, error: "Supabase not configured" };
      const base =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (typeof window !== "undefined" ? window.location.origin : "");
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${base}/auth/callback?next=/portal/reset`,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [sb]
  );

  // Set a new password for the currently-authenticated (recovery) session.
  const updateAuthPassword = useCallback(
    async (password: string): Promise<{ ok: boolean; error?: string }> => {
      if (!sb) return { ok: false, error: "Supabase not configured" };
      const { error } = await sb.auth.updateUser({ password });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [sb]
  );

  // ---- products -----------------------------------------------------------
  const addProduct = useCallback(
    (p: Product) => {
      setProducts((prev) => [p, ...prev]);
      if (sb && user)
        db.upsertProduct(sb, user.id, p).catch((e) => reportError(e, "product"));
    },
    [sb, user, reportError]
  );
  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) =>
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
        const updated = next.find((p) => p.id === id);
        if (sb && user && updated)
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
      if (sb) db.deleteProduct(sb, id).catch((e) => reportError(e, "product"));
    },
    [sb, reportError]
  );

  // ---- clients ------------------------------------------------------------
  const addClient = useCallback(
    (c: Client) => {
      setClients((prev) => [c, ...prev]);
      if (sb && user)
        db.upsertClient(sb, user.id, c).catch((e) => reportError(e, "client"));
    },
    [sb, user, reportError]
  );
  const updateClient = useCallback(
    (id: string, patch: Partial<Client>) =>
      setClients((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
        const updated = next.find((c) => c.id === id);
        if (sb && user && updated)
          db.upsertClient(sb, user.id, updated).catch((e) =>
            reportError(e, "client")
          );
        return next;
      }),
    [sb, user, reportError]
  );
  const approveClient = useCallback(
    (id: string) => updateClient(id, { portalStatus: "approved" }),
    [updateClient]
  );

  // ---- meal plans ---------------------------------------------------------
  const saveMealPlan = useCallback(
    (p: MealPlan) => {
      setMealPlans((prev) => {
        const exists = prev.some((x) => x.id === p.id);
        return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      });
      if (sb && user)
        db.upsertMealPlan(sb, user.id, p).catch((e) => reportError(e, "meal plan"));
    },
    [sb, user, reportError]
  );
  const deleteMealPlan = useCallback(
    (id: string) => {
      setMealPlans((prev) => prev.filter((p) => p.id !== id));
      if (sb) db.deleteMealPlan(sb, id).catch((e) => reportError(e, "meal plan"));
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
      if (sb && user)
        db.upsertProgram(sb, user.id, p).catch((e) => reportError(e, "program"));
    },
    [sb, user, reportError]
  );
  const deleteProgram = useCallback(
    (id: string) => {
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      if (sb) db.deleteProgram(sb, id).catch((e) => reportError(e, "program"));
    },
    [sb, reportError]
  );

  // ---- events -------------------------------------------------------------
  const addEvent = useCallback(
    (e: CalendarEvent) => {
      setEvents((prev) => [...prev, e]);
      if (sb && user)
        db.upsertEvent(sb, user.id, e).catch((err) => reportError(err, "event"));
    },
    [sb, user, reportError]
  );
  const updateEvent = useCallback(
    (id: string, patch: Partial<CalendarEvent>) =>
      setEvents((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        const updated = next.find((e) => e.id === id);
        if (sb && user && updated)
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
      if (sb) db.deleteEvent(sb, id).catch((err) => reportError(err, "event"));
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
      const msg: Message = { id: uid("m"), from, text, time: "now" };
      let nextUnread = 0;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          nextUnread = from === "client" ? c.unread + 1 : c.unread;
          return { ...c, messages: [...c.messages, msg], unread: nextUnread };
        })
      );
      if (sb) {
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
      if (sb) db.setConversationUnread(sb, conversationId, 0).catch(() => {});
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
      if (sb && user)
        db.insertConversation(sb, user.id, conv).catch((e) =>
          reportError(e, "conversation")
        );
      return conv.id;
    },
    [conversations, sb, user, reportError]
  );

  // ---- cart (client-only) -------------------------------------------------
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
      if (sb && user)
        db.insertOrder(sb, user.id, order).catch((e) => reportError(e, "order"));
    },
    [sb, user, reportError]
  );
  const updateOrder = useCallback(
    (id: string, patch: Partial<Order>) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
      if (sb) db.updateOrder(sb, id, patch).catch((e) => reportError(e, "order"));
    },
    [sb, reportError]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      user,
      login,
      signup,
      logout,
      updateUser,
      coach,
      clientUser,
      clientLogin,
      clientSignup,
      clientForgotPassword,
      updateAuthPassword,
      clientLogout,
      refreshClient,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      clients,
      addClient,
      updateClient,
      approveClient,
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
      coach, clientUser, clientLogin, clientSignup, clientForgotPassword, updateAuthPassword, clientLogout, refreshClient,
      products, addProduct, updateProduct, deleteProduct,
      clients, addClient, updateClient, approveClient,
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
