"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Check,
  CreditCard,
  Lock,
  BadgeCheck,
  Shield,
  Sparkles,
  Store as StoreIcon,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { niches, pricingPlans, themeSwatches } from "@/lib/mock-data";
import { platformFeePercent, PLATFORM_FEE_FREE } from "@/lib/billing";
import { cn, formatCurrency, formatDate, newTrialExpiry } from "@/lib/utils";
import { PlanPurchaseDialog } from "@/components/dashboard/plan-purchase-dialog";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";

const tabs = [
  { value: "profile", label: "Profile", icon: User },
  { value: "store", label: "Store", icon: StoreIcon },
  { value: "payouts", label: "Payouts", icon: Wallet },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "security", label: "Security", icon: Shield },
];

function SettingsInner() {
  const params = useSearchParams();
  const { user, updateUser } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState(params.get("tab") ?? "profile");

  if (!user) return null;

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "profile" && <ProfileTab user={user} onSave={updateUser} toast={toast} />}
      {tab === "store" && <StoreTab user={user} onSave={updateUser} toast={toast} />}
      {tab === "billing" && (
        <BillingTab
          user={user}
          onPurchase={() => {
            updateUser({ plan: "Pro", trial: false, planExpiresAt: newTrialExpiry() });
            toast("Welcome to Pro! Your plan is active. 🎉", { variant: "success" });
          }}
          onStartTrial={() => {
            updateUser({ plan: "Pro", trial: true, planExpiresAt: newTrialExpiry() });
            toast("Your 1-month free Pro trial has started! 🎉", { variant: "success" });
          }}
          onDowngrade={() => {
            updateUser({ plan: "Free", trial: false, planExpiresAt: undefined });
            toast("Switched to the Free plan", { variant: "info" });
          }}
        />
      )}
      {tab === "payouts" && <PayoutsTab user={user} onSave={updateUser} toast={toast} />}
      {tab === "notifications" && <NotificationsTab toast={toast} />}
      {tab === "security" && <SecurityTab toast={toast} />}
    </div>
  );
}

function PayoutsTab({ user, onSave, toast }: any) {
  const connected = !!user.razorpayAccountId;
  const fee = platformFeePercent(user.plan);
  const creatorShare = 100 - fee;
  const isPro = user.plan === "Pro";
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Payouts</CardTitle>
          {connected ? (
            <Badge variant="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Connected</Badge>
          ) : (
            <Badge variant="warning">Not connected</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Storefront sales are split automatically with Razorpay Route: you keep{" "}
            <span className="font-semibold text-foreground">{creatorShare}%</span> of every sale,
            paid to your Razorpay linked account
            {fee > 0 ? `; Leviio keeps ${fee}% as platform fee` : " — no platform fee on Pro"}.
          </p>
          {!isPro && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">
                Free plan pays a {PLATFORM_FEE_FREE}% fee per sale.{" "}
                <a href="/dashboard/settings?tab=billing" className="font-semibold text-primary hover:underline">
                  Upgrade to Pro
                </a>{" "}
                to keep 100%.
              </span>
            </div>
          )}

          <div>
            <Label>Razorpay linked account ID</Label>
            <Input
              defaultValue={user.razorpayAccountId ?? ""}
              placeholder="acc_XXXXXXXXXXXX"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v === (user.razorpayAccountId ?? "")) return;
                onSave({ razorpayAccountId: v || undefined });
                toast(v ? "Payouts account saved" : "Payouts account removed", { variant: "success" });
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Until this is set, checkout on your storefront is disabled (so no sale is ever
              stranded).
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">How to get your linked account ID</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              <li>Your coach platform (Leviio) creates a Razorpay Route linked account for you, or you create one under Razorpay.</li>
              <li>Complete the quick KYC + add your bank account in Razorpay.</li>
              <li>Copy the account ID (starts with <span className="font-mono">acc_</span>) and paste it above.</li>
            </ol>
            <p className="mt-2">Payouts settle to your bank on Razorpay&rsquo;s standard schedule.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab({ user, onSave, toast }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <AvatarUpload
          userId={user.id}
          name={user.name}
          seed={user.avatarSeed}
          src={user.avatarUrl}
          onUploaded={(url) => onSave({ avatarUrl: url })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Display name</Label>
            <Input defaultValue={user.name} onBlur={(e) => onSave({ name: e.target.value })} />
          </div>
          <div>
            <Label>Username</Label>
            <Input defaultValue={user.username} onBlur={(e) => onSave({ username: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio</Label>
            <Textarea defaultValue={user.bio} rows={3} onBlur={(e) => onSave({ bio: e.target.value })} />
          </div>
          <div>
            <Label>Niche</Label>
            <Select defaultValue={user.niche} onChange={(e) => onSave({ niche: e.target.value })}>
              {niches.map((n: string) => <option key={n}>{n}</option>)}
            </Select>
          </div>
          <div>
            <Label>Location</Label>
            <Input defaultValue={user.location} onBlur={(e) => onSave({ location: e.target.value })} />
          </div>
          <div>
            <Label>Timezone</Label>
            <Select defaultValue="America/Los_Angeles">
              <option>America/Los_Angeles</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>Asia/Tokyo</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Default meeting link</Label>
            <Input
              defaultValue={user.meetingLink}
              onBlur={(e) => onSave({ meetingLink: e.target.value.trim() })}
              placeholder="https://meet.google.com/your-room  or  your Zoom link"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used as the join link for booked coaching sessions.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Social links</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["instagram", "youtube", "tiktok", "twitter", "website"] as const).map((s) => (
              <div key={s}>
                <Label className="capitalize">{s}</Label>
                <Input
                  defaultValue={user.socials?.[s] ?? ""}
                  placeholder={s === "website" ? "yoursite.com" : `@your${s}`}
                  onBlur={(e) => onSave({ socials: { ...user.socials, [s]: e.target.value } })}
                />
              </div>
            ))}
          </div>
        </div>
        <Button onClick={() => toast("Profile saved", { variant: "success" })}>Save Changes</Button>
      </CardContent>
    </Card>
  );
}

function StoreTab({ user, onSave, toast }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Store</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Store name</Label>
            <Input defaultValue={user.name} onBlur={(e) => onSave({ name: e.target.value })} />
          </div>
          <div>
            <Label>Store slug</Label>
            <Input defaultValue={user.username} onBlur={(e) => onSave({ username: e.target.value })} />
            <p className="mt-1 text-xs text-muted-foreground">leviio.com/{user.username}</p>
          </div>
        </div>
        <div>
          <Label>Theme color</Label>
          <div className="flex flex-wrap gap-2">
            {themeSwatches.map((s) => (
              <button
                key={s.value}
                onClick={() => onSave({ bannerColor: s.value })}
                aria-label={s.name}
                className={cn(
                  "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                  user.bannerColor === s.value ? "ring-white scale-110" : "ring-transparent"
                )}
                style={{ backgroundColor: s.value }}
              >
                {user.bannerColor === s.value && <Check className="mx-auto h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BillingTab({ user, onPurchase, onStartTrial, onDowngrade }: any) {
  const plan = pricingPlans.find((p) => p.name === user.plan) ?? pricingPlans[0];
  const isPro = user.plan === "Pro";
  const isTrial = isPro && user.trial;
  const expiry = user.planExpiresAt ? formatDate(user.planExpiresAt, "long") : null;
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-foreground">{plan.name} Plan</h3>
                <Badge variant="primary">Current</Badge>
                {isTrial && <Badge variant="success">Free trial</Badge>}
                {isPro && !isTrial && <Badge variant="success">Active</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                {plan.price > 0 && (
                  <span className="text-sm font-medium text-muted-foreground">/mo</span>
                )}
              </p>
              {isPro && expiry && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {isTrial ? `Free trial ends ${expiry}` : `Renews ${expiry}`} · auto-expires to Free if not renewed
                </p>
              )}
            </div>
            {isPro ? (
              <div className="flex gap-2">
                {isTrial && (
                  <Button onClick={() => setPurchaseOpen(true)}>
                    <Sparkles className="h-4 w-4" /> Upgrade to Paid
                  </Button>
                )}
                <Button variant="outline" onClick={onDowngrade}>
                  Cancel plan
                </Button>
              </div>
            ) : (
              <Button onClick={() => setPurchaseOpen(true)}>
                <Sparkles className="h-4 w-4" /> Upgrade to Pro
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5">
            {plan.features.map((f: string) => (
              <span key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-success" /> {f}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4">
            <span className="flex h-10 w-14 items-center justify-center rounded-md bg-foreground/[0.06] text-xs font-bold text-foreground">VISA</span>
            <div>
              <p className="text-sm font-semibold text-foreground">•••• •••• •••• 4242</p>
              <p className="text-xs text-muted-foreground">Expires 12/28</p>
            </div>
          </div>
          {isTrial && expiry && (
            <p className="mt-3 text-xs text-muted-foreground">
              You won&apos;t be charged during your free trial — it ends {expiry}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Billing History</CardTitle></CardHeader>
        <CardContent>
          {isPro ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-4 text-sm">
              <div>
                <p className="font-semibold text-foreground">
                  {isTrial ? "Upcoming charge" : "Next renewal"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.planExpiresAt ? formatDate(user.planExpiresAt, "medium") : "—"} · Pro monthly
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{formatCurrency(399)}</span>
                <Badge variant="warning">Scheduled</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No invoices yet. You&apos;re on the Free plan.
            </p>
          )}
        </CardContent>
      </Card>

      <PlanPurchaseDialog
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        showTrial={!isPro}
        onPurchase={() => { setPurchaseOpen(false); onPurchase(); }}
        onStartTrial={() => { setPurchaseOpen(false); onStartTrial(); }}
      />
    </div>
  );
}

function NotificationsTab({ toast }: any) {
  const items = [
    { key: "signup", label: "New client signup", desc: "When a new client joins" },
    { key: "purchase", label: "New purchase", desc: "When someone buys a product" },
    { key: "reminder", label: "Session reminder", desc: "24 hours before a session" },
    { key: "message", label: "Client message", desc: "When a client sends a message" },
    { key: "report", label: "Weekly revenue report", desc: "Emailed every Monday" },
    { key: "review", label: "Product review", desc: "When a product gets reviewed" },
  ];
  const [state, setState] = useState<Record<string, boolean>>({
    signup: true, purchase: true, reminder: true, message: true, report: false, review: true,
  });
  return (
    <Card>
      <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((i) => (
          <div key={i.key} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{i.label}</p>
              <p className="text-xs text-muted-foreground">{i.desc}</p>
            </div>
            <Switch
              checked={state[i.key]}
              onCheckedChange={(v) => { setState((s) => ({ ...s, [i.key]: v })); toast(`${i.label} ${v ? "on" : "off"}`, { variant: "info" }); }}
              aria-label={i.label}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SecurityTab({ toast }: any) {
  const { updateAuthPassword, logout } = useApp();
  const router = useRouter();
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const changePassword = async () => {
    if (pw.next.length < 6) return toast("Password must be at least 6 characters", { variant: "error" });
    if (pw.next !== pw.confirm) return toast("Passwords don't match", { variant: "error" });
    setSavingPw(true);
    const res = await updateAuthPassword(pw.next);
    setSavingPw(false);
    if (res.ok) {
      toast("Password updated", { variant: "success" });
      setPw({ next: "", confirm: "" });
    } else {
      toast(res.error ?? "Couldn't update password", { variant: "error" });
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleting(false);
        toast(data?.error ?? "Couldn't delete account", { variant: "error" });
        return;
      }
      logout();
      router.replace("/");
    } catch {
      setDeleting(false);
      toast("Couldn't delete account", { variant: "error" });
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
              />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={changePassword} disabled={savingPw}>
            <Lock className="h-4 w-4" /> {savingPw ? "Updating…" : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader><CardTitle className="text-danger">Danger Zone</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Delete account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data.</p>
          </div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        title="Delete your account?"
        size="sm"
      >
        <p className="text-sm text-muted-foreground">
          This permanently deletes your account, store, clients, products, plans and all other
          data. This <span className="font-semibold text-foreground">cannot be undone</span>.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={deleteAccount} disabled={deleting}>
            <Trash2 className="h-4 w-4" /> {deleting ? "Deleting…" : "Delete forever"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}
