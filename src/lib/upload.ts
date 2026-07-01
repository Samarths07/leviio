"use client";

import { getSupabaseBrowser } from "./supabase/config";

/** Turn raw Supabase Storage errors into something a creator can act on. */
function friendlyStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bucket not found")) {
    return "Storage bucket missing. Run the storage setup SQL in Supabase (supabase/storage-setup.sql).";
  }
  if (m.includes("exceeded the maximum allowed size") || m.includes("payload too large")) {
    return "File is larger than your Supabase upload limit. Raise it in Storage → Settings (or upgrade your plan).";
  }
  return message;
}

/**
 * Image uploads to the public `avatars` Supabase Storage bucket. Files live
 * under the user's own folder (`<userId>/...`), which the bucket's RLS policies
 * require (see supabase/schema.sql). Public-read so storefronts can display them.
 */
const BUCKET = "avatars";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function uploadImage(
  userId: string,
  prefix: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const sb = getSupabaseBrowser();
  if (!sb) return { error: "Storage isn't configured." };
  if (!userId) return { error: "You must be signed in to upload." };
  if (!file.type.startsWith("image/")) return { error: "Please choose an image file." };
  if (file.size > MAX_BYTES) return { error: "Image must be under 10 MB." };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  // Timestamped name busts the CDN cache so the new image shows immediately.
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: friendlyStorageError(error.message) };

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export function uploadAvatar(userId: string, file: File) {
  return uploadImage(userId, "avatar", file);
}

export function uploadProductImage(userId: string, file: File) {
  return uploadImage(userId, "products/product", file);
}

export function uploadBanner(userId: string, file: File) {
  return uploadImage(userId, "banner", file);
}

export function uploadExerciseImage(userId: string, file: File) {
  return uploadImage(userId, "exercises/exercise", file);
}

/**
 * Upload a digital product's deliverable file to the PRIVATE `product-files`
 * bucket. Returns the storage path (never public) — buyers download via a
 * server-issued signed URL after an ownership check (see /api/download).
 */
const FILES_BUCKET = "product-files";
// Client-side guard only. The real ceiling is your Supabase project's global
// "Upload file size limit" (Storage → Settings) and the bucket's file_size_limit.
// Free tier caps this at 50 MB; raise both to allow large videos/courses.
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export async function uploadProductFile(
  userId: string,
  file: File
): Promise<{ path?: string; name?: string; error?: string }> {
  const sb = getSupabaseBrowser();
  if (!sb) return { error: "Storage isn't configured." };
  if (!userId) return { error: "You must be signed in to upload." };
  if (file.size > MAX_FILE_BYTES) return { error: "File must be under 2 GB." };

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
  const path = `${userId}/files/${Date.now()}-${safe}`;
  const { error } = await sb.storage
    .from(FILES_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (error) return { error: friendlyStorageError(error.message) };
  return { path, name: file.name };
}
