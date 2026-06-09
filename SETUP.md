# MM&Co Seller Report — Platform Setup

This is the one-time setup to turn the report tool into a team platform.
All three pieces below are free.

---

## 1. Auto-deploy via GitHub (5 min)

Right now every change requires a manual `vercel deploy` from a terminal.
After this step, every push to GitHub auto-deploys to `mmco-reports.vercel.app`.

**Setup:**

1. **Create a GitHub repo** at https://github.com/new
   - Name: `mmco-reports` (or whatever you like)
   - Private is fine
   - Don't add a README — we already have files
   - Click *Create repository*

2. **Push this folder to it** (one-time, from a terminal):
   ```bash
   cd /Users/cyrus.blake/Desktop/Projects/luxury-seller-report
   git remote add origin https://github.com/<your-username>/mmco-reports.git
   git push -u origin main
   ```

3. **Connect Vercel to GitHub:**
   - Go to https://vercel.com/cyrusdblakes-projects/mmco-reports/settings/git
   - Click *Connect Git Repository*
   - Pick the `mmco-reports` repo you just created
   - Production branch: `main`
   - Click *Save*

**From now on:** `git push` = the site updates in ~60 seconds. No CLI needed.

---

## 2. Free AI (Google Gemini Flash — 2 min)

Powers **all AI features** in the app — both the existing "Generate with AI" recommendations button in the Strategy section, and the new `/api/ai/summarize` endpoint for weekly narratives.
Gemini Flash free tier: **15 requests/min, 1500/day, 1M tokens/day** — way more than this app will ever need. **One key, zero cost.**

1. **Get an API key:** https://aistudio.google.com/app/apikey → *Create API key*. Copy it.

2. **Add it to Vercel:**
   - https://vercel.com/cyrusdblakes-projects/mmco-reports/settings/environment-variables
   - Name: `GOOGLE_AI_KEY`
   - Value: (paste your key)
   - Environments: check all three (Production / Preview / Development)
   - Click *Save*

3. **Trigger a redeploy** so the new env var loads:
   - Either push any commit, or in Vercel's *Deployments* tab click *Redeploy* on the latest one.

**Note**: The bill stays at $0 as long as you stay under the free tier. Gemini Flash is plenty smart for narrative/summary tasks.

---

## 3. Asset Library (already built — at `/dashboard/assets`)

Manages all photos, headshots, and logos in one place.

**How it works:**

- **Bundled assets** (`/public/...` in code) ship with the app. They auto-deploy and everyone sees them. These show with a small "bundled" tag and can't be deleted from the UI.
- **Added assets** (URLs you paste in) live in *your* browser's localStorage — handy for experimenting.
- **To share an asset with the team permanently:** drop the file into `/public/` and push to GitHub. After the redeploy, reference it as `/your-filename.jpg` from anywhere in the app.
- **External URLs work too:** Compass listing CDN URLs, Google Drive direct links, Imgur, your S3 bucket, etc. Just paste them in.

**Suggested workflow when starting a new listing:**

1. Drop the listing's photos into `/public/<address>/` via Finder
2. `git add -A && git commit -m "Add 567 Pacific photos" && git push`
3. Open `/dashboard/assets` and tag any of them for easy reuse
4. Use the *Copy URL* button to grab paths quickly when filling out a new report

---

## What's next (when you're ready)

| Feature | Cost | Effort |
|---|---|---|
| Supabase database (shared reports across team) | Free up to 500MB | ~3 hrs |
| Email magic-link login | Free | ~1 hr |
| Compass PDF → auto-fill via Gemini | $0 (Gemini Flash) | ~1 day |
| One-click weekly narrative button (uses the AI endpoint already built) | $0 | ~2 hrs |
| Strategy suggestions from past weeks' data | $0 | ~4 hrs |
| Voice-note ingestion (Maggie records, AI fills form) | $0 (Gemini supports audio) | ~1 day |
| Custom domain (e.g. `reports.mmandco.com`) | ~$12/yr | 15 min |

Tell Cyrus which one to build next.
