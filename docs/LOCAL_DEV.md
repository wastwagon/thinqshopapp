# Local Development & Preview

Preview your changes locally before deploying. Two options:

---

## Option A: Docker (full stack)

Uses the same images as production. Good for testing the full deploy flow.

**Ports:**
- **API (backend):** http://localhost:7000
- **Web (storefront):** http://localhost:7001

```bash
# Start DB + backend + web
docker compose -f docker-compose.yml up -d

# View logs
docker compose -f docker-compose.yml logs -f

# Stop
docker compose -f docker-compose.yml down
```

**After code changes:** Rebuild and restart:
```bash
docker compose -f docker-compose.yml up -d --build
```

---

## Option B: Local dev (no Docker for app, faster iteration)

Run backend and web locally with hot reload. DB can be Docker or local.

**Ports:**
- **API (backend):** http://localhost:7000
- **Web (storefront):** http://localhost:7001

```bash
# 1. Start DB only (Docker)
docker compose -f docker-compose.yml up -d db

# 2. Ensure .env has DATABASE_URL pointing to localhost:5440 (DB port)
# 3. Run migrations and seed

npm run db:migrate
npm run db:seed

# 4. Start backend + web
npm run dev:start
```

Then open **http://localhost:7001** in your browser.

**Important:** The storefront proxies `/api/*` to the NestJS backend on port **7000**. Running only `npm run dev:web` will cause **502** errors on shop, product, and cart pages until the backend is also running.

### Windows quick start

From the repo root in PowerShell:

```powershell
# One-time setup (install, migrate, .env)
scripts\setup.cmd

# Start backend + web in separate windows
scripts\dev-start.cmd
# Or: npm run dev:start:win
```

Verify the API is up before browsing the shop:

```powershell
curl http://localhost:7000/products?limit=1
```

Or manually:

```powershell
npm install
docker compose -f docker-compose.yml up -d db
npm run db:migrate
npm run db:seed
npm run dev:backend   # terminal 1
npm run dev:web       # terminal 2
```

Copy `.env.example` to `.env` if missing. For Docker DB, set `DATABASE_URL` to port **5440** (see table below), not 5432.

### Sync production catalog to local

Pull active products and categories from the live site into your **local** database (read-only against production; writes local only).

**Prerequisites:** Local Postgres running, `npm run db:migrate` done, `DATABASE_URL` pointing at local (not production).

```bash
npm run db:sync-catalog
```

| Env | Default | Purpose |
|-----|---------|---------|
| `PROD_API_BASE` | `https://thinqshopping.app/api` | Production API (public endpoints) |
| `PROD_SITE_BASE` | `https://thinqshopping.app` | Used to download `/media/files/*` images |
| `SYNC_DOWNLOAD_IMAGES` | `true` | Set `false` to skip image download |

Re-running is safe (upserts by slug; skips existing image files). Downloaded files land in `backend/uploads/files/` (served at `/media/files/…` when the API runs with cwd `backend/`). After sync, start backend + web and open http://localhost:7001/shop — product count should match production’s active catalog.

### Import products from Excel

Import the catalog spreadsheet at repo root: **`thinqapp thinqshopping.xlsx`**.

**Prerequisites:** Local Postgres running, `npm run db:migrate` done.

```bash
npm run db:import-xlsx
```

| Env | Default | Purpose |
|-----|---------|---------|
| `IMPORT_XLSX_PATH` | `./thinqapp thinqshopping.xlsx` | Path to the workbook |
| `IMPORT_PLACEHOLDER_PRICE` | `100` | GHS price when the Price cell is empty |

Re-running upserts products by slug (safe to run again). Image columns store paths like `/media/files/IMG_6761 4.JPG` — upload matching files via **Admin → Media** or copy into `backend/uploads/files/`. Rows marked **Variable** import without variants; add options in Admin → Products when ready.

If ports 7000/7001 are in use:

```powershell
npm run dev:ports-free:win
```

---

## Ports summary

| Service | Port | URL |
|---------|------|-----|
| Backend (API) | 7000 | http://localhost:7000 |
| Web (storefront) | 7001 | http://localhost:7001 |
| PostgreSQL (Docker) | 5440 | localhost:5440 (internal) |
