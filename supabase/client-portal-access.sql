-- ============================================================================
-- Leviio — Client portal access (RLS) + realtime
-- ----------------------------------------------------------------------------
-- Run this if assigned plans/sessions don't show in the portal or messages
-- don't appear live. It (re)creates the client-side RLS policies and adds the
-- messaging tables to the realtime publication. Idempotent — safe to re-run,
-- does NOT touch data. Paste into Supabase → SQL Editor → Run.
--
-- (The app also reads/sends client data via a service-role route, so the portal
--  works even without this — but this enables direct reads + live updates.)
-- ============================================================================

-- Clients read their own record.
drop policy if exists "client reads self" on public.clients;
create policy "client reads self" on public.clients
  for select using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Orders placed under the client's email.
drop policy if exists "client reads own orders" on public.orders;
create policy "client reads own orders" on public.orders
  for select using (lower(client_email) = lower(auth.jwt() ->> 'email'));
drop policy if exists "client updates own orders" on public.orders;
create policy "client updates own orders" on public.orders
  for update using (lower(client_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(client_email) = lower(auth.jwt() ->> 'email'));

-- Assigned meal plan + workout program.
drop policy if exists "client reads assigned mealplan" on public.meal_plans;
create policy "client reads assigned mealplan" on public.meal_plans
  for select using (
    exists (select 1 from public.clients c
            where c.meal_plan_id = meal_plans.id
              and lower(c.email) = lower(auth.jwt() ->> 'email'))
  );
drop policy if exists "client reads assigned program" on public.workout_programs;
create policy "client reads assigned program" on public.workout_programs
  for select using (
    exists (select 1 from public.clients c
            where c.program_id = workout_programs.id
              and lower(c.email) = lower(auth.jwt() ->> 'email'))
  );

-- Sessions booked for the client.
drop policy if exists "client reads own events" on public.calendar_events;
create policy "client reads own events" on public.calendar_events
  for select using (
    exists (select 1 from public.clients c
            where c.id = calendar_events.client_id
              and lower(c.email) = lower(auth.jwt() ->> 'email'))
  );

-- Conversation thread + messages.
drop policy if exists "client reads own convo" on public.conversations;
create policy "client reads own convo" on public.conversations
  for select using (
    exists (select 1 from public.clients c
            where c.id = conversations.client_id
              and lower(c.email) = lower(auth.jwt() ->> 'email'))
  );
drop policy if exists "client updates own convo" on public.conversations;
create policy "client updates own convo" on public.conversations
  for update using (
    exists (select 1 from public.clients c
            where c.id = conversations.client_id
              and lower(c.email) = lower(auth.jwt() ->> 'email'))
  ) with check (
    exists (select 1 from public.clients c
            where c.id = conversations.client_id
              and lower(c.email) = lower(auth.jwt() ->> 'email'))
  );
drop policy if exists "client rw own messages" on public.messages;
create policy "client rw own messages" on public.messages
  for all using (
    exists (select 1 from public.conversations conv
            join public.clients c on c.id = conv.client_id
            where conv.id = messages.conversation_id
              and lower(c.email) = lower(auth.jwt() ->> 'email'))
  ) with check (
    sender = 'client' and exists (
      select 1 from public.conversations conv
      join public.clients c on c.id = conv.client_id
      where conv.id = messages.conversation_id
        and lower(c.email) = lower(auth.jwt() ->> 'email'))
  );

-- Realtime: deliver new messages/threads live to the side allowed to read them.
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;
