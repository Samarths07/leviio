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
1. **Authentication → Providers → Email**: enable it. For the smoothest UX,
   turn on **Magic Link** (passwordless) — this is the recommended login for
   both creators and clients.
2. **Authentication → URL Configuration**: set **Site URL** to your Vercel URL
   and add `https://<your-app>.vercel.app/**` to redirect URLs.

### 4. Add the env vars
Locally in `.env.local`, and in **Vercel → Settings → Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
Redeploy so Vercel picks them up.

### 5. Wire the app to Supabase (the migration)
This is the remaining engineering work — swapping `localStorage` for real data:
- Replace the mock `login`/`signup` in `src/lib/store.tsx` with
  `supabase.auth.signInWithOtp()` / session handling.
- Replace each `useState(seed…)` slice with reads/writes against the matching
  Supabase table via the helpers in `src/lib/supabase/`.
- Add a `middleware.ts` to refresh the auth session on each request.
- Turn on the **CLIENT PORTAL POLICIES** block in `supabase/schema.sql` so
  clients can read their own purchases/plans/messages by email.

---

## What's still simulated (roadmap to production)

| Area | Now (demo) | Production |
|------|-----------|------------|
| Auth | mock email match | Supabase magic-link / OTP |
| Data | browser `localStorage` | Supabase Postgres + RLS |
| Payments | fake checkout | **Razorpay** (orders + webhooks) |
| Email | `mailto:` links | **Resend** (receipts, invites, bookings) |
| Files | generated `.txt` | Supabase Storage (PDFs, videos) |

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
