# Decown Catalogue

The Decown decor & gifting catalogue website, with an admin panel to add, edit, hide, reorder and delete products.

- **Website:** `/`: same design as the original `catalogue.html`, with products loaded from the database
- **Admin:** `/admin`: password-protected (single admin)

**Stack:** Next.js 15 (App Router) · Postgres (Neon) via Drizzle ORM · Vercel Blob for images · deployed on Vercel.

---

## Admin panel

| Page | What you can do |
|---|---|
| Products | Search/filter, drag rows to set the order on the website, show/hide toggle, edit, delete |
| Add / Edit product | Name, category, description, image upload (auto-resized to max 1600px WebP), show on website |
| Categories | Add, rename, reorder (↑ ↓), delete (only when it has no products) |
| Settings | WhatsApp number, Instagram/Facebook links, which products appear in the hero images |

Changes appear on the website immediately. No redeploy is needed.

---

## Deploy to Vercel (first time)

1. **Push this folder to a GitHub repository.**
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repository. Keep the defaults (framework: Next.js).
3. In the project go to **Storage**:
   - **Create Database → Neon (Postgres)** and connect it to the project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
   - **Create → Blob** (access: **Public**) and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
4. **Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD`: the admin login password
   - `AUTH_SECRET`: a long random string (`openssl rand -hex 32`)
5. **Deployments → Redeploy.** The build runs database migrations automatically (`scripts/migrate.ts`).
6. **Import the 50 original products (once).** From this folder on your computer:
   ```bash
   npm install
   npx vercel link          # pick the project
   npx vercel env pull .env.local
   npm run db:seed          # uploads images to Blob and fills the database
   ```
7. Open `https://<your-project>.vercel.app/admin` and log in.

**Custom domain:** Project → Settings → Domains → add `decown.in` and follow the DNS instructions.

After this, every `git push` to the main branch redeploys automatically.

---

## Local development

```bash
npm install
cp .env.example .env.local     # fill in values
npm run dev                    # http://localhost:3000
```

**No Postgres installed?** Use the bundled in-process Postgres (PGlite):

```bash
# .env.local
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
DATABASE_POOL_MAX=1
ADMIN_PASSWORD=anything
AUTH_SECRET=any-long-random-string

npm run db:local      # keep running in one terminal
npm run db:migrate
npm run db:seed       # without BLOB_READ_WRITE_TOKEN, images go to public/uploads
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Apply migrations, then production build (used by Vercel) |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Import products from `catalogue.html` (`-- --force` wipes and re-imports) |
| `npm run db:local` | Local PGlite Postgres on port 5433 |

## Project layout

```
src/
  app/(site)/          public website (page.tsx, site.css = original design)
  app/admin/           admin panel: login, products, categories, settings, actions.ts
  app/api/upload/      issues Vercel Blob upload tokens to the logged-in admin
  components/          site + admin components
  db/                  Drizzle schema and client
  lib/                 auth/session, cached catalogue queries, image storage
  middleware.ts        protects /admin
scripts/               migrate + seed
drizzle/               SQL migrations
catalogue.html         original single-file catalogue (seed source)
```
