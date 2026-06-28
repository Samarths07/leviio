-- ============================================================================
-- Leviio — Client portal approval gate
-- ----------------------------------------------------------------------------
-- Adds the portal_status column used to gate client portal access:
--   'none'     = added by the coach, hasn't signed up yet (no request).
--   'pending'  = the client signed up → request sent → coach can Approve.
--   'approved' = full portal access. (Storefront buyers are auto-approved.)
--
-- The coach only sees an Approve button once a client reaches 'pending' (i.e.
-- after they sign up at the portal). Safe to run anytime — it does NOT touch
-- existing data. Paste into Supabase → SQL Editor → Run.
-- ============================================================================

alter table public.clients
  add column if not exists portal_status text not null default 'none';

-- Replace any older 2-state constraint with the 3-state one.
alter table public.clients
  drop constraint if exists clients_portal_status_check;
alter table public.clients
  add constraint clients_portal_status_check
  check (portal_status in ('none', 'pending', 'approved'));

-- OPTIONAL: approve all existing clients immediately (uncomment to run):
-- update public.clients set portal_status = 'approved';
