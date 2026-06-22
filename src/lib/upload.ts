"use client";

import { getSupabaseBrowser } from "./supabase/config";

/**
 * Image uploads to the public `avatars` Supabase Storage bucket. Files live
 * under the user's own folder (`<userId>/...`), which the bucket's RLS policies
 * require (see supabase/schema.sql). Public-read so storefronts can display them.
 */
const BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function uploadImage(
  userId: string,
  prefix: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const sb = getSupabaseBrowser();
  if (!sb) return { error: "Storage isn't configured." };
  if (!userId) return { error: "You must be signed in to upload." };
  if (!file.type.startsWith("image/")) return { error: "Please choose an image file." };
  if (file.size > MAX_BYTES) return { error: "Image must be under 5 MB." };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  // Timestamped name busts the CDN cache so the new image shows immediately.
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: error.message };

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export function uploadAvatar(userId: string, file: File) {
  return uploadImage(userId, "avatar", file);
}

export function uploadProductImage(userId: string, file: File) {
  return uploadImage(userId, "products/product", file);
}
