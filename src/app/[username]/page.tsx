"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Instagram,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Youtube,
  X,
} from "lucide-react";
import { creator as seedCreator, findDiscount, type DiscountCode } from "@/lib/mock-data";
import type { CartItem, Creator, Product, Review } from "@/lib/types";
import { compactNumber, formatCurrency } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { getSupabaseBrowser } from "@/lib/supabase/config";
import * as db from "@/lib/supabase/db";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TikTokIcon } from "@/components/shared/icons";
import { StarRating } from "@/components/shared/star-rating";
import { StoreProductCard } from "@/components/storefront/store-product-card";
import { CheckoutModal } from "@/components/storefront/checkout-modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const tabs = ["All", "Programs", "Nutrition", "Coaching", "Merch"];

export default function StorefrontPage() {
  const { toast } = useToast();
  const { user } = useApp();
  const params = useParams();
  const username =
    typeof params?.username === "string"
      ? params.username
      : Array.isArray(params?.username)
        ? params.username[0]
        : "";

  // Load the store owner + their published products by username (Supabase).
  const [sbProfile, setSbProfile] = useState<Creator | null>(null);
  const [sbProducts, setSbProducts] = useState<Product[]>([]);
  const [sbReviews, setSbReviews] = useState<Review[]>([]);
  const [sbLoading, setSbLoading] = useState(true);
  const [sbNotFound, setSbNotFound] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb || !username) {
      setSbNotFound(true);
      setSbLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setSbLoading(true);
      const prof = await db.getProfileByUsername(sb, username);
      if (!active) return;
      if (!prof) {
        setSbNotFound(true);
        setSbLoading(false);
        return;
      }
      setSbProfile(prof);
      setSbProducts(await db.listPublishedProducts(sb, prof.id));
      const revs = await db.listReviews(sb, prof.id);
      if (active) setSbReviews(revs);
      if (active) setSbLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [username]);

  // The store owner loaded by username (seedCreator is only a load-time default
  // for the accent color; the real UI renders after the guards below).
  const profile = sbProfile ?? seedCreator;
  const accent = profile.bannerColor;
  const published = sbProducts;
  const avgRating = sbReviews.length
    ? sbReviews.reduce((s, r) => s + r.rating, 0) / sbReviews.length
    : 0;

  const [tab, setTab] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [discount, setDiscount] = useState<DiscountCode | null>(null);

  const filtered = tab === "All" ? published : published.filter((p) => p.category === tab);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discountAmount = discount ? Math.round((subtotal * discount.percent) / 100) : 0;
  const total = subtotal - discountAmount;

  const applyCode = () => {
    const found = findDiscount(codeInput);
    if (found) {
      setDiscount(found);
      toast(`Code applied — ${found.label}`, { variant: "success" });
    } else {
      toast("Invalid discount code", { variant: "error" });
    }
  };

  const add = (p: Product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === p.id);
      return ex
        ? prev.map((i) => (i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { product: p, quantity: 1 }];
    });
    toast(`${p.name} added to cart`, { variant: "success" });
    setCartOpen(true);
  };
  const setQty = (id: string, q: number) =>
    setCart((prev) => (q <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, quantity: q } : i))));

  // Loading / store-not-found states.
  if (sbLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (sbNotFound || !sbProfile) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        <p className="text-lg font-bold text-foreground">Store not found</p>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a creator at{" "}
          <span className="font-semibold">/{username}</span>.
        </p>
        <Link
          href={user ? "/dashboard" : "/"}
          className="mt-1 text-sm font-semibold text-primary hover:underline"
        >
          {user ? "Back to dashboard" : "Go home"}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Minimal nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo href={user ? "/dashboard" : "/"} />
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link href="/portal" className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground sm:block">
                  My purchases
                </Link>
                <Link href="/signup" className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground sm:block">
                  Sign up to sell
                </Link>
              </>
            )}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-white/[0.06]"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white" style={{ backgroundColor: accent }}>
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="h-40 sm:h-52" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }} />
      <div className="mx-auto max-w-5xl px-4">
        <div className="-mt-14 flex flex-col items-center text-center">
          <Avatar name={profile.name} seed={profile.avatarSeed} src={profile.avatarUrl} size={104} className="border-4 border-background" />
          <div className="mt-3 flex items-center gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{profile.name}</h1>
            <BadgeCheck className="h-6 w-6 text-success" />
          </div>
          <Badge variant="primary" className="mt-2">{profile.niche}</Badge>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>

          <div className="mt-4 flex gap-2">
            {[Instagram, Youtube, TikTokIcon].map((Icon, i) => (
              <a key={i} href="#" aria-label="Social" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 sm:gap-6 sm:px-6">
            <Stat label="Clients Coached" value={compactNumber(profile.followers)} />
            <span className="h-8 w-px bg-border" />
            <Stat label="Products" value={String(published.length)} />
            {sbReviews.length > 0 && (
              <>
                <span className="h-8 w-px bg-border" />
                <Stat label="Rating" value={`${avgRating.toFixed(1)}★`} />
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="no-scrollbar mt-8 flex justify-start gap-2 overflow-x-auto sm:justify-center">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                tab === t ? "text-white" : "border border-border text-muted-foreground hover:text-foreground"
              )}
              style={tab === t ? { backgroundColor: accent } : undefined}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">No products here yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tab === "All" ? "Check back soon." : "Try another category."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {filtered.map((p) => (
              <StoreProductCard key={p.id} product={p} accent={accent} onAdd={add} />
            ))}
          </div>
        )}

        {/* Reviews (only when real ones exist) */}
        {sbReviews.length > 0 && (
          <section className="mt-14">
            <h2 className="text-center text-2xl font-extrabold tracking-tight text-foreground">
              What clients are saying
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sbReviews.slice(0, 8).map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                  <StarRating rating={r.rating} size={14} />
                  {r.text && (
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                      “{r.text}”
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2.5">
                    <Avatar name={r.clientName || "Client"} seed={r.clientEmail} size={34} ring />
                    <p className="text-sm font-bold text-foreground">
                      {r.clientName || "Verified client"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-14 border-t border-border py-8 text-center">
          <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            Powered by <Logo href="/" />
          </div>
        </footer>
      </div>

      {/* Cart drawer */}
      <div
        onClick={() => setCartOpen(false)}
        className={cn("fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity", cartOpen ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-background transition-transform duration-300",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ShoppingBag className="h-5 w-5" style={{ color: accent }} /> Your Cart ({count})
          </h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add a product to get started.</p>
          </div>
        ) : (
          <>
            <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
              {cart.map((i) => (
                <div key={i.product.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold text-foreground">{i.product.name}</p>
                    <p className="text-sm font-bold" style={{ color: accent }}>{formatCurrency(i.product.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <button onClick={() => setQty(i.product.id, i.quantity - 1)} aria-label="Decrease" className="flex h-7 w-7 items-center justify-center text-foreground"><Minus className="h-3 w-3" /></button>
                        <span className="w-7 text-center text-sm font-semibold text-foreground">{i.quantity}</span>
                        <button onClick={() => setQty(i.product.id, i.quantity + 1)} aria-label="Increase" className="flex h-7 w-7 items-center justify-center text-foreground"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => setQty(i.product.id, 0)} aria-label="Remove" className="ml-auto text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4">
              {/* Discount code */}
              {discount ? (
                <div className="mb-3 flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-success">
                    <Tag className="h-3.5 w-3.5" /> {discount.code} · {discount.percent}% off
                  </span>
                  <button onClick={() => { setDiscount(null); setCodeInput(""); }} aria-label="Remove code" className="text-success/70 hover:text-success">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mb-3 flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 32))}
                    onKeyDown={(e) => e.key === "Enter" && applyCode()}
                    maxLength={32}
                    placeholder="Discount code"
                    className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm uppercase text-foreground placeholder:normal-case placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none"
                  />
                  <Button size="sm" variant="subtle" onClick={applyCode}>Apply</Button>
                </div>
              )}
              {!discount && (
                <p className="mb-3 text-center text-xs text-muted-foreground">
                  Have a code? Try <span className="font-bold" style={{ color: accent }}>FIT20</span>
                </p>
              )}

              <div className="mb-3 space-y-1 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-success">
                    <span>Discount</span>
                    <span>−{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border pt-1.5 text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <Button className="w-full" style={{ backgroundColor: accent }} onClick={() => { setCartOpen(false); setCheckout(true); }}>
                Checkout
              </Button>
            </div>
          </>
        )}
      </aside>

      <CheckoutModal
        open={checkout}
        onClose={() => setCheckout(false)}
        items={cart}
        total={total}
        accent={accent}
        creatorId={profile.id}
        discountCode={discount?.code}
        storeName={profile.name}
        onPaid={() => {
          // Orders are created server-side after Razorpay verifies the payment.
          setCart([]);
          setDiscount(null);
          setCodeInput("");
          toast("Thank you for your purchase!", { variant: "success" });
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
