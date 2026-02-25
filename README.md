# ThinQShop

Premium e-commerce and money transfer platform built with NestJS, Next.js, Expo, PostgreSQL, and Redis.

## Stack

- **Backend:** NestJS, Prisma, PostgreSQL, Redis
- **Web:** Next.js 14, React 18, Tailwind
- **Mobile:** Expo / React Native
- **Deploy:** Docker, Render

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for production builds)
- PostgreSQL & Redis (or use Render blueprint)

### Development

```bash
# Install
npm install

# Backend (port 7000)
npm run dev:backend

# Web (port 7001)
npm run dev:web

# Mobile
npm run dev:mobile
```

### Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis connection string
- `JWT_SECRET`
- `PAYSTACK_SECRET_KEY` (backend) and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (web)
- `NEXT_PUBLIC_API_URL` – backend URL (e.g. `https://thinqshop-backend.onrender.com` in production)

## Production Builds (Docker)

Production images use isolated workspaces to avoid dependency conflicts:

- **Web:** `package.web-build.json` (web only) → single React instance, static + dynamic pages
- **Backend:** `package.backend-build.json` (backend only) → slimmer image

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

Use `render.yaml` to deploy to Render (Postgres, Redis, backend, web). See [DEPLOY.md](./DEPLOY.md) for the full checklist and required env vars.

## Structure

```
├── backend/          # NestJS API
├── web/              # Next.js app
├── mobile/           # Expo app
├── database/         # Prisma schema
├── package.web-build.json    # Web-only build config (Docker)
├── package.backend-build.json # Backend-only build config (Docker)
└── render.yaml       # Render blueprint
```
