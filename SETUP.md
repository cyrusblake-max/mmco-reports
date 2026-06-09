# MM&Co Seller Report — Platform Setup

The one-time setup to turn this from a single-machine tool into a team platform.
All free.

---

## 1. Auto-deploy via GitHub (already done if `git push` triggers a Vercel build)

After this, every `git push` to `main` auto-deploys to `mmco-reports.vercel.app` in ~60 seconds. No more terminal deploys.

1. **Create a GitHub repo** at https://github.com/new — name it `mmco-reports`, private is fine.
2. **Push from Terminal:**
   ```bash
   cd /Users/cyrus.blake/Desktop/Projects/luxury-seller-report
   git remote add origin https://github.com/<your-username>/mmco-reports.git
   git push -u origin main
   ```
3. **Connect Vercel to GitHub:** https://vercel.com/cyrusdblakes-projects/mmco-reports/settings/git → *Connect Git Repository* → pick the repo → Production branch `main` → Save.

---

## 2. Shared reports across devices — Supabase (5 min)

Without this, reports you create on your laptop won't appear on Maggie's or Katie's. See `SUPABASE.md` for the full step-by-step. Short version:

1. Sign up at https://supabase.com → New Project (name `mmco-reports`, region East US, free plan).
2. SQL Editor → run the snippet from `SUPABASE.md` step 2 to create the `reports` table.
3. Project Settings → API → copy the **Project URL** and **anon public** key.
4. Add to Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Tick all three environments. Save.
5. Vercel Deployments → ⋯ on latest → Redeploy so the env vars load.

After the redeploy is green, all three of you see the same reports on any device.

---

## 3. Asset Library (already at `/dashboard/assets`)

Manages all photos, headshots, and logos in one place.

- **Bundled assets** (`/public/…` files in the repo) ship with the app — everyone sees them.
- **External URLs** (Compass CDN, Google Drive direct link, Imgur, etc.) work too — paste them in.
- **To share an asset with the team permanently:** drop the file into `/public/` and `git push`. Reference it as `/your-filename.jpg` anywhere.

---

## What's next (when you're ready)

| Feature | Cost | Effort |
|---|---|---|
| Email magic-link login (so only the team can edit) | Free | ~1 hr |
| PDF export (server-side Chromium on Vercel) | Free | ~2 hrs |
| Custom domain (e.g. `reports.mmandco.com`) | ~$12/yr | 15 min |

Tell Cyrus which one to build next.
