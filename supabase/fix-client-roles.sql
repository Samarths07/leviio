-- ============================================================================
-- Leviio — Fix accounts wrongly turned into creators
-- ----------------------------------------------------------------------------
-- An earlier bug auto-created a creator "profiles" row for any account that
-- logged in via the creator login — including client accounts. Those accounts
-- now wrongly have creator dashboard access. The code is fixed going forward;
-- this cleans up accounts that were already mis-promoted.
--
-- Run in Supabase → SQL Editor.
-- ============================================================================

-- 1) INSPECT — list profiles whose email is also a managed client. Review these;
--    a real coach who also buys from another coach could legitimately appear,
--    so confirm before deleting.
select p.id, p.email, p.username, p.created_at
from public.profiles p
where exists (
  select 1 from public.clients c where lower(c.email) = lower(p.email)
);

-- 2) DELETE one specific mis-promoted account's creator profile (recommended).
--    Replace the email. Their CLIENT record stays intact; they become client-only.
-- delete from public.profiles where lower(email) = lower('ssb123singh@gmail.com');

-- 3) (Optional) Also remove their auth user entirely so they can re-register
--    cleanly is NOT needed — deleting the profile is enough to make them a client.
