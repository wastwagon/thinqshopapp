#!/usr/bin/env bash
# ThinQShop setup: install deps, Prisma, migrations, env check.
set -e
cd "$(dirname "$0")/.."
echo "==> ThinQShop setup"
echo ""

echo "==> Installing dependencies (root)..."
npm install
echo ""

echo "==> Installing backend dependencies..."
npm install -w backend 2>/dev/null || (cd backend && npm install)
echo ""

echo "==> Installing web dependencies..."
npm install -w web 2>/dev/null || (cd web && npm install)
echo ""

echo "==> Prisma generate (database/schema.prisma)..."
npx prisma generate --schema=database/schema.prisma
echo ""

echo "==> Prisma migrate deploy..."
npx prisma migrate deploy --schema=database/schema.prisma
echo ""

if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
  fi
fi
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Create .env from .env.example and set DATABASE_URL."
else
  echo "✓ DATABASE_URL is set"
fi
if [ -z "$PAYSTACK_SECRET_KEY" ] || [ "$PAYSTACK_SECRET_KEY" = "your_paystack_secret" ]; then
  echo "⚠️  PAYSTACK_SECRET_KEY not set or still placeholder. Set it in .env and backend/.env for Paystack."
else
  echo "✓ PAYSTACK_SECRET_KEY is set"
fi
echo ""
echo "==> Setup complete."
echo "    Backend:  npm run dev:backend   (or: npm run start:dev -w backend)"
echo "    Web:      npm run dev:web       (or: npm run dev -w web)"
echo "    DB URL:   .env and backend/.env"
echo ""
