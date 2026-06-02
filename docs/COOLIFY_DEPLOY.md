# Deploy ThinQShop with Coolify (Docker Compose)

Deploy the full stack (PostgreSQL + backend + web) in one go using Coolify's Docker Compose support.

## Prerequisites

- VPS with Coolify installed
- Domain(s) for your app (e.g. `thinqshopping.app`, `api.thinqshopping.app`)
- GitHub repo: `wastwagon/thinqshopapp` (or your fork)

---

## Step-by-step: Option A — Docker Compose

### 1. Create new application

1. In Coolify → **Projects** → your project → **Add Resource** → **Docker Compose**
2. **Repository URL:** `https://github.com/wastwagon/thinqshopapp`
3. **Branch:** `main`
4. **Build Pack:** `Docker Compose`
5. **Docker Compose Location:** `/docker-compose.yaml` (default)
6. **Base Directory:** `/`
7. Click **Continue**

### 2. Set environment variables

In the application's **Environment** / **Variables** section, add:

| Variable | Required | Example / Notes |
|----------|----------|-----------------|
| `POSTGRES_PASSWORD` | Yes | Strong password for the database (e.g. `openssl rand -base64 24`) |
| `JWT_SECRET` | Yes | Random secret (e.g. `openssl rand -hex 32`) |
| `PAYSTACK_SECRET_KEY` | Yes | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Yes | `pk_live_...` or `pk_test_...` |
| `FRONTEND_URL` | Yes | `https://thinqshopping.app` (no trailing slash; for CORS) |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.thinqshopping.app` (your backend API URL) |

### 3. Configure domains (optional)

In Coolify, assign domains to the services:

- **web** (port 3000) → `thinqshopping.app`
- **backend** (port 7000) → `api.thinqshopping.app`

Coolify will set up the reverse proxy and SSL.

### 4. Deploy

1. Click **Deploy** (or enable auto-deploy on push)
2. Coolify will clone the repo, build the images, and start all three services
3. First deploy may take 5–10 minutes (builds backend and web)

### 5. Run migrations and seed (first time)

The backend runs `prisma migrate deploy` on startup, so migrations are applied automatically.

**Variation catalog (Size values):** On every backend start, the entrypoint runs [`database/seed-variations.ts`](../database/seed-variations.ts) (idempotent upsert of Size → Small, Medium, Large, XL, XXL). No extra env var is required. Check backend logs for `Variation catalog OK.` after deploy.

If sizes are still missing before you redeploy with this change, open a shell on the **backend** container and run:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' database/seed-variations.ts
```

**To seed the full database** (creates admin user, test user, products, reviews, warehouses, etc.):

**Option A — Auto-seed on startup:** In Coolify → Environment, add `SEED_ON_STARTUP=true`. Redeploy. After first successful login, set it back to `false` (or remove it).

**Option B — Coolify shell:** Open a shell/terminal for the `backend` container, then:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' database/seed.ts
```

**Option C — Admin UI** (after first seed): Log in as `admin@thinqshopping.app` / `password` → **Admin** → **Settings** → Database section → **Migrate + seed** (for future runs)

### 6. Default credentials (after seed)

| Account | Email | Password |
|---------|-------|----------|
| Admin | `admin@thinqshopping.app` | `password` |
| Test user | `user@thinqshopping.app` | `password` |

**Change the admin password immediately** in production.

---

## Ports (internal)

| Service | Port |
|---------|------|
| db | 5432 (internal only) |
| backend | 7000 |
| web | 3000 |

Coolify exposes these via its reverse proxy based on your domain configuration.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Restarting (11x restarts)** after deploy | Open **Logs → backend**; look for `FATAL:` lines. Usually missing `JWT_SECRET`, missing `DATABASE_URL` (set `POSTGRES_PASSWORD` in Coolify), or migration/DB password mismatch. See [PRODUCTION_TROUBLESHOOTING.md](./PRODUCTION_TROUBLESHOOTING.md#container-restart-loop-coolify-restarting-11x-restarts) |
| Build fails | Ensure `package-lock.json` is committed and in sync |
| **Deployment failed (exit 255)** | Often transient (SSH/connection). **Try Deploy again.** If it persists, check Coolify → Server → Advanced for deployment timeout; ensure server has enough RAM (2GB+ for parallel builds) |
| Backend can't connect to DB | Check `POSTGRES_PASSWORD` is set; db service must be healthy before backend starts |
| CORS errors | Set `FRONTEND_URL` to your exact frontend domain (no trailing slash) |
| 502 Bad Gateway | Check backend logs in Coolify → Terminal (backend container). Backend may need 30–60s for migrations on first start |
| Migrations not applied | Backend runs them on startup; check backend logs for Prisma errors |
| **Product sizes missing** / Variations only shows Small | Backend auto-seeds sizes on startup (`seed-variations.ts`). Redeploy or run `npx ts-node --compiler-options '{"module":"CommonJS"}' database/seed-variations.ts` in backend shell. Check logs for `Variation catalog OK.` |
| **Failed to save** when adding variation value | Often duplicate value (409) or validation error — retry after seed; check browser Network tab for `/api/variations/admin/values` response |
| Product images **404** (`GET /media/files/... 404`) | Ensure `docker-compose.yaml` mounts `backend_uploads:/app/uploads` on the **backend** service (included in repo). Redeploy once so the volume exists. Files uploaded **before** the volume was added are gone — re-upload in **Admin → Media** and update affected products. |
| `GET /content/currency-rates` very slow (~10s) | Usually a slow external FX API on first request; the API now returns cached DB rates immediately and refreshes in the background. |

---

## Alternative: External database

If you prefer Coolify's managed PostgreSQL instead of the compose db service:

1. Create a PostgreSQL database in Coolify (Servers → Database)
2. Use **Compose file:** `/docker-compose.coolify.yml` (backend + web only)
3. Set `DATABASE_URL` to the connection string from Coolify's database
