# Deploy ThinQShop

## Docker / Coolify (recommended)

Deploy to your VPS with Coolify or plain Docker Compose.

See **[docs/COOLIFY_DEPLOY.md](./docs/COOLIFY_DEPLOY.md)** for full instructions.

### Quick start

**Coolify (Option A):** Use `docker-compose.yaml` at repo root. Coolify detects it by default. Set env vars in Coolify → Environment. See [docs/COOLIFY_DEPLOY.md](./docs/COOLIFY_DEPLOY.md).

**Local / VPS (plain Docker Compose):**
```bash
# With included PostgreSQL
cp .env.example .env   # Edit with your values
docker compose -f docker-compose.full.yml up -d

# Or with external database only (backend + web)
docker compose -f docker-compose.coolify.yml up -d
```

### Required environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT (e.g. `openssl rand -hex 32`) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `https://api.yourdomain.com`) |
| `FRONTEND_URL` | Frontend URL for CORS |

### Database migration and seeding

**CLI (local or production):**
```bash
# Set DATABASE_URL, then:
npm run db:migrate-seed    # migrate + seed
npm run db:migrate        # migrate only
npm run db:seed           # seed only
```

Or use the shell script directly:
```bash
DATABASE_URL="postgresql://..." ./scripts/db-migrate-and-seed.sh           # migrate + seed
DATABASE_URL="postgresql://..." ./scripts/db-migrate-and-seed.sh migrate    # migrate only
DATABASE_URL="postgresql://..." ./scripts/db-migrate-and-seed.sh seed       # seed only
```

**Admin UI:** In Admin → Settings, use the Database section to run migrations and/or seed from the browser (admin/superadmin only).

### Build verification (local)

```bash
npm run build:backend:docker
npm run build:web:docker
```

### Post-deploy smoke (Phase 9)

After setting env vars and starting services:

```bash
# Validate required env (loads .env if present when run via deploy:smoke)
npm run deploy:check

# Migrate (production: migrate only, no seed)
npm run db:migrate

# Full smoke: env + migration status + /health + /ready + public APIs + home page
API_URL=https://api.yourdomain.com WEB_URL=https://yourdomain.com npm run deploy:smoke
```

| Step | Command / endpoint |
|------|-------------------|
| Migrations | `npm run db:migrate` — includes `20260516120000_add_password_reset_tokens`, `20260516130000_add_password_reset_email_template` |
| CORS + reset links | Set `FRONTEND_URL` to your storefront URL (no trailing slash) |
| Email queue | Configure `SMTP_*`, then `npm run email:process` (cron or manual) |
| Liveness | `GET /health` — process up |
| Readiness | `GET /ready` — DB + `JWT_SECRET` + `FRONTEND_URL` in production |
| Manual | Forgot-password flow, checkout (Paystack), admin media upload |

**Cron example** (process email queue every 5 minutes):

```cron
*/5 * * * * cd /path/to/thinqshopapp && npm run email:process >> /var/log/thinqshop-email.log 2>&1
```
