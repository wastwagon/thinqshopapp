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

MAIN_JS=""
for candidate in dist/src/main.js dist/main.js dist/backend/src/main.js; do
  if [ -f "$candidate" ]; then
    MAIN_JS="$candidate"
    break
  fi
done
if [ -z "$MAIN_JS" ]; then
  echo "FATAL: NestJS entry file not found (expected dist/src/main.js)."
  echo "  dist contents:"
  ls -la dist 2>/dev/null || echo "  (dist/ missing)"
  exit 1
fi
echo "Using entry: $MAIN_JS"

# Wait for DB to be fully ready (pg_isready can report healthy before connections work)
echo "Waiting for database..."
DB_OK=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.\$connect()
      .then(() => p.\$disconnect())
      .then(() => { console.log('Database connection OK'); process.exit(0); })
      .catch((e) => {
        const msg = e?.message || String(e);
        console.error('Database connection FAILED:', msg);
        if (/authentication failed|P1000/i.test(msg)) {
          console.error('  POSTGRES_PASSWORD in Coolify likely does not match the existing postgres_data volume.');
        }
        process.exit(1);
      });
  "; then
    DB_OK=1
    break
  fi
  echo "Database not ready (attempt $i/10). Retrying in 3s..."
  sleep 3
done
if [ "$DB_OK" -ne 1 ]; then
  echo "FATAL: Could not connect to database after 10 attempts."
  echo "  See errors above. Common fix: POSTGRES_PASSWORD must match the password used when postgres_data was first created."
  exit 1
fi

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
exec node "$MAIN_JS"
