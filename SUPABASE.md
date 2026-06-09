# Supabase Setup — Shared Reports Across Devices

This makes Maggie, Katie and you all see the same reports on any laptop or phone.
Free tier covers this use case forever.

---

## 1. Create the Supabase project (3 min)

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub
2. Click **New Project**
3. Fill in:
   - **Name**: `mmco-reports`
   - **Database Password**: click *Generate a password* — copy it to a password manager (you won't need it day-to-day but Supabase asks once)
   - **Region**: pick **East US (North Virginia)** (closest to NYC, lowest latency)
   - **Pricing plan**: **Free**
4. Click **Create new project**. Provisioning takes about 60 seconds.

## 2. Create the reports table (1 min)

When the project's ready:

1. Left sidebar → **SQL Editor** → **New query**
2. Paste this exact SQL and click **Run**:

```sql
create table if not exists reports (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_updated_at_idx on reports (updated_at desc);

-- Enable Row Level Security and allow anyone with the anon key to read/write
-- (we'll add per-user auth in Phase 3)
alter table reports enable row level security;

drop policy if exists "anyone can read"  on reports;
drop policy if exists "anyone can write" on reports;
create policy "anyone can read"  on reports for select using (true);
create policy "anyone can write" on reports for all    using (true) with check (true);
```

You should see "Success. No rows returned."

## 3. Copy the credentials (1 min)

In the Supabase dashboard:

1. Left sidebar → **Project Settings** (the gear icon) → **API**
2. Note these two values (you'll paste them into Vercel next):
   - **Project URL** — something like `https://abcdefghijklmnop.supabase.co`
   - **anon public** key — the one labelled `anon` `public` (NOT `service_role`!). Long string starting with `eyJ…`

## 4. Add them to Vercel (1 min)

1. Open **https://vercel.com/cyrusdblakes-projects/mmco-reports/settings/environment-variables**
2. Add a new variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: (paste the Project URL from step 3)
   - **Environments**: tick all 3
   - **Save**
3. Add another:
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: (paste the anon key)
   - **Environments**: tick all 3
   - **Save**
4. Go to **Deployments** tab → top deployment → **⋯** → **Redeploy** → confirm

After the redeploy finishes (~60s), reports are shared across every browser and device that visits `mmco-reports.vercel.app`.

## What's stored where

| Source of truth | Where it lives |
|---|---|
| **Baltic** report (the template) | `lib/baltic-report.ts` in code — change it and push to update for everyone |
| **Mock** report | `lib/mock-data.ts` in code |
| **Any report you/Katie/Maggie create or edit** | Supabase `reports` table |
| **Local Asset Library entries** | Browser localStorage (per-device) — to share permanently, drop files into `/public/` and push |

If Supabase env vars aren't set, the store automatically falls back to localStorage (handy for local dev).

## What about access control?

Right now anyone who has the dashboard URL can edit. To lock the dashboard behind a login but keep the `/report/...?share=1` links public, ask Cyrus to enable Supabase Auth — about 30 min of work.

## Costs

Free tier limits (you will not approach these):
- **500 MB database** — your largest report is ~50 KB, so this is ~10,000 reports
- **5 GB bandwidth / month**
- **2 active concurrent connections** — fine for a 3-person team
- Project auto-pauses after 7 days of inactivity — first visit after a pause wakes it up in ~5 seconds

If you do ever outgrow the free tier, it's $25/mo for the Pro plan.
