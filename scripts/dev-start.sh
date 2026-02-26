#!/usr/bin/env bash
# Free ports 7000/7001, start backend on 7000 and web on 7001.
# Prerequisite: PostgreSQL running. If using Docker: docker compose up -d db
set -e
cd "$(dirname "$0")/.."

# Wait for DB port (e.g. Docker Postgres on 5440) so backend can connect
DB_PORT="${DB_PORT:-5440}"
if command -v nc >/dev/null 2>&1; then
  echo "==> Waiting for database on port $DB_PORT (up to 30s)..."
  for i in $(seq 1 30); do
    if nc -z localhost "$DB_PORT" 2>/dev/null; then
      echo "    Database is reachable."
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "    Warning: port $DB_PORT not open. Start Postgres (e.g. docker compose up -d db) and ensure .env DATABASE_URL uses localhost:$DB_PORT"
    fi
    sleep 1
  done
  echo ""
fi

echo "==> Freeing ports 7000 and 7001..."
for port in 7000 7001; do
  pids=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pids" ]; then
    for p in $pids; do kill -9 $p 2>/dev/null || true; done
    echo "    Freed port $port (was PID(s) $pids)"
  fi
done
echo ""

echo "==> Starting backend on http://localhost:7000 (PORT=7000)..."
(cd backend && PORT=7000 npm run start:dev) &
BACKEND_PID=$!
echo "    Backend PID: $BACKEND_PID"
echo ""

echo "==> Waiting for backend to respond (up to 20s)..."
for i in $(seq 1 20); do
  if curl -s -o /dev/null http://localhost:7000/ 2>/dev/null; then
    echo "    Backend is up."
    break
  fi
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "    Backend process exited (e.g. DB not running). Start PostgreSQL (e.g. Docker: docker compose up -d db), then run:"
    echo "      Terminal 1: PORT=7000 npm run dev:backend"
    echo "      Terminal 2: npm run dev:web"
    exit 1
  fi
  sleep 1
done
echo ""

echo "==> Starting web storefront on http://localhost:7001..."
npm run dev:web &
WEB_PID=$!
echo "    Web PID: $WEB_PID"
echo ""

sleep 3
echo "==> Ready"
echo "    API:        http://localhost:7000"
echo "    Storefront: http://localhost:7001  <- open this in your browser"
echo ""
echo "Press Ctrl+C to stop both processes."
wait 2>/dev/null || true
