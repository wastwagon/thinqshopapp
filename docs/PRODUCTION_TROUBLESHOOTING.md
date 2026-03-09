# Production Troubleshooting

## 502 Backend Unreachable (Coolify/Docker)

If you see **502** or *"Backend unreachable. Is the API running on http://backend:7000?"*:

1. **Backend container must be running**
   - In Coolify: open the application → check that the **backend** service is running (not stopped or restarting).
   - From the server: `docker ps` and confirm a container for your app’s backend is up.

2. **Same Docker network**
   - The **web** and **backend** services must be on the same Docker network so `http://backend:7000` resolves from the web container.
   - In `docker-compose.yaml`, both services are in the same file with no custom `networks:`; Compose puts them on one network by default. If you split services or use custom networks, attach both to the same network.

3. **Service name**
   - The web app uses `BACKEND_URL=http://backend:7000`, so the backend service **name** in Compose must be `backend` (e.g. `services: backend: ...`).

4. **Backend health**
   - Backend may be starting (e.g. waiting for DB). Check backend logs in Coolify or `docker logs <backend-container>` for errors (DB connection, crash on startup). Ensure the **db** service is healthy and `DATABASE_URL` points at it (e.g. `postgresql://...@db:5432/...`).

5. **Quick checks from the host**
   - Run another container on the same network and try:  
     `docker run --rm --network <your-app-network> curlimages/curl -s -o /dev/null -w "%{http_code}" http://backend:7000/health`  
     (if you have a `/health` route). Or exec into the web container and `curl http://backend:7000` to confirm connectivity.

---

## Protecting Production from Seed Overwrites

**Seed is blocked on production by default.** Running `npm run db:seed` or `db:migrate-seed` will refuse to run if:
- `NODE_ENV=production`, or
- `DATABASE_URL` contains a production host (railway, render, heroku, aws, supabase, planetscale, neon, coolify)

This prevents local development from accidentally overwriting production data.

- **Production deployments:** Use `npm run db:migrate` only (migrations only, no seed).
- **To force seed on production** (e.g. fresh deploy): `SEED_ALLOW_PRODUCTION=true npm run db:seed`
- **Coolify with SEED_ON_STARTUP=true:** When the backend starts with `SEED_ON_STARTUP=true`, seed is allowed (for fresh deploys). This creates admin/user accounts and sample products. Set `SEED_ON_STARTUP=false` after initial setup to avoid re-seeding on every deploy.
- **Custom production hosts:** Add your host pattern to `isProductionDb()` in `database/seed-runner.ts` if needed.

---

## Login 401 on Production

If `/api/auth/login` returns 401 in production, check:

### 1. **Credentials**
- Verify email and password are correct
- Ensure the user exists in the production database
- Check that `is_active` is `true` for the user

### 2. **Backend URL**
The Next.js app proxies `/api/*` to the backend. Set these env vars in production:

| Variable | Where | Purpose |
|----------|-------|---------|
| `BACKEND_URL` | Next.js (server) | URL of your NestJS backend, e.g. `https://api.yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | Next.js (build) | Same as BACKEND_URL for SSR; used as fallback for proxy |

**Important:** 
- **Coolify/Docker:** `docker-compose.yaml` sets `BACKEND_URL=http://backend:7000` (internal). No extra config needed.
- **Split hosting** (e.g. Vercel + Railway): `BACKEND_URL` must be the full public URL (e.g. `https://your-backend.railway.app`). The backend must allow requests from your frontend origin (CORS).

### 3. **CORS**
If the browser makes direct requests to the backend (not through `/api`), CORS must allow your frontend origin. Set in backend:
```
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
```

### 4. **JWT_SECRET**
Ensure `JWT_SECRET` is set in the backend and is the same across restarts (do not change it or existing tokens will fail).

---

## Products Not Showing

### 1. **Product limit**
- Default limit is now 100 (was 20)
- Shop page requests `limit: 100`

### 2. **Active products only**
- Only products with `is_active: true` appear on the shop
- In admin, ensure products are marked active

### 3. **Category**
- Products must have a valid `category_id`
- If filtering by category, the category slug must match

### 4. **Database**
- Run migrations: `npm run db:migrate`
- Verify products exist: `SELECT id, name, is_active FROM products;`
