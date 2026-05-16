#!/usr/bin/env bash
# Post-deploy smoke checks: env, migrations, API health/ready, public endpoints, storefront.
#
# Usage:
#   ./scripts/deploy-smoke.sh
#   API_URL=https://api.example.com WEB_URL=https://example.com ./scripts/deploy-smoke.sh
#
# Loads .env from repo root when present.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

API_URL="${API_URL:-${NEXT_PUBLIC_API_URL:-http://localhost:7000}}"
WEB_URL="${WEB_URL:-${FRONTEND_URL:-http://localhost:3000}}"
API_URL="${API_URL%/}"
WEB_URL="${WEB_URL%/}"

echo "==> ThinQShop deploy smoke"
echo "    API:  $API_URL"
echo "    Web:  $WEB_URL"
echo ""

echo "==> Environment check"
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/check-production-env.ts
echo ""

if [ -n "${DATABASE_URL:-}" ]; then
  echo "==> Migration status"
  npx prisma migrate status --schema=database/schema.prisma || {
    echo "Run: npm run db:migrate"
    exit 1
  }
  echo ""
else
  echo "==> Skipping migration status (DATABASE_URL not set)"
  echo ""
fi

curl_ok() {
  local url="$1"
  local label="$2"
  if ! curl -sf --max-time 15 "$url" > /dev/null; then
    echo "FAIL: $label ($url)"
    exit 1
  fi
  echo "OK:   $label"
}

echo "==> API liveness"
curl_ok "$API_URL/health" "GET /health"

echo "==> API readiness (DB + core env)"
READY_JSON="$(curl -sf --max-time 15 "$API_URL/ready")" || {
  echo "FAIL: GET /ready (is the backend running?)"
  exit 1
}
echo "OK:   GET /ready"
echo "      $READY_JSON"

echo "==> Public content API"
curl_ok "$API_URL/content/homepage-sections" "GET /content/homepage-sections"
curl_ok "$API_URL/content/settings/public" "GET /content/settings/public"

echo "==> Storefront"
HTTP_CODE="$(curl -sf -o /dev/null -w "%{http_code}" --max-time 20 "$WEB_URL/" || echo "000")"
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: GET $WEB_URL/ (HTTP $HTTP_CODE)"
  exit 1
fi
echo "OK:   GET $WEB_URL/ (HTTP 200)"

echo ""
echo "Deploy smoke passed."
echo ""
echo "Manual checks:"
echo "  - Forgot password → email → /reset-password (run: npm run email:process)"
echo "  - Checkout with Paystack test/live keys"
echo "  - Admin media upload"
