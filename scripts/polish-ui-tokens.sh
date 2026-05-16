#!/usr/bin/env bash
# Safe bulk token migration for admin + dashboard TSX (flat UI, brand buttons).
set -euo pipefail
cd "$(dirname "$0")/.."

DIRS=("web/app/(main)/admin" "web/app/(main)/dashboard" "web/components/admin" "web/app/(main)/shop")

for dir in "${DIRS[@]}"; do
  [ -d "$dir" ] || continue
  while IFS= read -r -d '' f; do
    # Skip if no match-heavy patterns
    grep -qE 'shadow-sm|bg-gray-900|rounded-2xl border border-gray' "$f" 2>/dev/null || continue
    perl -i -pe '
      s/ bg-white rounded-2xl border border-gray-200 shadow-sm/ dashboard-card/g;
      s/ bg-white rounded-2xl border border-gray-200\/90 overflow-hidden/ dashboard-table-wrap/g;
      s/ bg-white rounded-2xl border border-gray-100 shadow-sm/ dashboard-card/g;
      s/ bg-white rounded-2xl border border-gray-200\/90 overflow-hidden/ dashboard-table-wrap/g;
      s/ bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden/ dashboard-table-wrap/g;
      s/ bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden/ admin-table-wrap/g;
      s/ bg-gray-900 text-white/bg-brand text-white/g;
      s/ bg-gray-900 rounded-xl/bg-brand rounded-xl/g;
      s/ hover:bg-black/hover:bg-brand\/90/g;
      s/ hover:bg-gray-800/hover:bg-brand\/90/g;
      s/ shadow-sm border border-gray-100/border border-gray-200\/90/g;
      s/ shadow-sm transition-all/transition-colors/g;
      s/ shadow-sm overflow-hidden/overflow-hidden/g;
      s/ shadow-sm"/"/g;
      s/ shadow-sm / /g;
      s/ section className="bg-gray-900/section className="admin-card border-l-4 border-l-brand/g;
    ' "$f"
    echo "polished: $f"
  done < <(find "$dir" -name '*.tsx' -print0 2>/dev/null)
done

echo "Done."
