# Docker — Run all services

Start the full stack (PostgreSQL, backend, web) with Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- `.env` in the project root with at least:
  - `PAYSTACK_SECRET_KEY` (backend)
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (for web build)
  - `JWT_SECRET` (optional, has default)

## Start all services

From the project root:

```bash
docker compose up -d
```

First run will build the backend and web images (can take several minutes). Later runs reuse the images.

## Ports

| Service  | Host port | Description        |
|----------|-----------|--------------------|
| **db**   | 5440      | PostgreSQL         |
| **backend** | 7001   | NestJS API         |
| **web**  | 3000      | Next.js (shop/app) |

- Open the app: **http://localhost:3000**
- API (from host): **http://localhost:7001**
- From the browser, the app calls `/api`, which the Next.js server proxies to the backend container.

## Useful commands

```bash
# Start (background)
docker compose up -d

# View logs
docker compose logs -f

# Stop all
docker compose down

# Rebuild and start (after code changes)
docker compose up -d --build
```

## Env and secrets

- Backend gets `DATABASE_URL`, `PAYSTACK_SECRET_KEY`, `JWT_SECRET` from `docker-compose` and `.env`.
- Web build gets `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` as build args; at runtime the server uses `BACKEND_URL=http://backend:7000` to proxy `/api` to the backend.
