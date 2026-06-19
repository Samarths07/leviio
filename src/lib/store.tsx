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
  DEMO_CREDENTIALS,
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
import { newTrialExpiry } from "./utils";
import { isOversized } from "./security";
import { makeGuestClient } from "./portal";

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
  // auth
  user: Creator | null;
  login: (email: string, password: string) => boolean;
  signup: (data: Partial<Creator> & { name: string; email: string }) => void;
  logout: () => void;
  updateUser: (patch: Partial<Creator>) => void;
  // client portal auth (the customer side)
  clientUser: Client | null;
  clientLogin: (email: string) => Client | null;
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
  const expiredNotified = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<Creator | null>(null);
  const [clientUser, setClientUser] = useState<Client | null>(null);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(seedMealPlans);
  const [programs, setPrograms] = useState<WorkoutProgram[]>(seedPrograms);
  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents);
  const [conversations, setConversations] =
    useState<Conversation[]>(seedConversations);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(seedOrders);

  // Hydrate + seed from localStorage on mount
  useEffect(() => {
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
  }, []);

  // Persisters
  const persist = useCallback(
    (key: string, value: unknown) => {
      if (hydrated) write(key, value);
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
  useEffect(() => persist(KEYS.cart, cart), [cart, persist]);
  useEffect(() => persist(KEYS.orders, orders), [orders, persist]);

  // Cross-tab sync: when another tab/window updates a slice in localStorage,
  // mirror it into this tab's state. This keeps the creator dashboard and the
  // client portal in lock-step across windows — e.g. live two-way messaging.
  useEffect(() => {
    if (!hydrated) return;
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
          write(KEYS.auth, downgraded);
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
  }, [hydrated, toast]);

  // ---- auth ----
  const login = useCallback((email: string, _password: string) => {
    // Mock auth: preserve an existing account's plan/expiry; brand-new logins
    // start on a fresh 1-month Pro trial (via normalizeUser).
    const existing = read<Creator | null>(KEYS.auth, null);
    const base = existing ?? seedCreator;
    expiredNotified.current = false;
    const u = normalizeUser({
      ...base,
      email: email || base.email || seedCreator.email,
    });
    setUser(u);
    write(KEYS.auth, u);
    return true;
  }, []);

  const signup = useCallback(
    (data: Partial<Creator> & { name: string; email: string }) => {
      // New sign-ups start their 1-month free Pro trial.
      const u = normalizeUser({
        ...seedCreator,
        ...data,
        id: "creator_" + Math.random().toString(36).slice(2, 8),
        username:
          data.username ||
          data.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16),
        isDemo: false,
        plan: "Pro",
        trial: true,
        planExpiresAt: newTrialExpiry(),
      });
      setUser(u);
      write(KEYS.auth, u);
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    write(KEYS.auth, null);
  }, []);

  const updateUser = useCallback((patch: Partial<Creator>) => {
    // Re-arm the expiry notification whenever the user (re)activates Pro.
    if (patch.plan === "Pro") expiredNotified.current = false;
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      write(KEYS.auth, next);
      return next;
    });
  }, []);

  // ---- client portal auth ----
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

  const clientLogout = useCallback(() => {
    setClientUser(null);
    write(KEYS.clientAuth, null);
  }, []);

  // ---- products ----
  const addProduct = useCallback(
    (p: Product) => setProducts((prev) => [p, ...prev]),
    []
  );
  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) =>
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      ),
    []
  );
  const deleteProduct = useCallback(
    (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)),
    []
  );

  // ---- clients ----
  const addClient = useCallback(
    (c: Client) => setClients((prev) => [c, ...prev]),
    []
  );
  const updateClient = useCallback(
    (id: string, patch: Partial<Client>) =>
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      ),
    []
  );

  // ---- meal plans ----
  const saveMealPlan = useCallback(
    (p: MealPlan) =>
      setMealPlans((prev) => {
        const exists = prev.some((x) => x.id === p.id);
        return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      }),
    []
  );
  const deleteMealPlan = useCallback(
    (id: string) => setMealPlans((prev) => prev.filter((p) => p.id !== id)),
    []
  );

  // ---- programs ----
  const saveProgram = useCallback(
    (p: WorkoutProgram) =>
      setPrograms((prev) => {
        const exists = prev.some((x) => x.id === p.id);
        return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      }),
    []
  );
  const deleteProgram = useCallback(
    (id: string) => setPrograms((prev) => prev.filter((p) => p.id !== id)),
    []
  );

  // ---- events ----
  const addEvent = useCallback(
    (e: CalendarEvent) => setEvents((prev) => [...prev, e]),
    []
  );
  const updateEvent = useCallback(
    (id: string, patch: Partial<CalendarEvent>) =>
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      ),
    []
  );
  const deleteEvent = useCallback(
    (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id)),
    []
  );

  // ---- conversations ----
  const sendMessage = useCallback(
    (conversationId: string, text: string, from: "creator" | "client" = "creator") => {
      const msg: Message = {
        id: "m_" + Math.random().toString(36).slice(2, 8),
        from,
        text,
        time: "now",
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, msg],
                // a client message is unread from the creator's perspective
                unread: from === "client" ? c.unread + 1 : c.unread,
              }
            : c
        )
      );
    },
    []
  );
  const markRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
    );
  }, []);
  // Find-or-create a thread for a client. Idempotent: a deterministic id keeps
  // repeated calls (and a follow-up sendMessage) pointing at the same thread.
  const createConversation = useCallback((client: Client): string => {
    const id = "conv_" + client.id;
    setConversations((prev) => {
      if (prev.some((c) => c.clientId === client.id)) return prev;
      return [
        {
          id,
          clientId: client.id,
          clientName: client.name,
          clientAvatar: client.avatarSeed,
          unread: 0,
          messages: [],
        },
        ...prev,
      ];
    });
    const existing = conversations.find((c) => c.clientId === client.id);
    return existing?.id ?? id;
  }, [conversations]);

  // ---- cart ----
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

  // ---- orders ----
  const addOrder = useCallback(
    (order: Order) => setOrders((prev) => [order, ...prev]),
    []
  );
  const updateOrder = useCallback(
    (id: string, patch: Partial<Order>) =>
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      ),
    []
  );

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      user,
      login,
      signup,
      logout,
      updateUser,
      clientUser,
      clientLogin,
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
      clientUser, clientLogin, clientLogout,
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
