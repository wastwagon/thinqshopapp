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

---

## Ports summary

| Service | Port | URL |
|---------|------|-----|
| Backend (API) | 7000 | http://localhost:7000 |
| Web (storefront) | 7001 | http://localhost:7001 |
| PostgreSQL (Docker) | 5440 | localhost:5440 (internal) |
