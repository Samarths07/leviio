"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/config";
import { getMyReview, upsertReview } from "@/lib/supabase/db";
import { uid, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

/**
 * Lets a signed-in client leave (or edit) a review of their coach. RLS only
 * allows it if they've purchased from that creator; it then shows on the
 * creator's storefront.
 */
export function LeaveReview({
  coachId,
  coachName,
  clientName,
  clientEmail,
}: {
  coachId: string;
  coachName: string;
  clientName: string;
  clientEmail: string;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb || !coachId || !clientEmail) return;
    getMyReview(sb, coachId, clientEmail).then((r) => {
      if (r) {
        setExistingId(r.id);
        setRating(r.rating);
        setText(r.text);
      }
    });
  }, [coachId, clientEmail]);

  const submit = async () => {
    if (rating < 1) {
      toast("Pick a star rating first", { variant: "error" });
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setLoading(true);
    try {
      const id = existingId ?? uid("rev");
      await upsertReview(sb, {
        id,
        creatorId: coachId,
        clientEmail,
        clientName,
        rating,
        text: text.trim().slice(0, 600),
        createdAt: new Date().toISOString(),
      });
      setExistingId(id);
      toast(existingId ? "Review updated — thank you!" : "Thanks for your review!", {
        variant: "success",
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save your review.", {
        variant: "error",
      });
    }
    setLoading(false);
  };

  return (
    <Card className="p-5">
      <p className="font-bold text-foreground">
        {existingId ? "Your review" : `Rate your experience with ${coachName}`}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Shown publicly on {coachName.split(" ")[0]}&apos;s store.
      </p>

      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                (hover || rating) >= n ? "text-warning" : "text-muted-foreground"
              )}
              fill={(hover || rating) >= n ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder="Share a few words about your experience (optional)"
        className="mt-3"
      />

      <Button className="mt-3" onClick={submit} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {existingId ? "Update review" : "Submit review"}
      </Button>
    </Card>
  );
}
