"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  Camera,
  Check,
  CreditCard,
  Lock,
  Monitor,
  Shield,
  Sparkles,
  Store as StoreIcon,
  Trash2,
  User,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { niches, pricingPlans, themeSwatches } from "@/lib/mock-data";
import { cn, formatCurrency, formatDate, newTrialExpiry } from "@/lib/utils";
import { PlanPurchaseDialog } from "@/components/dashboard/plan-purchase-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";

const tabs = [
  { value: "profile", label: "Profile", icon: User },
  { value: "store", label: "Store", icon: StoreIcon },
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
      {tab === "notifications" && <NotificationsTab toast={toast} />}
      {tab === "security" && <SecurityTab toast={toast} />}
    </div>
  );
}

function ProfileTab({ user, onSave, toast }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} seed={user.avatarSeed} size={64} ring />
          <Button variant="outline" size="sm" onClick={() => toast("Photo upload (demo).", { variant: "info" })}>
            <Camera className="h-4 w-4" /> Change photo
          </Button>
        </div>
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
  const locked = user.plan === "Free";
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
            <p className="mt-1 text-xs text-muted-foreground">leviio.app/{user.username}</p>
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
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Store visibility</p>
            <p className="text-xs text-muted-foreground">Make your store public or private</p>
          </div>
          <Switch checked onCheckedChange={() => toast("Visibility toggled (demo).", { variant: "info" })} aria-label="Store visibility" />
        </div>
        <div>
          <Label>Custom domain</Label>
          <div className={cn("relative", locked && "opacity-60")}>
            <Input placeholder="store.yourdomain.com" disabled={locked} />
            {locked && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-foreground">Custom domains are available on the Pro plan.</span>
              </div>
            )}
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
            <span className="flex h-10 w-14 items-center justify-center rounded-md bg-white/[0.06] text-xs font-bold text-foreground">VISA</span>
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
  const [twoFa, setTwoFa] = useState(false);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Current</Label><Input type="password" placeholder="••••••" /></div>
            <div><Label>New</Label><Input type="password" placeholder="••••••" /></div>
            <div><Label>Confirm</Label><Input type="password" placeholder="••••••" /></div>
          </div>
          <Button onClick={() => toast("Password updated", { variant: "success" })}>
            <Lock className="h-4 w-4" /> Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-bold text-foreground">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
          </div>
          <Switch checked={twoFa} onCheckedChange={(v) => { setTwoFa(v); toast(`2FA ${v ? "enabled" : "disabled"}`, { variant: "info" }); }} aria-label="Two-factor" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { device: "MacBook Pro · Chrome", loc: "Los Angeles, CA", current: true },
            { device: "iPhone 15 · Safari", loc: "Los Angeles, CA", current: false },
          ].map((s) => (
            <div key={s.device} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground">
                <Monitor className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{s.device}</p>
                <p className="text-xs text-muted-foreground">{s.loc}</p>
              </div>
              {s.current ? <Badge variant="success">This device</Badge> : (
                <Button size="sm" variant="ghost" onClick={() => toast("Session revoked", { variant: "info" })}>Revoke</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader><CardTitle className="text-danger">Danger Zone</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Delete account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data.</p>
          </div>
          <Button variant="danger" onClick={() => toast("Account deletion requires confirmation (demo).", { variant: "error" })}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
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
