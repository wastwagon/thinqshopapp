#!/usr/bin/env bash
# ThinQShop setup: install deps, Prisma, migrations, env check.
set -e
cd "$(dirname "$0")/.."
echo "==> ThinQShop setup"
echo ""

if [ ! -f .env ]; then
  echo "==> No .env found. Copying .env.example to .env..."
  cp .env.example .env
  echo "    Edit .env and set DATABASE_URL, JWT_SECRET, and Paystack keys."
  echo ""
fi

echo "==> Installing dependencies (root)..."
npm install
echo ""

echo "==> Prisma generate (database/schema.prisma)..."
npx prisma generate --schema=database/schema.prisma
echo ""

echo "==> Prisma migrate deploy..."
npx prisma migrate deploy --schema=database/schema.prisma || {
  echo "⚠️  Migrate failed (is PostgreSQL running?). Start DB then run: npx prisma migrate deploy --schema=database/schema.prisma"
}
echo ""

if [ -z "$DATABASE_URL" ]; then
  [ -f .env ] && export $(grep -v '^#' .env | xargs)
fi
echo "==> Environment check"
[ -z "$DATABASE_URL" ] && echo "⚠️  DATABASE_URL not set in .env" || echo "✓ DATABASE_URL set"
[ -z "$JWT_SECRET" ] && echo "⚠️  JWT_SECRET not set (required for backend)" || echo "✓ JWT_SECRET set"
[ -z "$PAYSTACK_SECRET_KEY" ] || [ "$PAYSTACK_SECRET_KEY" = "sk_live_your_secret" ] && echo "⚠️  PAYSTACK_SECRET_KEY not set (needed for Paystack)" || echo "✓ PAYSTACK_SECRET_KEY set"
echo ""
echo "==> Setup complete."
echo "    Backend:  npm run dev:backend"
echo "    Web:      npm run dev:web"
echo "    Test:     npm run test:local"
echo ""
