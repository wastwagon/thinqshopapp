# Production Troubleshooting

## Protecting Production from Seed Overwrites

**Seed is blocked on production by default.** Running `npm run db:seed` or `db:migrate-seed` will refuse to run if:
- `NODE_ENV=production`, or
- `DATABASE_URL` contains a production host (railway, render, heroku, aws, supabase, planetscale, neon, coolify)

This prevents local development from accidentally overwriting production data.

- **Production deployments:** Use `npm run db:migrate` only (migrations only, no seed).
- **To force seed on production** (e.g. fresh deploy): `SEED_ALLOW_PRODUCTION=true npm run db:seed`
- **Custom production hosts:** Add your host pattern to `isProductionDb()` in `database/seed-runner.ts` if needed.
- **Coolify / VPS:** Coolify is supported. If `NODE_ENV=production` is set (typical for production deploys), seed is already blocked. For extra safety, `coolify` in `DATABASE_URL` also triggers protection.

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

**Important:** If frontend and backend are on different hosts (e.g. Vercel + Railway):
- `BACKEND_URL` must be the **full URL** of your backend (e.g. `https://your-backend.railway.app`)
- The backend must allow requests from your frontend origin (CORS)

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
