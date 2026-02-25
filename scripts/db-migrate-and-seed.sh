#!/usr/bin/env bash
# ThinQShop — Database migration and seeding
# Works for both local development and production.
# Requires: DATABASE_URL in environment
#
# Usage:
#   ./scripts/db-migrate-and-seed.sh           # migrate + seed
#   ./scripts/db-migrate-and-seed.sh migrate    # migrate only
#   ./scripts/db-migrate-and-seed.sh seed      # seed only

set -e
cd "$(dirname "$0")/.."

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

echo "Using DATABASE_URL from environment"
echo ""

run_migrate() {
  echo ">>> Running Prisma migrations..."
  npx prisma generate --schema=database/schema.prisma
  npx prisma migrate deploy --schema=database/schema.prisma
  echo ">>> Migrations complete."
}

run_seed() {
  echo ">>> Running database seed..."
  npx prisma generate --schema=database/schema.prisma
  npx ts-node --compiler-options '{"module":"CommonJS"}' database/seed.ts
  echo ">>> Seed complete."
}

case "${1:-}" in
  migrate)
    run_migrate
    ;;
  seed)
    run_seed
    ;;
  *)
    run_migrate
    echo ""
    run_seed
    echo ""
    echo ">>> Database migration and seeding complete."
    ;;
esac
