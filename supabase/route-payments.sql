-- ============================================================================
-- Leviio — Razorpay Route payouts
-- ----------------------------------------------------------------------------
-- Stores each creator's Razorpay Route linked-account id so storefront sales
-- can be split to them automatically (platform keeps a commission). Private —
-- NOT exposed in the public_profiles view. Idempotent. Run in SQL Editor.
-- ============================================================================

alter table public.profiles
  add column if not exists razorpay_account_id text;
