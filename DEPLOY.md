# Deploy ThinQShop

## Docker / Coolify (recommended)

Deploy to your VPS with Coolify or plain Docker Compose.

See **[docs/COOLIFY_DEPLOY.md](./docs/COOLIFY_DEPLOY.md)** for full instructions.

### Quick start

```bash
# With included PostgreSQL
cp .env.example .env   # Edit with your values
docker compose -f docker-compose.full.yml up -d

# Or with external database (Coolify)
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
