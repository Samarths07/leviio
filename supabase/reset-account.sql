-- ============================================================================
-- Leviio — Reset a test account by email
-- ----------------------------------------------------------------------------
-- "An account with this email already exists" means that email already has an
-- auth user (e.g. you created it earlier as a client). One email = one account,
-- and an account is EITHER a creator (has a profiles row) OR a client (none) —
-- it can't be both.
--
-- To reuse an email, fully remove it first. Replace the email below and run in
-- Supabase → SQL Editor. (Or just delete the user in Authentication → Users.)
-- ============================================================================

-- Remove the creator profile (if any). Cascades to that creator's data.
delete from public.profiles
where lower(email) = lower('ssb123singh@gmail.com');

-- Remove any managed-client record(s) created for this email by a coach.
delete from public.clients
where lower(email) = lower('ssb123singh@gmail.com');

-- Remove the auth login itself so the email is free to sign up again.
delete from auth.users
where lower(email) = lower('ssb123singh@gmail.com');
