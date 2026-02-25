# ThinQShop — World-Class Ecommerce Enhancement Plan

**Purpose:** One comprehensive blueprint to get the store to a modern, world-class feel and presence. All net-new content is manageable from the admin panel. Where we lack content, we use structure and seed data inspired by best-in-class sites. **This document is the planning artifact only; implementation follows after approval.**

**Design principle:** **Mobile-first, responsive on all devices.** All new UI (homepage, PDP, checkout, admin) must be designed for small screens and touch first; then scale up for tablet and desktop. Buttons and text must be consistent and touch-friendly (min 44px tap targets, readable base font sizes) across breakpoints.

---

## 1. Target vision (the “career image”)

- **Homepage:** One clear value proposition above the fold; rotating or single hero with primary CTA; trust strip (secure checkout, free delivery threshold, ratings); flash/featured sections; category browse; social proof (testimonials or “X customers”); footer with policies and support.
- **Product pages:** Large imagery, sticky add-to-cart, specs, **reviews with photos and aggregate rating**, delivery/returns copy, optional “Frequently bought together” and stock/urgency when we have data.
- **Checkout:** Minimal steps, trust line near payment, optional guest checkout.
- **Admin:** Every piece of customer-facing content (hero, trust badges, testimonials, policies, homepage section order, review moderation, featured products, categories) is editable or manageable from the admin panel—no hardcoded copy for the new experience.

Reference feel (structure and patterns, not literal copy): Apple (clean hero, trust, minimal nav), Amazon (reviews, badges, delivery info), Allbirds / Shopify-style stores (testimonials, single CTA, trust strip), regional leaders (Jumia/Konga-style category + trust).

---

## 2. Gap summary

| Area | Current | Goal |
|------|---------|------|
| Hero | Single static block, hardcoded copy | Admin-managed slides (title, subtitle, CTA, image, link, order). Seed 1–3 slides. |
| Trust above the fold | None | Admin-managed trust badges (icon, label, optional link). Seed 4–6 (secure checkout, free delivery over ₵X, returns, ratings). |
| Social proof | None | Testimonials block (admin: quote, author name, role/company, avatar, order). Seed 3–5. |
| Reviews on PDP | Schema exists; not shown on frontend; no admin | Show approved reviews with photos; aggregate rating; admin: list, approve/reject, optional reply. Seed reviews for key products. |
| Delivery/returns on PDP | None | Admin-managed policy snippets (short + full); show short on PDP, link to full. Seed one policy each. |
| Homepage section order | Fixed in code | Admin: enable/disable and order sections (hero, trust, flash, featured, categories, testimonials, all products). |
| Global site copy | Hardcoded or missing | Free shipping threshold, “X orders delivered”, support line—stored in settings, editable in admin. |
| Stock/urgency | Not shown | Show “In stock” / “Only X left” when data exists; optional low-stock badge. |
| Categories on nav | Static list in code | Already have Category in DB; ensure nav uses API and admin can set order/image for homepage. |

---

## 3. Schema (migrations) and seed strategy

### 3.1 New / extended tables

- **HeroSlide**  
  - `id`, `title`, `subtitle`, `cta_text`, `cta_url`, `image_path`, `sort_order`, `is_active`, `created_at`, `updated_at`.  
  - Admin: CRUD, reorder, toggle active.

- **TrustBadge**  
  - `id`, `icon` (e.g. `shield`, `truck`, `rotate-ccw`, `star`), `label`, `optional_link`, `sort_order`, `is_active`, `created_at`, `updated_at`.  
  - Admin: CRUD, reorder.

- **Testimonial**  
  - `id`, `quote`, `author_name`, `author_role` (e.g. “Content Creator”), `avatar_path` (optional), `sort_order`, `is_active`, `created_at`, `updated_at`.  
  - Admin: CRUD, reorder.

- **DeliveryReturnPolicy** (or split into two tables if preferred)  
  - `id`, `type` (`delivery` | `returns`), `short_text` (for PDP), `full_text` (for policy page), `updated_at`.  
  - One row per type; admin edits both.

- **HomepageSection** (optional; alternative: use Setting key-value)  
  - Either a table `id`, `section_key` (e.g. `hero`, `trust`, `flash`, `featured`, `categories`, `testimonials`, `all_products`), `sort_order`, `is_enabled`, or store JSON in `Setting` like `homepage_sections`.  
  - Admin: toggle sections, drag-and-drop order.

- **Setting** (existing)  
  - Use for: `free_shipping_threshold_ghs`, `site_orders_delivered_text` (e.g. “10,000+ orders delivered”), `support_phone`, `support_email`, and any future globals.  
  - Admin: “Site copy” or “Storefront” settings form.

- **ProductReview** (existing)  
  - Already has `rating`, `review_text`, `review_images`, `is_approved`.  
  - Add optional `display_name` (for “Kofi M.” when user has no profile), or derive from UserProfile.  
  - No new table; ensure index on `(product_id, is_approved)` for listing.

- **Product** (existing)  
  - Optional: `rating_aggregate` (Decimal), `review_count` (Int) cached and updated when reviews change (or compute on read).  
  - Enables fast display on cards and PDP without counting every time.

### 3.2 Seed data strategy

- **Reference sites (structure only):**  
  - Use patterns from: Apple (hero + trust), Amazon (reviews, delivery/returns), Allbirds (testimonials, single CTA), and one high-end tech retailer (e.g. B&H) for category/copy tone.  
  - Do **not** copy text verbatim; use them to define **structure** (e.g. “hero title + subtitle + one CTA”, “three trust badges”, “testimonial: quote + name + role”).

- **Scrape / create:**  
  - **Hero slides:** Create 2–3 slides with original copy (e.g. “Pro gear for creators”, “Free delivery on orders over ₵500”, “Same-day Accra dispatch”). Images: use existing Media or placeholders; admin can replace.  
  - **Trust badges:** Seed 4–6: “Secure checkout”, “Free delivery over ₵X”, “Easy returns”, “Rated 4.8 by customers”, “Paystack protected”, “Warranty on select items”.  
  - **Testimonials:** Write 3–5 fictional but plausible testimonials (Ghana/West Africa context), with names and roles; avatar optional or placeholder.  
  - **Policies:** One delivery and one returns policy (short + full). Short: 1–2 lines for PDP; full: 2–3 paragraphs for policy page.  
  - **Reviews:** Seed 2–5 approved reviews per product for 5–10 key products (mix of ratings, some with review_text and optional review_images). Use existing User ids or create seed users; set `is_approved = true`.  
  - **Settings:** Seed `free_shipping_threshold_ghs`, `site_orders_delivered_text`, `support_phone`, `support_email`.

- **Migration + seed flow:**  
  - One migration adding: `hero_slides`, `trust_badges`, `testimonials`, `delivery_return_policies` (or two rows in a generic table), optional `homepage_sections` or Setting keys.  
  - One Prisma seed script (or SQL seed) that:  
    - Inserts hero slides, trust badges, testimonials, policy rows, settings.  
    - Optionally updates Product with `rating_aggregate` and `review_count` from seeded reviews.  
  - Seed runs after `migrate deploy` so the site has a “real feel” out of the box.

---

## 4. Frontend enhancements (by area)

### 4.1 Homepage

- **Hero:**  
  - If multiple slides: carousel (or single slide) with title, subtitle, CTA button (text + url from API).  
  - Image from Media/API; fallback placeholder.  
  - Data: `GET /content/hero-slides` (active only, ordered).

- **Trust strip:**  
  - Row of badges below hero (or above footer on mobile): icon + label.  
  - Data: `GET /content/trust-badges`.  
  - Optional: “Free delivery over ₵X” from settings.

- **Flash sales / Featured / Categories / All products:**  
  - Keep current logic; ensure “Featured” uses `Product.is_featured` from API.  
  - Categories: from `GET /products/categories`; link to `/shop/[category]`; optionally show category image from Category if present.

- **Testimonials:**  
  - New section: 3–5 cards (quote, author name, role, avatar).  
  - Data: `GET /content/testimonials`.

- **Section order/visibility:**  
  - Homepage component reads `GET /content/homepage-sections` (or settings) and renders sections in order; sections with `is_enabled: false` are skipped.

### 4.2 Product detail page (PDP)

- **Reviews block:**  
  - Aggregate: average rating + total count (from Product or computed).  
  - List approved reviews: rating, text, optional images, display name, date.  
  - Pagination or “Load more” if many.  
  - Data: `GET /products/:slug` (include `reviews` where `is_approved`) and optionally `GET /products/:slug/reviews?page=&limit=`.

- **Delivery & returns:**  
  - Short text from `GET /content/policies` (type delivery/returns); link to “Delivery info” / “Returns policy” page (full text).  
  - Rendered near add-to-cart or under specs.

- **Stock/urgency:**  
  - If `stock_quantity` available: “In stock” or “Only X left” (when below threshold).  
  - Optional badge “Low stock” when `stock_quantity <= low_stock_threshold`.

### 4.3 Checkout

- **Trust line:**  
  - One line near Paystack: “Secure payment with Paystack” and optionally “Free delivery on orders over ₵X” from settings.

### 4.4 Global

- **Footer / Nav:**  
  - Support phone/email from settings (if present).  
  - “X orders delivered” or similar from settings in footer or trust strip.

- **Loading / skeletons:**  
  - Replace “Loading products…” with skeleton cards on homepage and PDP where applicable.

---

## 5. Backend / API

- **Content module (new):**  
  - `GET /content/hero-slides` — active, ordered.  
  - `GET /content/trust-badges` — active, ordered.  
  - `GET /content/testimonials` — active, ordered.  
  - `GET /content/policies` — delivery + returns (short + full).  
  - `GET /content/homepage-sections` — ordered list of enabled section keys (or from Setting).  
  - All public (no auth).

- **Content admin (protected):**  
  - CRUD for hero slides, trust badges, testimonials.  
  - Update delivery/returns policy (short + full).  
  - Update homepage section order/visibility.  
  - Use existing auth guard (admin/superadmin).

- **Settings (extend or add):**  
  - `GET /settings/public` — keys needed for storefront (e.g. `free_shipping_threshold_ghs`, `site_orders_delivered_text`, `support_phone`, `support_email`).  
  - Admin: `GET /settings`, `PATCH /settings` (bulk or by key) for “Site copy” / “Storefront”.

- **Reviews:**  
  - `GET /products/:slug/reviews?page=&limit=` — approved only, with user display name (or `display_name`).  
  - `POST /products/:id/reviews` — authenticated user, after order (optional validation).  
  - Admin: `GET /reviews` (all or by product), `PATCH /reviews/:id` (approve/reject, optional reply).  
  - After approve/reject: optionally update Product `rating_aggregate` and `review_count`.

- **Product:**  
  - Ensure `GET /products/:slug` includes approved reviews (or only aggregate); or keep payload small and use separate reviews endpoint.  
  - Expose `rating_aggregate` and `review_count` on product when available.

---

## 6. Admin panel (full-stack) — every addition manageable

- **Content / Homepage**  
  - **Hero slides:** List, add, edit, delete, reorder, toggle active. Fields: title, subtitle, CTA text, CTA URL, image (Media picker), sort order.  
  - **Trust badges:** List, add, edit, delete, reorder. Fields: icon (select), label, optional link, sort order.  
  - **Testimonials:** List, add, edit, delete, reorder. Fields: quote, author name, role, avatar (Media picker), sort order, active.  
  - **Homepage sections:** List of sections (hero, trust, flash, featured, categories, testimonials, all products); toggle enabled, drag-and-drop order.  
  - **Policies:** Two forms: Delivery (short + full text), Returns (short + full text). Rich text or textarea.

- **Site copy / Storefront settings**  
  - Form: Free shipping threshold (₵), “Orders delivered” text, Support phone, Support email.  
  - Stored in `Setting`; saved via PATCH /settings or equivalent.

- **Reviews**  
  - **Reviews** (new admin page): Table of all reviews (product, user, rating, text snippet, date, approved yes/no).  
  - Actions: Approve, Reject, optional “Reply” (if we add reply field).  
  - Filter by product, status.  
  - Optional: link to product edit.

- **Products** (existing)  
  - Keep “Featured” toggle so Featured section on homepage is driven by data.  
  - Optional: “Show on hero” or “Hero product” for a single product-driven hero variant (can be Phase 2).

- **Categories** (existing)  
  - Ensure sort_order and image are editable; homepage “Shop by category” uses API and shows image if present.

- **Sidebar / nav**  
  - Add links: “Content” or “Homepage” (hero, trust, testimonials, sections), “Reviews”, “Site copy” (under Settings or its own).

---

## 7. Implementation phases (order of work)

- **Phase A — Schema & seed**  
  - Migration: add `hero_slides`, `trust_badges`, `testimonials`, `delivery_return_policies` (or single policy table with type), optional `homepage_sections` or Setting keys; add `display_name` to ProductReview if desired; optional `rating_aggregate`/`review_count` on Product.  
  - Seed: hero slides, trust badges, testimonials, delivery/returns text, settings (free shipping, orders delivered, support).  
  - Seed: approved reviews for 5–10 products; update Product aggregates if used.  
  - Reference: use structure from reference sites; copy is original and tailored to ThinQShop/Ghana.

- **Phase B — Content API & admin**  
  - Backend: Content module (public GET endpoints + admin CRUD for hero, trust, testimonials, policies, homepage sections).  
  - Backend: Settings public + admin (read/update storefront keys).  
  - Admin UI: Content/Homepage (hero, trust, testimonials, sections, policies), Site copy form.  
  - No frontend storefront changes yet (optional: quick wire of hero to new API to verify).

- **Phase C — Reviews API & admin**  
  - Backend: GET/POST reviews; admin list + approve/reject (and optional reply).  
  - Admin UI: Reviews page (list, filter, approve, reject).  
  - Optional: Product aggregate update on review change.

- **Phase D — Homepage frontend**  
  - Hero from API (carousel or single), trust strip, testimonials section, section order from API.  
  - Skeleton loaders for above-the-fold sections.  
  - Categories from API with images if present.

- **Phase E — PDP frontend**  
  - Reviews block (aggregate + list, optional images), delivery/returns snippet + link to policy page.  
  - Stock/urgency when data exists.  
  - Skeleton for product and reviews.

- **Phase F — Checkout & global**  
  - Trust line near payment; settings-driven copy (free delivery, support).  
  - Footer/nav use support and “orders delivered” from settings.  
  - Any remaining polish (loading states, a11y).

---

## 8. Reference sites (structure only — no literal scraping)

- **Apple:** Hero: one big message + one CTA; trust: delivery, trade-in, support; clean nav.  
- **Amazon:** PDP: reviews with photos, aggregate rating, “Frequently bought together”, delivery/returns in one block.  
- **Allbirds:** Homepage: single hero, trust strip, testimonials with photo + quote + name; minimal nav.  
- **B&H / high-end tech:** Category imagery, specs, warranty messaging.  
- **Jumia/Konga (regional):** Category grid, trust badges, “X orders” style social proof.

Use these to define **layout and content types** (what blocks exist, what fields they have). All copy and seed data in the project must be **original** and suitable for ThinQShop (GHS, West Africa, tech/pro gear).

---

## 9. Deliverables checklist (before implementation)

- [ ] Approve this plan (vision, schema, seed strategy, admin scope).  
- [ ] Confirm reference sites are only for structure; all seed copy is original.  
- [ ] Confirm Phase A–F order; any reorder or split (e.g. “Reviews admin only” in Phase C, “Reviews on PDP” in Phase E).  
- [ ] Migrations and seed script location: e.g. `database/migrations/`, `database/seed.ts` or `prisma/seed.ts`.  
- [ ] Admin nav: exact labels (“Content”, “Homepage”, “Reviews”, “Site copy”) and where they live (sidebar under “Settings” or top-level).

Once this is locked, implementation can proceed phase by phase with migrations and seed giving a real, world-class feel and full admin control over every addition.
