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

echo "Starting application..."
exec node dist/main.js
