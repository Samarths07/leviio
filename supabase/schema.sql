-- ============================================================================
-- Leviio — Supabase schema
-- Run this in the Supabase dashboard → SQL Editor (or `supabase db push`).
-- It creates the tables, indexes and row-level-security policies the app needs.
--
-- Model: every row belongs to a creator (creator_id -> auth.users.id). A creator
-- can only read/write their own data. Client-portal access is handled by matching
-- the signed-in user's email to a client/order row (see the CLIENT POLICIES note
-- at the bottom).
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles  (one row per creator, linked to the auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text not null,
  email           text not null,
  username        text unique not null,
  niche           text default '',
  bio             text default '',
  location        text default '',
  avatar_seed     text default '',
  avatar_url      text default '',
  meeting_link    text default '',
  banner_color    text default '#7c3aed',
  followers       integer default 0,
  plan            text default 'Free' check (plan in ('Free', 'Pro')),
  plan_expires_at timestamptz,
  trial           boolean default false,
  socials           jsonb default '{}'::jsonb,
  coaching_packages jsonb default '[]'::jsonb,
  session_notes     jsonb default '[]'::jsonb,
  created_at        timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          text primary key default gen_random_uuid()::text,
  creator_id  uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('Digital', 'Physical', 'Service', 'Membership')),
  category    text not null,
  description text default '',
  price       numeric not null default 0,
  compare_at  numeric,
  status      text default 'Draft' check (status in ('Published', 'Draft')),
  image_seed  text default '',
  tags        text[] default '{}',
  -- type-specific extras (fileType, weight, sku, stock, duration, etc.)
  meta        jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists products_creator_idx on public.products (creator_id);

-- ---------------------------------------------------------------------------
-- clients  (the creator's coaching clients)
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id            text primary key default gen_random_uuid()::text,
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  handle        text default '',
  email         text not null,
  phone         text default '',
  goal          text default 'Maintain',
  status        text default 'Active' check (status in ('Active', 'Inactive', 'VIP')),
  -- Portal access gate: 'none' = added but not signed up; 'pending' = signed up
  -- and awaiting the creator's one-time approval; 'approved' = full access.
  portal_status text not null default 'none' check (portal_status in ('none', 'pending', 'approved')),
  avatar_seed   text default '',
  start_date    timestamptz default now(),
  meal_plan_id  text,
  program_id    text,
  notes         text default '',
  -- metrics: weighIns, measurements, sessions, payments, etc.
  metrics       jsonb default '{}'::jsonb,
  created_at    timestamptz default now()
);
create index if not exists clients_creator_idx on public.clients (creator_id);
create index if not exists clients_email_idx on public.clients (lower(email));

-- ---------------------------------------------------------------------------
-- meal_plans
-- ---------------------------------------------------------------------------
create table if not exists public.meal_plans (
  id             text primary key default gen_random_uuid()::text,
  creator_id     uuid not null references public.profiles (id) on delete cascade,
  name           text not null,
  client         text,
  calorie_target integer default 0,
  protein        integer default 0,
  carbs          integer default 0,
  fat            integer default 0,
  diet_type      text[] default '{}',
  days           jsonb default '[]'::jsonb,
  updated_at     timestamptz default now()
);
create index if not exists meal_plans_creator_idx on public.meal_plans (creator_id);

-- ---------------------------------------------------------------------------
-- workout_programs
-- ---------------------------------------------------------------------------
create table if not exists public.workout_programs (
  id            text primary key default gen_random_uuid()::text,
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  goal          text default '',
  weeks         integer default 0,
  days_per_week integer default 0,
  difficulty    text default '',
  equipment     text default '',
  client        text,
  schedule      jsonb default '[]'::jsonb,
  updated_at    timestamptz default now()
);
create index if not exists programs_creator_idx on public.workout_programs (creator_id);

-- ---------------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_events (
  id           text primary key default gen_random_uuid()::text,
  creator_id   uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  type         text default 'Coaching Session',
  client_id    text,
  client_name  text,
  date         date not null,
  time         text default '09:00',
  duration     integer default 60,
  meeting_link text,
  notes        text default '',
  color        text default '#7c3aed'
);
create index if not exists events_creator_idx on public.calendar_events (creator_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id           text primary key,                 -- human-friendly e.g. #LV-20001
  creator_id   uuid not null references public.profiles (id) on delete cascade,
  client_name  text not null,
  client_email text,
  product      text not null,
  product_id   text,
  type         text,
  quantity     integer default 1,
  amount       numeric not null default 0,
  date         date default now(),
  status       text default 'Completed' check (status in ('Completed', 'Processing', 'Refunded')),
  method       text default 'Card',
  fulfillment  text,
  address      text,
  tracking     text,
  session_date timestamptz,
  razorpay_order_id text,
  created_at   timestamptz default now()
);
create index if not exists orders_creator_idx on public.orders (creator_id);
create index if not exists orders_email_idx on public.orders (lower(client_email));
create index if not exists orders_rzp_idx on public.orders (razorpay_order_id);

-- ---------------------------------------------------------------------------
-- conversations + messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id            text primary key default gen_random_uuid()::text,
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  client_id     text,
  client_name   text not null,
  client_avatar text default '',
  unread        integer default 0,
  created_at    timestamptz default now()
);
create index if not exists conversations_creator_idx on public.conversations (creator_id);

create table if not exists public.messages (
  id              text primary key default gen_random_uuid()::text,
  conversation_id text not null references public.conversations (id) on delete cascade,
  sender          text not null check (sender in ('creator', 'client')),
  text            text not null,
  created_at      timestamptz default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles         enable row level security;
alter table public.products         enable row level security;
alter table public.clients          enable row level security;
alter table public.meal_plans       enable row level security;
alter table public.workout_programs enable row level security;
alter table public.calendar_events  enable row level security;
alter table public.orders           enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;

-- Profiles: a user manages only their own profile.
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Public storefronts need a creator's NON-sensitive profile fields (name, bio,
-- avatar, etc.) but must NOT expose their email. A broad "public read" on the
-- table would leak every creator's email to anyone with the anon key, so we
-- instead publish a column-filtered VIEW and keep the base table readable only
-- by its owner (the "own profile" policy above).
create or replace view public.public_profiles as
  select id, name, username, niche, bio, location,
         avatar_seed, avatar_url, meeting_link, banner_color, followers, socials
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Helper macro-style policy: each creator-owned table is gated on creator_id.
create policy "own products"  on public.products         for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "own clients"   on public.clients          for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "own mealplans" on public.meal_plans       for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "own programs"  on public.workout_programs  for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "own events"    on public.calendar_events   for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "own orders"    on public.orders            for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "own convos"    on public.conversations     for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "own messages"  on public.messages          for all using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.creator_id = auth.uid())
) with check (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.creator_id = auth.uid())
);

-- Published products are publicly readable so storefronts work for anonymous buyers.
create policy "public read published products" on public.products
  for select using (status = 'Published');

-- ============================================================================
-- STOREFRONT ORDER CREATION
-- ----------------------------------------------------------------------------
-- An anonymous storefront buyer must be able to create an order against a real
-- creator. We allow inserts only when the target creator_id is a real profile.
-- (When real payments go live, move this behind a server action using the
-- service-role key for stronger guarantees.)
-- ============================================================================
create policy "storefront can create orders" on public.orders
  for insert with check (
    exists (select 1 from public.profiles p where p.id = creator_id)
  );

-- ============================================================================
-- CLIENT PORTAL POLICIES
-- ----------------------------------------------------------------------------
-- Clients sign in with a magic link (email OTP). We match the signed-in user's
-- email to their rows so they can read their own purchases, plans and messages.
-- ============================================================================
-- A client reads order rows placed under their email.
create policy "client reads own orders" on public.orders
  for select using (lower(client_email) = lower(auth.jwt() ->> 'email'));

-- A client updates their own order (e.g. booking a session date).
create policy "client updates own orders" on public.orders
  for update using (lower(client_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(client_email) = lower(auth.jwt() ->> 'email'));

-- A client reads their own managed-client record.
create policy "client reads self" on public.clients
  for select using (lower(email) = lower(auth.jwt() ->> 'email'));

-- A client reads a meal plan / program that is assigned to their client record.
create policy "client reads assigned mealplan" on public.meal_plans
  for select using (
    exists (
      select 1 from public.clients c
      where c.meal_plan_id = meal_plans.id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );
create policy "client reads assigned program" on public.workout_programs
  for select using (
    exists (
      select 1 from public.clients c
      where c.program_id = workout_programs.id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- A client reads calendar events booked for them.
create policy "client reads own events" on public.calendar_events
  for select using (
    exists (
      select 1 from public.clients c
      where c.id = calendar_events.client_id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- A client reads + writes their own conversation thread and its messages.
create policy "client reads own convo" on public.conversations
  for select using (
    exists (
      select 1 from public.clients c
      where c.id = conversations.client_id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- A client may bump the unread counter on their own thread (when they message).
create policy "client updates own convo" on public.conversations
  for update using (
    exists (
      select 1 from public.clients c
      where c.id = conversations.client_id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  ) with check (
    exists (
      select 1 from public.clients c
      where c.id = conversations.client_id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );
create policy "client rw own messages" on public.messages
  for all using (
    exists (
      select 1 from public.conversations conv
      join public.clients c on c.id = conv.client_id
      where conv.id = messages.conversation_id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  ) with check (
    sender = 'client' and exists (
      select 1 from public.conversations conv
      join public.clients c on c.id = conv.client_id
      where conv.id = messages.conversation_id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- NOTE: profiles are created by the app on CREATOR signup (see signup() in
-- src/lib/store.tsx), not by a trigger. This is deliberate: "has a profile row"
-- is how the app distinguishes a creator from a portal client (who signs in via
-- magic link and never gets a profile). The drops below clean up any trigger
-- from an earlier version of this schema.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ---------------------------------------------------------------------------
-- reviews  (clients review the creator they bought from; shown on storefronts)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id           text primary key default gen_random_uuid()::text,
  creator_id   uuid not null references public.profiles (id) on delete cascade,
  product_id   text,
  client_email text not null,
  client_name  text default '',
  rating       integer not null check (rating between 1 and 5),
  text         text default '',
  created_at   timestamptz default now()
);
create index if not exists reviews_creator_idx on public.reviews (creator_id);

alter table public.reviews enable row level security;

-- Reviews are public (so storefronts can show them).
drop policy if exists "public read reviews" on public.reviews;
create policy "public read reviews" on public.reviews
  for select using (true);

-- A client can write/edit a review only for a creator they've purchased from,
-- and only under their own email.
drop policy if exists "client manage own review" on public.reviews;
create policy "client manage own review" on public.reviews
  for all
  using (lower(client_email) = lower(auth.jwt() ->> 'email'))
  with check (
    lower(client_email) = lower(auth.jwt() ->> 'email')
    and exists (
      select 1 from public.orders o
      where o.creator_id = reviews.creator_id
        and lower(o.client_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ============================================================================
-- STORAGE: avatars bucket (uploaded profile photos)
-- ----------------------------------------------------------------------------
-- Public-read bucket; each user can write only to their own folder (<uid>/...).
-- The app uploads to `avatars/<userId>/avatar-*.png` (see src/lib/upload.ts).
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 10485760) -- 10 MB
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

-- ----------------------------------------------------------------------------
-- STORAGE: product-files bucket (PRIVATE — digital product deliverables)
-- Not public. Buyers download via short-lived signed URLs from /api/download
-- after an ownership check; only the owning creator can read/write directly.
-- ----------------------------------------------------------------------------
-- file_size_limit here is the per-bucket ceiling. It can never exceed your
-- project's GLOBAL "Upload file size limit" (Storage → Settings), which is
-- capped at 50 MB on the free tier — raise that to allow large videos/courses.
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-files', 'product-files', false, 2147483648) -- 2 GB
on conflict (id) do update set file_size_limit = 2147483648;

drop policy if exists "product-files owner all" on storage.objects;
create policy "product-files owner all" on storage.objects
  for all using (
    bucket_id = 'product-files' and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'product-files' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- REALTIME: live messaging
-- ----------------------------------------------------------------------------
-- Add messaging tables to the realtime publication so the client receives
-- inserts live (see the Realtime subscription in src/lib/store.tsx). RLS still
-- applies, so each side only receives rows it's allowed to read.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;
