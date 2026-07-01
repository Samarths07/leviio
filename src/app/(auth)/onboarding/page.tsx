"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Package,
  Target,
  Users,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { niches, themeSwatches } from "@/lib/mock-data";
import { LIMITS } from "@/lib/security";
import { cn } from "@/lib/utils";

const steps = ["Profile", "Store", "Get Started"];

const firstActions = [
  { icon: Package, title: "Add a Product", desc: "Create your first sellable program or guide.", href: "/dashboard/products" },
  { icon: Users, title: "Import Clients", desc: "Bring your existing clients into the CRM.", href: "/dashboard/clients" },
  { icon: Target, title: "Set up Coaching", desc: "Configure your coaching packages.", href: "/dashboard/coaching" },
  { icon: Compass, title: "Explore the Dashboard", desc: "Take a tour of everything Leviio offers.", href: "/dashboard" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    username: user?.username ?? "",
    bio: "",
    niche: user?.niche ?? niches[0],
  });
  const [store, setStore] = useState({
    color: themeSwatches[0].value,
    tagline: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");

  const progress = ((step + 1) / steps.length) * 100;

  const finish = (href: string) => {
    updateUser({
      name: profile.name || user?.name,
      username:
        profile.username ||
        (profile.name || user?.name || "creator")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
      niche: profile.niche,
      bio: profile.bio || user?.bio,
      avatarUrl: photoUrl || undefined,
      bannerColor: store.color,
      socials: {
        instagram: store.instagram,
        youtube: store.youtube,
        tiktok: store.tiktok,
      },
    });
    toast("You're all set! Welcome to Leviio 🎉", { variant: "success" });
    router.push(href);
  };

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        </div>

        {/* Progress */}
        <div className="mt-8">
          <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
            <span>
              Step {step + 1} of {steps.length}
            </span>
            <span>{steps[step]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-8 animate-fade-in">
          {step === 0 && (
            <Step title="Set up your profile" subtitle="Tell your future clients who you are.">
              <AvatarUpload
                userId={user?.id ?? ""}
                name={profile.name || "You"}
                seed={profile.name}
                src={photoUrl}
                onUploaded={setPhotoUrl}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Display name</Label>
                  <Input
                    value={profile.name}
                    maxLength={LIMITS.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Alisha Fernandez"
                  />
                </div>
                <div>
                  <Label>Username (store URL)</Label>
                  <div className="flex items-center rounded-lg border border-input bg-background pl-3 text-sm focus-within:border-primary/60">
                    <span className="text-muted-foreground">leviio.com/</span>
                    <input
                      value={profile.username}
                      maxLength={LIMITS.code}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
                        })
                      }
                      placeholder="username"
                      className="h-10 flex-1 bg-transparent px-1 text-foreground outline-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={profile.bio}
                  maxLength={LIMITS.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Helping busy people get fit and feel confident..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Niche</Label>
                <Select
                  value={profile.niche}
                  onChange={(e) => setProfile({ ...profile, niche: e.target.value })}
                >
                  {niches.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </Select>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="Customize your store" subtitle="Make it yours. You can change this anytime.">
              <div>
                <Label>Store banner color</Label>
                <div className="flex flex-wrap gap-2">
                  {themeSwatches.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStore({ ...store, color: s.value })}
                      aria-label={s.name}
                      className={cn(
                        "h-10 w-10 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                        store.color === s.value ? "ring-white scale-110" : "ring-transparent"
                      )}
                      style={{ backgroundColor: s.value }}
                    >
                      {store.color === s.value && (
                        <Check className="mx-auto h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Store tagline</Label>
                <Input
                  value={store.tagline}
                  maxLength={LIMITS.short}
                  onChange={(e) => setStore({ ...store, tagline: e.target.value })}
                  placeholder="Train smarter. Live stronger."
                />
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">SOCIAL LINKS</p>
                <div className="space-y-3">
                  {(["instagram", "youtube", "tiktok"] as const).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="w-20 text-sm capitalize text-muted-foreground">{s}</span>
                      <Input
                        value={store[s]}
                        maxLength={LIMITS.short}
                        onChange={(e) => setStore({ ...store, [s]: e.target.value })}
                        placeholder={`@your${s}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="What do you want to do first?" subtitle="Jump straight into the action.">
              <div className="grid gap-3 sm:grid-cols-2">
                {firstActions.map((a) => (
                  <button
                    key={a.title}
                    onClick={() => finish(a.href)}
                    className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:ring-1 hover:ring-primary/30 hover:border-primary/40"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <a.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Step>
          )}
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 2 && (
            <Button onClick={() => setStep((s) => s + 1)}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}
