"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import type { Client } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function InvitePortalDialog({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client: Client;
}) {
  const { user } = useApp();
  const { toast } = useToast();
  const [origin, setOrigin] = useState("https://leviio.com");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const sendEmailInvite = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/email/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: client.email }),
      });
      if (res.ok) {
        toast(`Invite emailed to ${client.email}`, { variant: "success" });
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error ?? "Couldn't send invite", { variant: "error" });
      }
    } catch {
      toast("Couldn't send invite", { variant: "error" });
    }
    setSending(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const coach = user?.name ?? "Your coach";
  const first = client.name.split(" ")[0];
  const url = `${origin}/portal/login`;
  const prettyUrl = `${origin.replace(/^https?:\/\//, "")}/portal/login`;
  const message = `Hi ${first}! I've set up your private client portal on Leviio — your plan, sessions and our chat all live there. Sign in at ${url} using your email (${client.email}). See you inside! — ${coach}`;

  const copyLink = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    toast("Portal link copied", { variant: "success" });
    setTimeout(() => setCopied(false), 1800);
  };
  const copyMessage = () => {
    navigator.clipboard?.writeText(message);
    toast("Invite message copied", { variant: "success" });
  };
  const open_ = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&color=fafafa&bgcolor=18-18-27&data=${encodeURIComponent(url)}`;

  const channels = [
    {
      label: "Email",
      icon: Mail,
      href: `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent("Your client portal access")}&body=${encodeURIComponent(message)}`,
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite to client portal"
      description={`Send ${first} their secure login.`}
      size="sm"
    >
      {/* QR */}
      <div className="flex flex-col items-center">
        <div className="rounded-2xl border border-border bg-muted p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Portal login QR code" width={160} height={160} className="h-40 w-40 rounded-lg" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Scan to open the portal login</p>
      </div>

      {/* Link + copy */}
      <div className="mt-4 flex gap-2">
        <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <span className="truncate">{prettyUrl}</span>
        </div>
        <Button variant="subtle" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* Send a real email invite */}
      <Button className="mt-3 w-full" onClick={sendEmailInvite} disabled={sending}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {sending ? "Sending..." : `Email invite to ${first}`}
      </Button>

      {/* Or share manually */}
      <p className="mt-3 text-center text-xs text-muted-foreground">or share manually</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {channels.map((c) => (
          <button
            key={c.label}
            onClick={() => open_(c.href)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 p-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
          >
            <c.icon className="h-4 w-4" /> {c.label}
          </button>
        ))}
      </div>

      <Button variant="outline" className="mt-2 w-full" onClick={copyMessage}>
        <Copy className="h-4 w-4" /> Copy invite message
      </Button>

      {/* How access works */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-foreground/90">
          {first} signs in with{" "}
          <span className="font-semibold">{client.email}</span> — no password to
          create. Their assigned plan, sessions and your chat are already waiting.
        </p>
      </div>
    </Dialog>
  );
}
