#!/bin/sh
set -e

echo "=== ThinQShop backend startup ==="

# Fail fast with actionable messages (avoids opaque restart loops in Coolify)
if [ -z "$JWT_SECRET" ]; then
  echo "FATAL: JWT_SECRET is not set."
  echo "  Fix: Coolify → Environment → set JWT_SECRET (e.g. openssl rand -hex 32), then redeploy."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL is not set."
  echo "  Fix: Coolify → Environment → set POSTGRES_PASSWORD (compose builds DATABASE_URL for the backend)."
  exit 1
fi

if [ ! -f dist/backend/src/main.js ]; then
  echo "FATAL: dist/backend/src/main.js not found — backend image build may be broken."
  exit 1
fi

# Wait for DB to be fully ready (pg_isready can report healthy before connections work)
echo "Waiting for database..."
sleep 5

# Run migrations with retries (first deploy can race with DB)
echo "Running database migrations..."
MIGRATE_OK=0
for i in 1 2 3 4 5; do
  if npx prisma migrate deploy --schema=./database/schema.prisma; then
    echo "Migrations complete."
    MIGRATE_OK=1
    break
  fi
  if [ "$i" -eq 5 ]; then
    echo "FATAL: Migration failed after 5 attempts (see Prisma output above)."
    echo "  Common fixes:"
    echo "  - POSTGRES_PASSWORD changed but postgres_data volume still has old password → restore old password or reset volume"
    echo "  - Failed migration (P3009) → backend shell: npx prisma migrate resolve --rolled-back <name>"
    exit 1
  else
    echo "Migration attempt $i failed. Retrying in 5s..."
    sleep 5
  fi
done

if [ "$MIGRATE_OK" -ne 1 ]; then
  echo "FATAL: Migrations did not complete."
  exit 1
fi

# Optional: seed on startup (set SEED_ON_STARTUP=true for fresh deploys only)
if [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "Running database seed..."
  if npx ts-node --compiler-options '{"module":"CommonJS"}' database/seed.ts; then
    echo "Seed complete."
  else
    echo "Seed failed (check logs above). Continuing startup..."
  fi
  echo "Seeding products from scraped_products.json..."
  if npx ts-node --compiler-options '{"module":"CommonJS"}' database/seed-products.ts; then
    echo "Product seed complete."
  else
    echo "Product seed failed or skipped. Continuing startup..."
  fi
fi

mkdir -p /app/uploads/files /app/uploads/profile-images /app/uploads/shipment-declarations

echo "Starting application on port ${PORT:-7000}..."
exec node dist/backend/src/main.js
