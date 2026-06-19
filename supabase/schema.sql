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
  banner_color    text default '#7c3aed',
  followers       integer default 0,
  plan            text default 'Free' check (plan in ('Free', 'Pro')),
  plan_expires_at timestamptz,
  trial           boolean default false,
  socials         jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
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
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  handle        text default '',
  email         text not null,
  phone         text default '',
  goal          text default 'Maintain',
  status        text default 'Active' check (status in ('Active', 'Inactive', 'VIP')),
  avatar_seed   text default '',
  start_date    timestamptz default now(),
  meal_plan_id  uuid,
  program_id    uuid,
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
  id             uuid primary key default gen_random_uuid(),
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
  id            uuid primary key default gen_random_uuid(),
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
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  type         text default 'Coaching Session',
  client_id    uuid,
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
  product_id   uuid,
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
  created_at   timestamptz default now()
);
create index if not exists orders_creator_idx on public.orders (creator_id);
create index if not exists orders_email_idx on public.orders (lower(client_email));

-- ---------------------------------------------------------------------------
-- conversations + messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  client_id     uuid,
  client_name   text not null,
  client_avatar text default '',
  unread        integer default 0,
  created_at    timestamptz default now()
);
create index if not exists conversations_creator_idx on public.conversations (creator_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
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

-- Public can read a profile by username (needed for public storefronts).
create policy "public read profiles" on public.profiles
  for select using (true);

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
-- CLIENT PORTAL POLICIES (add when you wire client auth)
-- ----------------------------------------------------------------------------
-- Clients sign in too (magic link). Match the signed-in email to their rows so
-- they can read their own purchases / plans / messages. Example:
--
--   create policy "client reads own orders" on public.orders
--     for select using (lower(client_email) = lower(auth.jwt() ->> 'email'));
--
-- Mirror this for clients (email), and for messages/conversations via client_id.
-- ============================================================================

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1) || '-' || substr(new.id::text, 1, 6))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
