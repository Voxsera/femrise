# Fem Rise Club — 30 Day Sports Challenge

Next.js 15 (App Router) · Tailwind CSS · Framer Motion · Supabase · Razorpay

## Run it

```bash
npm install
cp .env.example .env.local   # optional — without keys the site runs on demo data
npm run dev
```

Open http://localhost:3000

## Connect the backend (Supabase)

1. Create a project at supabase.com (region: Mumbai).
2. SQL Editor → paste `supabase/schema.sql` → Run. This creates all tables, security rules (RLS), streak/points logic, storage buckets and the first challenge.
3. Authentication → Providers → Email: turn **Confirm email** off for the smoothest signup → payment flow (or keep it on; the flow handles both).
4. Copy the URL, anon key and service role key into `.env.local`.
5. Sign up on the site, then make yourself admin in the SQL editor:
   `update profiles set role = 'admin' where username = 'your_username';`
6. Database → Extensions → enable `pg_cron`, then run the `cron.schedule(...)` line at the bottom of `schema.sql`.

## Google sign-in

1. Google Cloud Console → APIs & Services → OAuth consent screen → External → app name "Femrise!", support email → save.
2. Credentials → Create credentials → OAuth client ID → Web application.
   - Authorized JavaScript origins: `http://localhost:3000` (+ your live domain later)
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Sign In / Providers → Google → enable, paste the Client ID and Client Secret.
4. Supabase → Authentication → URL Configuration → Site URL `http://localhost:3000`; Redirect URLs: `http://localhost:3000/auth/callback` (+ `https://<domain>/auth/callback`).

Google users are asked for username, phone, city and sport on /join before paying.
If you ran schema.sql before this was added, also run `supabase/migrations/002_google_auth.sql`.

## Connect payments (Razorpay)

1. Add the key id, key secret and a webhook secret to `.env.local`.
2. Razorpay Dashboard → Webhooks → URL `https://<domain>/api/payments/webhook`, events `payment.captured`, `order.paid`, `payment.failed`.
3. Amounts always come from the challenge settings in the database, never from the browser.

## What still needs a decision from Fem Rise Club

- **Daily check-in deadline**: `challenges.checkin_deadline` is empty on purpose. Until it's set, nobody gets marked as missed.
- **Missed day without Restore**: `unrestored_miss_policy` is `eliminate` by default (the Restore window lasts until the next day's deadline). It can be switched to `reset_streak`.
- Start date, points values, prize terms and community guidelines: all live in the `challenges` table and will be editable from the admin dashboard.

## Structure

```
src/app                  pages + API routes (payments, cron)
src/components/landing   landing page sections
src/components/join      signup → payment flow, login
src/lib                  env, types, defaults, data loaders, Supabase + Razorpay helpers
supabase/schema.sql      database, RLS, streak / restore / elimination logic
public/brand             logo files (dark + light versions)
```

## Build status

- Done: landing page (dark editorial grid, halftone, dot-matrix numerals, line art, India map), leaderboard, signup + ₹99 payment flow, login, dashboard (streak, calendar, stats), full database + security + payment webhooks.
- Next: daily snap upload, My Snaps, community feed + follow system, restore screen, bottom navigation, admin dashboard.
