# ThinQShop

Premium e-commerce and money transfer platform built with NestJS, Next.js, Expo, PostgreSQL, and Redis.

## Stack

- **Backend:** NestJS, Prisma, PostgreSQL, Redis
- **Web:** Next.js 14, React 18, Tailwind
- **Mobile:** Expo / React Native
- **Deploy:** Docker, Coolify

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for production builds)
- PostgreSQL & Redis (or use Docker Compose)

### Development

```bash
# Install
npm install

# Backend (port 7000)
npm run dev:backend

# Web (port 7001) — this is the storefront
npm run dev:web

# Mobile
npm run dev:mobile
```

**Viewing the storefront:** Open **http://localhost:7001** in your browser. You must run **both** the backend and the web app:

- **Backend** on **port 7000** (API). **Web** on **port 7001** (storefront). If you see *"ThinQShop API is running!"* at http://localhost:7001, the backend is on 7001 instead of the Next.js app—free the ports and start the correct apps (see below).

**One-command setup (after DB is running):**

```bash
# Optional: free ports 7000 and 7001 if something is already using them
npm run dev:ports-free

# Start backend (7000) and web (7001) in one go (requires PostgreSQL + Redis)
npm run dev:start
```

If you use Docker for the database, start it first: `docker compose up -d db redis`. Then run `npm run dev:start`.  
**Two-terminal option:** Terminal 1: `PORT=7000 npm run dev:backend` → Terminal 2: `npm run dev:web` → open http://localhost:7001.

### Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis connection string
- `JWT_SECRET`
- `PAYSTACK_SECRET_KEY` (backend) and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (web)
- `NEXT_PUBLIC_API_URL` – backend URL (e.g. `https://api.yourdomain.com` in production)

## Production Builds (Docker)

```bash
# Build images
npm run build:web:docker
npm run build:backend:docker
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start NestJS in watch mode |
| `npm run dev:web` | Start Next.js dev server |
| `npm run dev:mobile` | Start Expo |
| `npm run build:web:docker` | Build web Docker image |
| `npm run build:backend:docker` | Build backend Docker image |
| `npm run clean` | Remove `backend/dist` and `web/.next` |

## Deploy

Deploy with Docker Compose or Coolify. See [DEPLOY.md](./DEPLOY.md) and [docs/COOLIFY_DEPLOY.md](./docs/COOLIFY_DEPLOY.md).

## Structure

```
├── backend/          # NestJS API
├── web/              # Next.js app
├── mobile/           # Expo app
├── database/         # Prisma schema
├── docker-compose.yml         # Local dev (with db, redis)
├── docker-compose.coolify.yml # Coolify / VPS (external DB)
├── docker-compose.full.yml    # Full stack with PostgreSQL
```
