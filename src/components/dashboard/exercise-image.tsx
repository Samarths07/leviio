"use client";

import { useEffect, useRef, useState } from "react";
import { Dumbbell, ImagePlus, Loader2 } from "lucide-react";
import { uploadExerciseImage } from "@/lib/upload";
import { useToast } from "@/components/ui/toast";

/**
 * Square exercise photo that auto-adjusts any image (object-cover) to a fixed
 * box — so uploads of any aspect ratio always look consistent. When `editable`,
 * hovering shows an upload overlay; used read-only in the client's plan view.
 */
export function ExerciseImage({
  userId,
  src,
  onUploaded,
  editable = true,
  size = 44,
}: {
  userId: string;
  src?: string;
  onUploaded?: (url: string) => void;
  editable?: boolean;
  size?: number;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(src);

  useEffect(() => setPreview(src), [src]);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    setBusy(true);
    const res = await uploadExerciseImage(userId, file);
    setBusy(false);
    if (res.url) {
      setPreview(res.url);
      onUploaded?.(res.url);
    } else {
      toast(res.error ?? "Upload failed", { variant: "error" });
    }
  };

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg border border-border bg-background"
      style={{ width: size, height: size }}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Exercise" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Dumbbell className="h-4 w-4" />
        </span>
      )}
      {editable && (
        <>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChange} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Upload exercise photo"
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </button>
        </>
      )}
    </div>
  );
}
