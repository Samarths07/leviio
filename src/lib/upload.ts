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

/**
 * Upload a digital product's deliverable file to the PRIVATE `product-files`
 * bucket. Returns the storage path (never public) — buyers download via a
 * server-issued signed URL after an ownership check (see /api/download).
 */
const FILES_BUCKET = "product-files";
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB (Supabase free-tier limit)

export async function uploadProductFile(
  userId: string,
  file: File
): Promise<{ path?: string; name?: string; error?: string }> {
  const sb = getSupabaseBrowser();
  if (!sb) return { error: "Storage isn't configured." };
  if (!userId) return { error: "You must be signed in to upload." };
  if (file.size > MAX_FILE_BYTES) return { error: "File must be under 50 MB." };

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
  const path = `${userId}/files/${Date.now()}-${safe}`;
  const { error } = await sb.storage
    .from(FILES_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (error) return { error: error.message };
  return { path, name: file.name };
}
