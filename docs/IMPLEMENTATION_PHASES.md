# Production Readiness: Implementation Phases

This document outlines phased work to remove simulation/seed testing, use clear English, add premium analytics, and complete SEO and accessibility before production.

---

## Phase 1: Real Data Only & Seed Policy (Current)

**Goals**
- Remove all simulated, fake, or hardcoded demo data from the web app.
- Use only real data from APIs; show clear empty states when there is no data.
- Document which database seeds are for development only and which are safe for initial production bootstrap.

**Actions**
1. **Admin dashboard**
   - Remove hardcoded chart data (e.g. fake “last 7 days” values). Build chart from real shipment data (e.g. group shipments by `created_at` by day) or show an empty state: “No shipment data yet”.
   - Remove or replace the fake summary card (e.g. “1.2K Users”, “₵4M Volume”, “94% Fulfillment”, “0.1s Latency”) with real metrics from backend APIs when available, or remove the card until those endpoints exist.
2. **Seed policy**
   - **Bootstrap (optional for first deploy):** `database/seed.ts` — admin user, categories, shipping zones, exchange rate. Run once per environment if needed; do not run repeatedly in production.
   - **Dev / testing only (do not run in production):**  
     `seed-admin.ts`, `seed-test-user.ts`, `seed-products.ts`, `seed-gh-warehouses.ts`, `seed-shipping-rates.ts` — used for local/testing data only.
3. **Any other UI**
   - Audit for remaining mock/sample/demo data and replace with API-driven data or explicit empty states.

**Done when:** Dashboard and all admin views show only real or empty data; seed usage is documented and not used for production testing.

---

## Phase 2: Clear English (No Jargon)

**Goals**
- Replace jargon, unclear labels, and excessive uppercase/tracking with plain, clear English.
- Use sentence case for labels and buttons unless a single word (e.g. “Save”, “Cancel”).

**Actions**
1. **Audit**
   - Review all user-facing copy: nav, sidebar, form labels, buttons, table headers, empty states, toasts, errors.
2. **Replace**
   - “Procurement requests” → keep or use “Purchase requests” if clearer for your users.
   - “Fulfillment” → “Orders delivered” or “Delivery rate” where it’s about orders.
   - “Latency” → “Response time” or remove if not user-facing.
   - Uppercase labels (e.g. “PENDING TRANSFERS”) → sentence case: “Pending transfers”.
   - Technical terms (e.g. “ID”, “SKU”) → keep only where necessary; add short explanations in tooltips or help text if needed.
3. **Consistency**
   - Use the same terms for the same concepts across admin and storefront (e.g. “Orders”, “Shipments”, “Transfers”).

**Done when:** No unexplained jargon; labels and copy are clear for a non-technical user.

**Progress:** Sidebar and admin pages updated: removed CSS `uppercase`/`tracking-wider` from labels so text displays in sentence case; product form labels clarified (e.g. "Minimum quantity for wholesale"). Dashboard logistics, transfers, and procurement had uppercase removed from headings/labels.

---

## Phase 3: Premium Advanced Analytics

**Goals**
- Track customer behavior and website performance with a small set of high-value, production-ready features.

**Recommended features (based on common “premium” analytics setups)**
1. **Core web analytics**
   - Page views and key events (e.g. product view, add to cart, checkout start, purchase).
   - Optional: Google Analytics 4 (GA4) and/or a product analytics tool (e.g. Mixpanel, PostHog, Vercel Analytics).
2. **Customer behavior**
   - Conversion funnel: landing → product view → add to cart → checkout → payment.
   - Key events: search, category view, product view, add to cart, remove from cart, checkout step, purchase.
3. **Performance**
   - Core Web Vitals (LCP, FID/INP, CLS) via GA4, Vercel Analytics, or a dedicated RUM tool.
4. **Optional (later)**
   - Session replay (e.g. PostHog, Mixpanel) with privacy rules (mask PII, no recording on sensitive pages).
   - Heatmaps (e.g. Hotjar, Crazy Egg) for key pages.

**Implementation**
- Add a thin analytics abstraction (e.g. `lib/analytics.ts`) that:
  - Tracks page views and custom events.
  - Supports multiple backends (e.g. GA4, PostHog) via env-driven config.
- Instrument key pages and flows (home, shop, product, cart, checkout, thank-you).
- Ensure consent and privacy: no tracking of PII in URLs or event payloads; respect Do Not Track / consent banner if you add one later.

**Done when:** Key events and (optionally) Core Web Vitals are tracked; analytics is behind env/config and ready to plug in GA4 or another provider.

**Progress:** `web/lib/analytics.ts` added with event types and optional GA4 payloads. `AnalyticsProvider` in main layout: init on load, `trackPageView` on route change. Events wired: `trackViewItem` on product page, `trackAddToCart` in CartContext, `trackBeginCheckout` and `trackPurchase` in CheckoutClient. Enable with `NEXT_PUBLIC_ANALYTICS_ENABLED=true`; optional `NEXT_PUBLIC_GA_MEASUREMENT_ID` for gtag.

---

## Phase 4: Premium SEO & Accessibility

**Goals**
- Follow SEO and accessibility best practices so the site is indexable, understandable by search engines, and usable by assistive technologies.

**SEO**
1. **Metadata**
   - Unique `<title>` and meta description per route (home, shop, category, product, key static pages).
   - Open Graph and Twitter Card tags for sharing.
   - Canonical URL where relevant (e.g. product pages, paginated lists).
2. **Technical**
   - Valid `robots.txt` (allow/disallow as needed; no blanket block of important pages).
   - XML sitemap for public pages (e.g. `/sitemap.xml`).
   - `lang` on `<html>` (already in place); `hreflang` if you add multiple locales.
3. **Structured data**
   - JSON-LD: at least `WebSite` and `Organization` on the main layout.
   - `Product` (and optionally `Offer`, `AggregateRating`) on product pages.
4. **Content**
   - Semantic HTML (`<main>`, `<nav>`, `<article>`, headings hierarchy).
   - Meaningful alt text for images; avoid “image of” unless needed.

**Accessibility (WCAG 2.1 Level AA target)**
1. **Basics**
   - Skip link to main content (already present); ensure `#main-content` exists and is used.
   - Sufficient color contrast; focus visible on interactive elements.
   - Forms: visible labels, clear errors, and (where applicable) required/aria attributes.
2. **Keyboard & focus**
   - All actions reachable and usable via keyboard; no focus traps in modals without a way to close.
   - Logical tab order; focus management in dialogs (e.g. focus inside on open, return on close).
3. **Screen readers**
   - Images: alt text (or `alt=""` when decorative).
   - Buttons/links: descriptive text or `aria-label` where the visible text is not enough.
   - Live regions for dynamic updates (e.g. cart count, toasts) where it improves UX.
4. **Testing**
   - Run Lighthouse (SEO + Accessibility) and axe DevTools on critical flows; fix critical/serious issues.

**Done when:** Metadata and structured data are in place, robots.txt and sitemap are valid, and critical accessibility issues are resolved and re-tested.

**Progress:** Root layout: `metadataBase`, title template, Open Graph, Twitter card, keywords; JSON-LD `WebSite` in body. `app/robots.ts`: allow `/`, disallow `/admin`, `/dashboard`, `/checkout`, `/account`; sitemap URL. `app/sitemap.ts`: home, `/shop`, `/terms`. Set `NEXT_PUBLIC_SITE_URL` for production. Skip link and `#main-content` already present; focus-visible and skip-link styles in globals.css.

---

## Summary Table

| Phase | Focus                    | Outcome                                      |
|-------|--------------------------|----------------------------------------------|
| 1     | Real data & seed policy   | No fake data; clear seed usage               |
| 2     | Clear English            | No jargon; consistent, plain copy          |
| 3     | Premium analytics         | Events + optional CWV; ready for GA4/PostHog |
| 4     | SEO & accessibility      | Metadata, structured data, WCAG-oriented UX  |

---

## Order of Work

Recommended sequence: **Phase 1 → Phase 2 → Phase 3 → Phase 4.**  
Phase 1 and 2 can overlap (e.g. fix copy on the same files you touch for real data). Phase 3 and 4 can be done in parallel by different people if desired; both depend on a stable, real-data UI from Phase 1.
