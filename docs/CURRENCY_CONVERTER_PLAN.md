# Currency Converter Implementation Plan

## Goal

- **Display** product prices in GHS, USD, and CNY (converted for user convenience)
- **Payment** always in GHS (base currency) — no change to checkout or Paystack
- **Free & reliable** exchange rate source
- **Safe rollout** — no risk to production

---

## Current State

| Area | Current | Notes |
|------|---------|------|
| Product prices | Stored in GHS | `products.price` (Decimal) |
| Checkout / Paystack | GHS only | `currency: 'GHS'` |
| Transfers | GHS ↔ CNY | `exchange_rates.rate_ghs_to_cny` (manual admin) |
| Display | GHS only | e.g. `₵1,234.00` |

---

## Recommended API: FXR-API (Frankfurter does not support GHS)

**Why FXR-API (dev.kwayisi.org):**
- **Free** — no API key, no signup
- **Supports GHS** — Frankfurter does not support GHS
- **160+ currencies** — USD, CNY, GHS
- **HTTPS** — server-side fetch (no CORS from browser needed)

**Endpoints (USD as base):**
```
GET https://dev.kwayisi.org/apis/forex/usd/ghs  → { pair: "USD/GHS", rate: 15.2 }
GET https://dev.kwayisi.org/apis/forex/usd/cny  → { pair: "USD/CNY", rate: 6.87 }
```
We derive: `ghs_to_usd = 1/rate_usd_ghs`, `ghs_to_cny = rate_usd_cny/rate_usd_ghs`

**Fallback:** If fetch fails, use last cached DB rates or GHS-only display.

---

## Safe Implementation Phases

### Phase 1: Backend rate service (no UI change)

**Scope:** Fetch and store rates; expose API. Production stays GHS-only.

1. **Migration:** New table `shop_currency_rates` (rate_ghs_to_usd, rate_ghs_to_cny, fetched_at)
2. **Refresh:** Lazy refresh — when `GET /content/currency-rates` is called, if cache >24h stale, fetch from FXR-API and store
3. **API:** `GET /content/currency-rates` returns `{ ghs_to_usd, ghs_to_cny }` (or 1.0 for GHS)
4. **Fallback:** If fetch fails, use last stored rate; if none, return null → frontend shows GHS only

**Risk:** Low. No change to checkout, orders, or payments.

---

### Phase 2: Display-only converter (feature-flagged)

**Scope:** Show converted prices everywhere. Payment still GHS.

1. **Context/hook:** `useCurrencyRates()` fetches rates, caches 24h
2. **Component:** `PriceDisplay({ amountGhs, showAlternates?: boolean })`
   - Primary: `₵X.XX` (always)
   - Optional: `≈ $Y.YY · ¥Z.ZZ` when rates available
3. **Feature flag:** `NEXT_PUBLIC_SHOW_CURRENCY_CONVERTER=false` (default off)
4. **Places to add:** ProductCard, product detail page, cart, checkout summary
5. **Checkout summary:** Show **both** converted amount and base (GHS), e.g. "₵1,234.00 (≈ $80.21)"

**Risk:** Low. Converter is additive; if broken, hide via flag.

---

### Phase 3: Currency selector (optional)

**Scope:** Let user pick display currency (GHS / USD / CNY). Still pay in GHS.

1. **User preference:** Store in localStorage or user profile
2. **Display logic:** Show primary price in selected currency, others as secondary
3. **Checkout:** Always show and charge GHS; add note: "Payment in GHS"

**Risk:** Low. Display only.

---

### Phase 4: Admin rate override (optional)

**Scope:** Admin can override auto-fetched rates for **shop display only**. Transfers keep manual rate.

1. Existing Admin → Settings GHS/CNY stays for **transfers** (unchanged)
2. Optional: New display-rate override for shop (GHS/USD, GHS/CNY) if Frankfurter needs manual correction
3. Priority: manual override > Frankfurter > last cached

---

## What We Will NOT Do

- ❌ Change payment currency (always GHS)
- ❌ Store product prices in multiple currencies
- ❌ Modify Paystack integration
- ❌ Change order/cart totals (always GHS)

---

## Rollback Plan

| Phase | Rollback |
|-------|----------|
| 1 | Disable cron; API returns null → no converter data |
| 2 | Set `NEXT_PUBLIC_SHOW_CURRENCY_CONVERTER=false` |
| 3 | Remove selector; default to GHS |

---

## Suggested Order

1. **Phase 1** — Implement backend + cron, deploy, verify rates in DB
2. **Test in staging** — Confirm Frankfurter fetch, fallback, API response
3. **Phase 2** — Add `PriceDisplay` with flag OFF, deploy
4. **Enable flag** — Turn on in production when confident
5. **Phase 3 & 4** — Add selector and admin override if needed

---

## Decisions (confirmed)

1. **Where to show:** All — product cards, product page, cart, checkout summary. At checkout summary: show **both** converted amount and base (GHS).
2. **Update frequency:** Daily.
3. **Transfers:** Keep current manual flow (Admin → Settings GHS/CNY). Frankfurter only for shop display rates.
