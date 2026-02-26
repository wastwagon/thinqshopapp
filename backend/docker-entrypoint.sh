#!/bin/sh
set -e

# Wait for DB to be fully ready (pg_isready can report healthy before connections work)
echo "Waiting for database..."
sleep 5

# Run migrations with retries (first deploy can race with DB)
echo "Running database migrations..."
for i in 1 2 3 4 5; do
  if npx prisma migrate deploy --schema=./database/schema.prisma; then
    echo "Migrations complete."
    break
  fi
  if [ "$i" -eq 5 ]; then
    echo "Migration failed after 5 attempts. Exiting."
    exit 1
  else
    echo "Migration attempt $i failed. Retrying in 5s..."
    sleep 5
  fi
done

# Optional: seed on startup (set SEED_ON_STARTUP=true for fresh deploys)
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

echo "Starting application..."
exec node dist/backend/src/main.js
