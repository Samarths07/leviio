-- ============================================================================
-- Leviio — Client portal approval gate
-- ----------------------------------------------------------------------------
-- Adds the portal_status column used to gate client portal access. A client
-- added by a creator starts 'pending'; the creator approves them once (one
-- click on the Clients page) before they can see the portal. Storefront buyers
-- are auto-approved by the app.
--
-- Safe to run anytime — it does NOT touch existing data. Paste into
-- Supabase → SQL Editor → Run.
-- ============================================================================

alter table public.clients
  add column if not exists portal_status text not null default 'pending';

-- Constrain to the two valid states (added separately so re-runs don't error).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clients_portal_status_check'
  ) then
    alter table public.clients
      add constraint clients_portal_status_check
      check (portal_status in ('pending', 'approved'));
  end if;
end $$;

-- OPTIONAL: if you already have existing clients you trust and want them to
-- have portal access immediately, approve them all in one go by uncommenting:
-- update public.clients set portal_status = 'approved';
