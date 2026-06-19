"use client";

import { useState } from "react";
import { BadgeCheck, Check, Copy, ExternalLink, Share2, Upload } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { themeSwatches } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StoreProductCard } from "@/components/storefront/store-product-card";
import { ShareStoreDialog } from "@/components/dashboard/share-store-dialog";

export default function StorePage() {
  const { user, updateUser, products } = useApp();
  const { toast } = useToast();
  const [tagline, setTagline] = useState("Train smarter. Live stronger.");
  const [shareOpen, setShareOpen] = useState(false);

  const published = products.filter((p) => p.status === "Published");
  const accent = user?.bannerColor ?? "#7c3aed";
  const storeUrl = `leviio.app/${user?.username ?? "username"}`;

  const copyUrl = () => {
    navigator.clipboard?.writeText(`https://${storeUrl}`);
    toast("Store URL copied", { variant: "success" });
  };

  return (
    <div className="animate-fade-in space-y-5">
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
            <ExternalLink className="h-4 w-4" /> View Live Store
          </a>
        </div>
      </div>

      <ShareStoreDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        username={user?.username ?? "username"}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Preview */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="h-24" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }} />
              <div className="-mt-8 px-4 pb-4">
                <Avatar name={user?.name ?? "Creator"} seed={user?.avatarSeed} size={64} className="border-4 border-card" />
                <div className="mt-2 flex items-center gap-1.5">
                  <p className="font-extrabold text-foreground">{user?.name}</p>
                  <BadgeCheck className="h-4 w-4 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">{tagline}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{user?.bio}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {published.slice(0, 2).map((p) => (
                    <StoreProductCard key={p.id} product={p} accent={accent} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle>Store Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Store name</Label>
              <Input defaultValue={user?.name} onBlur={(e) => { updateUser({ name: e.target.value }); }} />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea defaultValue={user?.bio} rows={3} onBlur={(e) => updateUser({ bio: e.target.value })} />
            </div>
            <div>
              <Label>Color theme</Label>
              <div className="flex flex-wrap gap-2">
                {themeSwatches.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { updateUser({ bannerColor: s.value }); toast(`${s.name} theme applied`, { variant: "success" }); }}
                    aria-label={s.name}
                    className={cn(
                      "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                      accent === s.value ? "ring-white scale-110" : "ring-transparent"
                    )}
                    style={{ backgroundColor: s.value }}
                  >
                    {accent === s.value && <Check className="mx-auto h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Banner image</Label>
              <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/40 py-5 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" /> Upload banner (demo)
              </div>
            </div>
            <div>
              <Label>Store URL</Label>
              <div className="flex gap-2">
                <div className="flex h-10 flex-1 items-center rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  {storeUrl}
                </div>
                <Button variant="subtle" size="icon" onClick={copyUrl} aria-label="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Published products */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Published Products</CardTitle>
          <Badge variant="secondary">{published.length} live</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {published.map((p) => (
              <StoreProductCard key={p.id} product={p} accent={accent} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
