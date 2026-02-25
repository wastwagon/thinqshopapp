# Deploy: GitHub + Render Blueprint

## 1. Prepare for GitHub

Your project is ready to push. **Never commit** `.env`, `backend/.env`, or `web/.env` (they are in `.gitignore`).

### Push with GitHub Desktop

1. **Add the repo** (if not already):
   - File → Add Local Repository → choose `thinqshop-world-class`
   - Or: File → Clone Repository → URL `https://github.com/wastwagon/thinqshopapp.git` → choose a folder and clone, then copy your project files into it (excluding `node_modules`, `.env`, etc.)

2. **If the folder is not yet a Git repo:**
   - In terminal: `cd /path/to/thinqshop-world-class` then `git init`
   - In GitHub Desktop: File → Add Local Repository → select this folder

3. **Set the remote** (if you created the repo on GitHub first):
   - Repository → Repository Settings → Primary remote repository: `https://github.com/wastwagon/thinqshopapp.git`
   - Or in terminal: `git remote add origin https://github.com/wastwagon/thinqshopapp.git`

4. **Commit and push:**
   - Stage all files (ensure no `.env` or `node_modules` are staged)
   - Commit message e.g. "Initial commit: ThinQShop monorepo + Render blueprint"
   - Push to `main` (or your default branch)

Repo: **https://github.com/wastwagon/thinqshopapp**

---

## 2. Render Blueprint (render.yaml)

The repo root contains `render.yaml`, which defines Postgres, Redis, backend, and web services.

### Before first deploy

1. **Environment variables** (set in Render dashboard for each service; blueprint marks some as `sync: false`):

   | Variable | Service | Required | Notes |
   |----------|---------|----------|-------|
   | `DATABASE_URL` | backend | Yes | Set automatically from Postgres (blueprint) |
   | `JWT_SECRET` | backend | Yes | Set automatically (blueprint) |
   | `PAYSTACK_SECRET_KEY` | backend | Yes | Set manually in dashboard |
   | `REDIS_URL` | backend | No | Optional; set if you use Redis (from Key Value instance) |
   | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | web | Yes | Set manually in dashboard |
   | `NEXT_PUBLIC_API_URL` | web | Yes | Set to backend URL after first deploy (e.g. `https://thinqshop-backend.onrender.com`) |

2. **Service URLs**
   - Backend: `https://thinqshop-backend.onrender.com` (or the name you give in the blueprint)
   - Web: `https://thinqshop-web.onrender.com`
   - After the first deploy, set the **web** service env var `NEXT_PUBLIC_API_URL` to your backend URL.

### Deploy steps

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
2. Connect the repo **wastwagon/thinqshopapp** (GitHub).
3. Render will read `render.yaml` and create:
   - Postgres database (`thinqshop-db`)
   - Redis-compatible Key Value instance (`thinqshop-redis`)
   - Backend web service (`thinqshop-backend`)
   - Web frontend service (`thinqshop-web`)
4. For each service that has `sync: false` env vars, open the service → **Environment** and set:
   - **Backend:** `PAYSTACK_SECRET_KEY` (and optionally `REDIS_URL` from the Redis instance’s internal URL).
   - **Web:** `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, and after backend is live, `NEXT_PUBLIC_API_URL` = backend URL.
5. Deploy; migrations run at backend startup (in the start command; free tier does not support Pre-Deploy Command).

### Optional: build verification (Docker, local)

```bash
npm run clean
npm run build:backend:docker
npm run build:web:docker
```

---

## 3. After deploy

1. **Migrations** – Run at backend startup (`prisma migrate deploy` in the start command).
2. **Verify** – Open the web URL; log in or browse the shop.
3. **Seed** – If the database is empty, add products via the admin panel for full catalog.
