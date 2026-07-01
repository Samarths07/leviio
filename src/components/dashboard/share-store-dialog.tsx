"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Send, Share2, Twitter } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ShareStoreDialog({
  open,
  onClose,
  username,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
}) {
  const { toast } = useToast();
  const [origin, setOrigin] = useState("https://leviio.com");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
    }
  }, []);

  const url = `${origin}/${username}`;
  const prettyUrl = `${origin.replace(/^https?:\/\//, "")}/${username}`;
  const shareText = `Check out my fitness store! Train with me at`;

  const copy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    toast("Store link copied", { variant: "success" });
    setTimeout(() => setCopied(false), 1800);
  };

  const open_ = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const channels = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}` },
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}` },
    { label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${encodeURIComponent("My Leviio store")}&body=${encodeURIComponent(`${shareText} ${url}`)}` },
  ];

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&color=fafafa&bgcolor=18-18-27&data=${encodeURIComponent(url)}`;

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "My Leviio store", text: shareText, url });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Share your store" description="Get your link out and grow your client base." size="sm">
      {/* QR */}
      <div className="flex flex-col items-center">
        <div className="rounded-2xl border border-border bg-muted p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Store QR code" width={160} height={160} className="h-40 w-40 rounded-lg" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Scan to open your store</p>
      </div>

      {/* Link + copy */}
      <div className="mt-4">
        <div className="flex gap-2">
          <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-input bg-background px-3 text-sm text-foreground">
            <span className="truncate">{prettyUrl}</span>
          </div>
          <Button variant="subtle" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Social channels */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {channels.map((c) => (
          <button
            key={c.label}
            onClick={() => open_(c.href)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/40"
          >
            <c.icon className="h-5 w-5 text-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">{c.label}</span>
          </button>
        ))}
      </div>

      {canNativeShare && (
        <Button className="mt-4 w-full" variant="outline" onClick={nativeShare}>
          <Share2 className="h-4 w-4" /> More sharing options
        </Button>
      )}
    </Dialog>
  );
}
