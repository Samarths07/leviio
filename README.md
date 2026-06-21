# Leviio

The all-in-one platform for fitness creators — sell programs, manage clients,
build diet & workout plans, schedule coaching, and give every client their own
portal.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and
**Recharts**.

> **Current state:** the app runs entirely in the browser on `localStorage`
> (see `src/lib/store.tsx`). It's a fully working **demo/prototype**. Auth and
> payments are simulated. The Supabase scaffolding below is the foundation for
> turning it into a real product.

---

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values (demo creds work out of the box)
npm run dev                  # http://localhost:3000
```

**Demo logins**
- Creator dashboard → `/login` → `demo@leviio.com` / `password123`
- Client portal → `/portal/login` → `jessica.moore@email.com`

---

## Deploy to Vercel (≈3 minutes)

The app builds and runs as-is — you can deploy the demo before adding Supabase.

### 1. Push to GitHub
```bash
git init
git add -A
git commit -m "Leviio: initial commit"
git branch -M main
git remote add origin https://github.com/<you>/leviio.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to **vercel.com → Add New → Project** and import the repo.
2. Framework preset auto-detects **Next.js** — leave build settings default.
3. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_DEMO_EMAIL` | `demo@leviio.com` |
   | `NEXT_PUBLIC_DEMO_PASSWORD` | `password123` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-app>.vercel.app` |
4. Click **Deploy**. Done — you get a live `https://<your-app>.vercel.app` URL.

> Add a custom domain later in **Vercel → Project → Settings → Domains**.

---

## Add Supabase (database + auth)

This turns the demo into a real product. The client helpers
(`src/lib/supabase/`) and schema (`supabase/schema.sql`) are already in place.

### 1. Create the project
1. Go to **supabase.com → New project**. Pick a region close to your users
   (e.g. Mumbai for India). Save the database password.
2. When it's ready, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)

### 2. Create the tables
1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and **Run**.
   This creates all tables, indexes, row-level-security policies, and a trigger
   that auto-creates a `profiles` row on signup.

### 3. Configure auth
1. **Authentication → Providers → Email**: enable it. Creators sign up/in with
   **email + password** (the signup/login pages). For the launch experience,
   turn **Confirm email OFF** (Providers → Email → uncheck *Confirm email*) so a
   new creator is signed in immediately. Leave it ON if you'd rather verify
   emails — the signup form will then say "check your email to confirm."
2. **Authentication → URL Configuration**: set **Site URL** to `https://leviio.com`
   and add `https://leviio.com/**` and `http://localhost:3000/**` to redirect URLs.
3. (Phase B) For the **client portal**, enable **Magic Link** — clients sign in
   passwordlessly with the email they purchased under.

### 4. Add the env vars
Locally in `.env.local`, and in **Vercel → Settings → Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
Redeploy so Vercel picks them up.

### 5. How the app uses Supabase (already wired)
The store is **dual-mode** ([`src/lib/store.tsx`](./src/lib/store.tsx)):

- **No env vars →** localStorage + seed data (the demo). Nothing to configure.
- **Env vars present →** real Supabase. On login the store loads that creator's
  data; every create/edit/delete is mirrored to Postgres through the data layer
  in [`src/lib/supabase/db.ts`](./src/lib/supabase/db.ts), and
  [`src/middleware.ts`](./src/middleware.ts) keeps the session fresh.

So **just adding the three env vars + running the schema switches the whole
creator side onto Supabase** — no code changes needed.

### 6. Verify against your live project (test checklist)
After setting env vars and redeploying:
1. **Sign up** at `/signup` → a row appears in **Table Editor → profiles**.
2. **Create a product** in the dashboard → appears in **products** (it's empty
   for new creators — that's correct; seed data only shows in demo mode).
3. **Add a client, a meal plan, a workout program, a calendar event** → each
   lands in its table.
4. **Log out and back in** → your data reloads (proves it's server-side, not
   localStorage).
5. **Open the app in another browser / device** and log in → same data.

### 7. Verify the storefront + client portal (Phase B — also wired)
- **Public storefront** (`/<your-username>`): in Supabase mode it loads the
  creator by username and their published products, and anonymous checkout
  writes real rows to `orders` (via the `storefront can create orders` policy).
  Test: open `/<username>` in a private window (logged out), buy a product, then
  check the **orders** table and your dashboard.
- **Client portal** (`/portal/login`): clients sign in with a **magic link**
  (Supabase email OTP) using the email they purchased under. After clicking the
  link they land in the portal and see their own orders, assigned plan/program,
  sessions and messages (CLIENT PORTAL POLICIES in `supabase/schema.sql`).
  → For this, enable **Magic Link** under Authentication → Providers → Email.

How the app tells creators and clients apart: a **creator has a `profiles` row**
(created by the app at signup); a **portal client has none** (magic-link only).
The store reads the session and routes accordingly — see `applySession()` in
`src/lib/store.tsx`.

**Known Phase-B edges to confirm live:** a magic-link user with *no* purchases is
bounced back to the portal login (no client record to show); real-time
cross-device message sync uses page reload (not Supabase Realtime yet).

---

## What's still simulated (roadmap to production)

| Area | Status |
|------|--------|
| Creator auth | ✅ Supabase email+password (dual-mode) |
| Creator data (products, clients, plans, programs, events, orders, messages) | ✅ Supabase Postgres + RLS |
| Public storefront (multi-tenant by username) | ✅ Supabase + public RLS |
| Client portal (magic-link, own data by email) | ✅ Supabase + client RLS |
| Payments | ❌ fake checkout → **Razorpay** (orders + webhooks) |
| Email | ❌ `mailto:` links → **Resend** (receipts, invites, bookings) |
| Files | ❌ generated `.txt` → Supabase Storage (PDFs, videos) |
| Real-time messaging | 🔶 reload-based → Supabase Realtime |

---

## Project structure

```
src/
  app/
    (marketing)/      Landing, features, pricing
    (auth)/           Creator login / signup / onboarding
    dashboard/        Creator app (products, clients, builders, orders…)
    [username]/       Public storefront
    book/[id]/        Public session booking
    portal/           Client portal (library, plan, sessions, messages)
  components/         UI + feature components
  lib/
    store.tsx         Global state (localStorage today)
    supabase/         Supabase client/server helpers (foundation)
    ...
supabase/
  schema.sql          Database schema + RLS policies
```
