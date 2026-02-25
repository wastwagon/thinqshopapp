#!/bin/sh
set -e

# Run migrations if Prisma works (Alpine can have libc/openssl issues; skip and start app if migrate fails)
echo "Running database migrations..."
npx prisma migrate deploy --schema=./database/schema.prisma

echo "Starting application..."
exec node dist/main.js
