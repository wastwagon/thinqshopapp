#!/bin/bash
# Check products and categories in the production database.
#
# Option A - VPS terminal (from project directory):
#   ./scripts/check-products.sh
#
# Option B - Coolify: find your app's db container name first, then:
#   docker exec -it <db-container-name> psql -U thinq_user -d thinqshop_db -c "
#     SELECT p.id, p.name, p.slug, c.name as category, p.is_active
#     FROM products p
#     LEFT JOIN categories c ON p.category_id = c.id
#     ORDER BY p.id;
#   "
#
# Option C - Backend container (Coolify → backend → Terminal):
#   node database/check-products.js

set -e

# Try docker compose first (run from project root on VPS)
if command -v docker &>/dev/null; then
  # Find db container (Coolify names: db-<project>-<suffix> or similar)
  DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '^db-|_db-' | head -1)
  if [ -n "$DB_CONTAINER" ]; then
    echo "Using db container: $DB_CONTAINER"
    echo ""
    docker exec "$DB_CONTAINER" psql -U thinq_user -d thinqshop_db -c "
      SELECT '=== CATEGORIES ===' as info;
      SELECT id, name, slug FROM categories ORDER BY id;
      SELECT '=== PRODUCTS ===' as info;
      SELECT p.id, p.name, p.slug, c.name as category, p.is_active
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id;
      SELECT '--- Summary ---' as info;
      SELECT (SELECT count(*) FROM categories) as categories, (SELECT count(*) FROM products) as products;
    "
    exit 0
  fi

  # Fallback: docker compose exec (if in compose project dir)
  if [ -f docker-compose.yaml ] || [ -f docker-compose.yml ]; then
    echo "Trying docker compose exec db..."
    docker compose exec db psql -U thinq_user -d thinqshop_db -c "
      SELECT id, name, slug FROM categories ORDER BY id;
      SELECT p.id, p.name, p.slug, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id;
    " 2>/dev/null && exit 0
  fi
fi

echo "Could not find db container. Alternatives:"
echo "  1. Run from backend container: node database/check-products.js"
echo "  2. Manually: docker exec -it <db-container> psql -U thinq_user -d thinqshop_db -c \"SELECT id, name, slug FROM products;\""
exit 1
