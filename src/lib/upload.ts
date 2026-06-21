"use client";

import { getSupabaseBrowser } from "./supabase/config";

/**
 * Uploads an avatar image to the public `avatars` Supabase Storage bucket under
 * the user's own folder (`<userId>/...`) and returns its public URL. The bucket
 * + RLS policies are created in supabase/schema.sql.
 */
const BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const sb = getSupabaseBrowser();
  if (!sb) return { error: "Storage isn't configured." };
  if (!userId) return { error: "You must be signed in to upload." };
  if (!file.type.startsWith("image/")) return { error: "Please choose an image file." };
  if (file.size > MAX_BYTES) return { error: "Image must be under 5 MB." };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  // Timestamped name busts the CDN cache so the new photo shows immediately.
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: error.message };

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
