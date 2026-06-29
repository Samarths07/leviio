"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Instagram,
  Loader2,
  Monitor,
  Share2,
  Smartphone,
  Twitter,
  Youtube,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { themeSwatches } from "@/lib/mock-data";
import { uploadBanner } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TikTokIcon } from "@/components/shared/icons";
import { StoreProductCard } from "@/components/storefront/store-product-card";
import { ShareStoreDialog } from "@/components/dashboard/share-store-dialog";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import type { Creator } from "@/lib/types";

type Socials = Creator["socials"];

const socialFields = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "instagram.com/you" },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "youtube.com/@you" },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon, placeholder: "tiktok.com/@you" },
  { key: "twitter", label: "X (Twitter)", icon: Twitter, placeholder: "x.com/you" },
  { key: "website", label: "Website", icon: Globe, placeholder: "yoursite.com" },
] as const;

export default function StorePage() {
  const { user, updateUser, products } = useApp();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [socials, setSocials] = useState<Socials>(user?.socials ?? {});
  const [bannerBusy, setBannerBusy] = useState(false);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSocials(user?.socials ?? {});
  }, [user?.socials]);

  const published = products.filter((p) => p.status === "Published");
  const accent = user?.bannerColor ?? "#7c3aed";
  const bannerUrl = socials.bannerUrl;
  const storeUrl = `leviio.com/${user?.username ?? "username"}`;

  const copyUrl = () => {
    navigator.clipboard?.writeText(`https://${storeUrl}`);
    toast("Store URL copied", { variant: "success" });
  };

  const saveSocial = (key: keyof Socials, value: string) => {
    const next = { ...socials, [key]: value.trim() || undefined };
    setSocials(next);
    updateUser({ socials: next });
  };

  const onBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setBannerBusy(true);
    const res = await uploadBanner(user.id, file);
    setBannerBusy(false);
    if (res.url) {
      const next = { ...socials, bannerUrl: res.url };
      setSocials(next);
      updateUser({ socials: next });
      toast("Banner updated", { variant: "success" });
    } else {
      toast(res.error ?? "Upload failed", { variant: "error" });
    }
  };

  const removeBanner = () => {
    const next = { ...socials, bannerUrl: undefined };
    setSocials(next);
    updateUser({ socials: next });
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">My Store</h2>
          <p className="text-sm text-muted-foreground">Customize how customers see your storefront.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <a
            href={`/${user?.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "md" })}
          >
            <ExternalLink className="h-4 w-4" /> View live store
          </a>
        </div>
      </div>

      <ShareStoreDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        username={user?.username ?? "username"}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ----------------------- Editor ----------------------- */}
        <div className="space-y-5">
          {/* Brand */}
          <Card>
            <CardHeader><CardTitle>Brand</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Profile photo</Label>
                <AvatarUpload
                  userId={user?.id ?? ""}
                  name={user?.name ?? "Creator"}
                  seed={user?.avatarSeed}
                  src={user?.avatarUrl}
                  onUploaded={(url) => updateUser({ avatarUrl: url })}
                />
              </div>

              <div>
                <Label>Banner image</Label>
                <input ref={bannerInput} type="file" accept="image/*" hidden onChange={onBannerChange} />
                <div
                  className="relative flex h-28 items-end overflow-hidden rounded-xl border border-border"
                  style={
                    bannerUrl
                      ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: `linear-gradient(135deg, ${accent}, ${accent}88)` }
                  }
                >
                  <div className="flex w-full items-center justify-between gap-2 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <Button type="button" size="sm" variant="subtle" disabled={bannerBusy} onClick={() => bannerInput.current?.click()}>
                      {bannerBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      {bannerUrl ? "Replace" : "Upload banner"}
                    </Button>
                    {bannerUrl && (
                      <Button type="button" size="sm" variant="ghost" onClick={removeBanner}>Remove</Button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Wide image works best (e.g. 1500×500). Falls back to your color.</p>
              </div>

              <div>
                <Label>Accent color</Label>
                <div className="flex flex-wrap gap-2">
                  {themeSwatches.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { updateUser({ bannerColor: s.value }); toast(`${s.name} theme applied`, { variant: "success" }); }}
                      aria-label={s.name}
                      className={cn(
                        "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                        accent === s.value ? "scale-110 ring-white" : "ring-transparent"
                      )}
                      style={{ backgroundColor: s.value }}
                    >
                      {accent === s.value && <Check className="mx-auto h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Store name</Label>
                <Input defaultValue={user?.name} onBlur={(e) => updateUser({ name: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input defaultValue={user?.niche} placeholder="e.g. Strength Coach" onBlur={(e) => updateUser({ niche: e.target.value })} />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea defaultValue={user?.bio} rows={3} onBlur={(e) => updateUser({ bio: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* Social links */}
          <Card>
            <CardHeader><CardTitle>Social links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {socialFields.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <Input
                        defaultValue={socials[f.key] ?? ""}
                        placeholder={f.placeholder}
                        onBlur={(e) => saveSocial(f.key, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Link */}
          <Card>
            <CardHeader><CardTitle>Your store link</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex h-10 flex-1 items-center rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  {storeUrl}
                </div>
                <Button variant="subtle" size="icon" onClick={copyUrl} aria-label="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ----------------------- Live preview ----------------------- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Live preview</CardTitle>
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setDevice("mobile")}
                  aria-label="Mobile preview"
                  className={cn("rounded-md p-1.5", device === "mobile" ? "bg-primary text-white" : "text-muted-foreground")}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDevice("desktop")}
                  aria-label="Desktop preview"
                  className={cn("rounded-md p-1.5", device === "desktop" ? "bg-primary text-white" : "text-muted-foreground")}
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border border-border bg-background transition-all",
                    device === "mobile" ? "w-[300px]" : "w-full"
                  )}
                >
                  {/* Banner */}
                  <div
                    className="h-24"
                    style={
                      bannerUrl
                        ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { background: `linear-gradient(135deg, ${accent}, ${accent}88)` }
                    }
                  />
                  <div className="-mt-10 flex flex-col items-center px-4 pb-5 text-center">
                    <Avatar name={user?.name ?? "Creator"} seed={user?.avatarSeed} src={user?.avatarUrl} size={72} className="border-4 border-background" />
                    <div className="mt-2 flex items-center gap-1.5">
                      <p className="font-extrabold text-foreground">{user?.name}</p>
                      <BadgeCheck className="h-4 w-4 text-success" />
                    </div>
                    {user?.niche && <Badge variant="primary" className="mt-1.5">{user.niche}</Badge>}
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{user?.bio}</p>

                    {/* Social icons (only the ones set) */}
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {socialFields.map((f) => {
                        const val = socials[f.key];
                        if (!val) return null;
                        const Icon = f.icon;
                        return (
                          <span key={f.key} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </span>
                        );
                      })}
                    </div>

                    {/* Products */}
                    <div className={cn("mt-4 grid w-full gap-2", device === "mobile" ? "grid-cols-2" : "grid-cols-3")}>
                      {published.slice(0, device === "mobile" ? 2 : 3).map((p) => (
                        <StoreProductCard key={p.id} product={p} accent={accent} />
                      ))}
                    </div>
                    {published.length === 0 && (
                      <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-xs text-muted-foreground">
                        Publish products to show them here.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Published products */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Published products</CardTitle>
          <Badge variant="secondary">{published.length} live</Badge>
        </CardHeader>
        <CardContent>
          {published.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm font-semibold text-foreground">No published products yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Publish products to make them appear on your store.</p>
              <a href="/dashboard/products" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>Go to products</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {published.map((p) => (
                <StoreProductCard key={p.id} product={p} accent={accent} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
