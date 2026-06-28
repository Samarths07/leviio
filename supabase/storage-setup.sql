-- ============================================================================
-- Leviio — Storage setup (fixes "Bucket not found" on uploads)
-- ----------------------------------------------------------------------------
-- Safe to run anytime. It creates/updates the two storage buckets and their
-- access policies WITHOUT touching any of your data. Paste this whole file into
-- Supabase → SQL Editor → Run.
--
-- IMPORTANT about file size:
--   The per-bucket file_size_limit below can NEVER exceed your project's
--   GLOBAL "Upload file size limit" at Storage → Settings. That global limit is
--   capped at 50 MB on the free tier. To upload large videos/courses you must
--   raise the global limit there (requires the Pro plan for > 50 MB).
-- ============================================================================

-- 1) avatars — public images (profile photos, product images), 10 MB ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 2) product-files — PRIVATE digital deliverables (PDFs, videos, courses) ------
--    2 GB per-bucket ceiling (effective cap = your global limit; see note above)
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-files', 'product-files', false, 2147483648)
on conflict (id) do update set file_size_limit = 2147483648;

drop policy if exists "product-files owner all" on storage.objects;
create policy "product-files owner all" on storage.objects
  for all using (
    bucket_id = 'product-files' and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'product-files' and auth.uid()::text = (storage.foldername(name))[1]
  );
