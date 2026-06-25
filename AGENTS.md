# Agent guide — ThinQShop

Read **[docs/PROJECT_UNDERSTANDING.md](docs/PROJECT_UNDERSTANDING.md)** first for architecture, request flow, auth, payments, and where code lives.

## Quick facts

| Item | Value |
|------|--------|
| Monorepo | `backend/` (NestJS :7000), `web/` (Next.js :7001), `database/` (Prisma) |
| API from browser | Axios `baseURL: '/api'` → `web/app/api/[...path]/route.ts` → NestJS |
| Auth | JWT in `localStorage`; cookies for middleware on `/dashboard`, `/admin` |
| Payments | Paystack + in-app wallet (GHS) |
| DB | PostgreSQL via Prisma |

## Conventions

- Match existing patterns in the file you edit; keep diffs minimal.
- Business logic belongs in **backend services**, not only in React pages.
- Do not commit `.env` or secrets.
- Ports: storefront is **7001**, not 7000 (7000 is the API).

## Useful entry files

- `web/app/(main)/layout.tsx` — client providers
- `web/lib/axios.ts` — HTTP client + 401 handling
- `web/middleware.ts` — route protection
- `backend/src/app.module.ts` — module registry
- `database/schema.prisma` — data model

## Setup

See [README.md](README.md) and [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md).
