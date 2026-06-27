"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { uploadAvatar } from "@/lib/upload";

/**
 * Avatar preview + "Change photo" button. Uploads to Supabase Storage and calls
 * onUploaded with the public URL so the parent can persist it.
 */
export function AvatarUpload({
  userId,
  name,
  seed,
  src,
  size = 64,
  onUploaded,
}: {
  userId: string;
  name: string;
  seed?: string;
  src?: string;
  size?: number;
  onUploaded: (url: string) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(src);

  // Keep the preview in sync with the saved photo (it loads async after mount,
  // and can change elsewhere) — otherwise this shows a stale/generated avatar.
  useEffect(() => {
    setPreview(src);
  }, [src]);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setBusy(true);
    const res = await uploadAvatar(userId, file);
    setBusy(false);
    if (res.url) {
      setPreview(res.url);
      onUploaded(res.url);
      toast("Photo updated", { variant: "success" });
    } else {
      toast(res.error ?? "Upload failed", { variant: "error" });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} seed={seed} src={preview} size={size} ring />
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChange} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {busy ? "Uploading..." : "Change photo"}
      </Button>
    </div>
  );
}
