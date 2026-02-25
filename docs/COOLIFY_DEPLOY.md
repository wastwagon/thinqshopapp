# Deploy ThinQShop to VPS with Coolify

This guide covers deploying ThinQShop to your own VPS using [Coolify](https://coolify.io).

## Prerequisites

- VPS with Coolify installed
- Domain(s) for your app (e.g. `thinqshopping.app`, `api.thinqshopping.app`)
- PostgreSQL database (Coolify can create one, or use external)

## Option A: Coolify Docker Compose

1. **Create a new resource** in Coolify → **Docker Compose**
2. **Connect your Git repo** (e.g. `wastwagon/thinqshopapp`)
3. **Compose file path:** `docker-compose.coolify.yml`
4. **Set environment variables** in Coolify:

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string (from Coolify DB or external) |
   | `JWT_SECRET` | Random secret for JWT (e.g. `openssl rand -hex 32`) |
   | `PAYSTACK_SECRET_KEY` | Paystack secret key (sk_live_... or sk_test_...) |
   | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key (pk_live_... or pk_test_...) |
   | `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `https://api.thinqshopping.app`) |
   | `FRONTEND_URL` | Frontend URL for CORS (e.g. `https://thinqshopping.app`) |

5. **Deploy** – Coolify will build and run both backend and web.

## Option B: Full stack with included PostgreSQL

If you want PostgreSQL managed by Docker:

1. Use **Compose file path:** `docker-compose.full.yml`
2. Add `POSTGRES_PASSWORD` to env vars
3. Set `DATABASE_URL` is built from the db service (already in compose)
4. For first deploy, you may need to run migrations – the backend runs them on startup

## Option C: Separate services in Coolify

Create two services:

1. **Backend** – Dockerfile: `backend/Dockerfile`, context: repo root
2. **Web** – Dockerfile: `web/Dockerfile`, context: repo root

Add a PostgreSQL database in Coolify and link `DATABASE_URL` to the backend.

## Ports

- **Backend:** 7000 (internal)
- **Web:** 3000 (internal)

Configure Coolify to expose these via your domain (reverse proxy).

## First-time setup

After first deploy, seed the database if needed:

```bash
# From your machine, or Coolify shell
docker compose exec backend npx prisma db seed --schema=./database/schema.prisma
```

Or use your existing seed script with `DATABASE_URL` set.

## Troubleshooting

- **Build fails:** Ensure `package-lock.json` is committed and in sync
- **Backend can't connect to DB:** Check `DATABASE_URL` and that the database is reachable from the backend container
- **CORS errors:** Set `FRONTEND_URL` to your actual frontend domain(s)
