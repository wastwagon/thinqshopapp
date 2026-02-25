# Migration & Seed Spec — World-Class Ecommerce Content

Companion to `WORLD_CLASS_ECOMMERCE_ENHANCEMENT_PLAN.md`. Defines exact table structures and seed examples so migrations and seed scripts can be implemented without ambiguity.

---

## 1. New tables (Prisma schema additions)

```prisma
// --- CONTENT TABLES (world-class homepage & PDP) ---

model HeroSlide {
  id         Int      @id @default(autoincrement())
  title      String   @db.VarChar(255)
  subtitle   String?  @db.VarChar(500)
  cta_text   String?  @db.VarChar(100)
  cta_url    String?  @db.VarChar(500)
  image_path String?  @db.VarChar(500)   // relative path or media reference
  sort_order Int      @default(0)
  is_active  Boolean  @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("hero_slides")
}

model TrustBadge {
  id            Int      @id @default(autoincrement())
  icon          String   @db.VarChar(50)   // e.g. shield, truck, rotate-ccw, star, lock
  label         String   @db.VarChar(255)
  optional_link String?  @db.VarChar(500)
  sort_order    Int      @default(0)
  is_active     Boolean  @default(true)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  @@map("trust_badges")
}

model Testimonial {
  id           Int      @id @default(autoincrement())
  quote        String   @db.Text
  author_name  String   @db.VarChar(255)
  author_role  String?  @db.VarChar(255)   // e.g. "Content Creator", "Videographer"
  avatar_path  String?  @db.VarChar(500)
  sort_order   Int      @default(0)
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  @@map("testimonials")
}

model SitePolicy {
  id         Int      @id @default(autoincrement())
  type       String   @unique @db.VarChar(30)   // 'delivery' | 'returns'
  short_text String?  @db.VarChar(500)          // for PDP snippet
  full_text  String?  @db.Text                   // for policy page
  updated_at DateTime @updatedAt

  @@map("site_policies")
}

// Optional: explicit section ordering. Alternative is JSON in Setting.
model HomepageSection {
  id         Int      @id @default(autoincrement())
  section_key String  @unique @db.VarChar(50)   // hero, trust_strip, flash_sales, featured, categories, testimonials, all_products
  sort_order Int      @default(0)
  is_enabled Boolean  @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("homepage_sections")
}
```

**ProductReview (existing) — optional additive:**

- Add `display_name` (e.g. `@db.VarChar(100)`) so we can show "Kofi M." without exposing email.
- Add index: `@@index([product_id, is_approved])` for listing.

**Product (existing) — optional:**

- Add `rating_aggregate Decimal? @db.Decimal(3, 2)` (e.g. 4.75).
- Add `review_count Int @default(0)`.
- Kept in sync when reviews are approved/rejected (backend job or on save).

---

## 2. Setting keys (use existing `Setting` table)

| setting_key | Description | Example value |
|-------------|-------------|---------------|
| `free_shipping_threshold_ghs` | Free delivery above this amount (GHS) | `500` |
| `site_orders_delivered_text` | Social proof line | `10,000+ orders delivered` |
| `support_phone` | Contact | `+233 XX XXX XXXX` |
| `support_email` | Contact | `support@thinqshop.com` |
| `homepage_sections` | (Optional) JSON array of section keys in order if not using HomepageSection table | `["hero","trust_strip","flash_sales","featured","categories","testimonials","all_products"]` |

---

## 3. Seed data — hero slides (2–3 rows)

| title | subtitle | cta_text | cta_url | sort_order |
|-------|----------|----------|---------|------------|
| Pro gear for creators | Cameras, computers, and pro video — sourced globally, delivered in Ghana. | Shop now | /shop | 0 |
| Free delivery on orders over ₵500 | Same-day dispatch in Accra. Nationwide delivery. | See delivery info | /privacy | 1 |
| Same-day Accra dispatch | Place before 12pm for same-day dispatch in Greater Accra. | Track order | /track | 2 |

`image_path`: leave null or set to a placeholder path; admin can replace via Media.

---

## 4. Seed data — trust badges (4–6 rows)

| icon | label | optional_link | sort_order |
|------|-------|----------------|------------|
| shield | Secure checkout | null or /privacy | 0 |
| truck | Free delivery over ₵500 | null or /privacy | 1 |
| rotate-ccw | Easy returns | null or /terms | 2 |
| star | Rated 4.8 by customers | null | 3 |
| lock | Paystack protected | https://paystack.com | 4 |
| check-circle | Warranty on select items | /shop | 5 |

---

## 5. Seed data — testimonials (3–5 rows)

Example (original copy, Ghana/West Africa context):

| quote | author_name | author_role | sort_order |
|-------|-------------|-------------|------------|
| ThinQShop delivered my camera in two days. Packaging was perfect and the team answered every question. | Akua B. | Videographer | 0 |
| Finally a place that stocks pro gear in Ghana. Prices are fair and the logistics are reliable. | Kofi M. | Content Creator | 1 |
| I’ve ordered twice — laptops and accessories. Both times smooth and on time. | Ama S. | Photographer | 2 |

`avatar_path`: null in seed; admin can add later.

---

## 6. Seed data — site policies (2 rows)

**Delivery (type = `delivery`):**

- **short_text:** “Free delivery on orders over ₵500. Same-day dispatch in Accra when you order before 12pm.”
- **full_text:** 2–3 paragraphs (delivery zones, times, fees, tracking).

**Returns (type = `returns`):**

- **short_text:** “14-day returns on unused items. Contact support to start a return.”
- **full_text:** 2–3 paragraphs (conditions, process, refund timing).

---

## 7. Seed data — homepage sections (7 rows)

| section_key | sort_order | is_enabled |
|-------------|------------|------------|
| hero | 0 | true |
| trust_strip | 1 | true |
| flash_sales | 2 | true |
| featured | 3 | true |
| categories | 4 | true |
| testimonials | 5 | true |
| all_products | 6 | true |

---

## 8. Seed data — settings (4 rows)

| setting_key | setting_value | description |
|-------------|---------------|-------------|
| free_shipping_threshold_ghs | 500 | Free delivery threshold (GHS) |
| site_orders_delivered_text | 10,000+ orders delivered | Social proof line |
| support_phone | +233 XX XXX XXXX | Support phone |
| support_email | support@thinqshop.com | Support email |

---

## 9. Seed data — product reviews (optional but recommended)

- Pick 5–10 products (by id or slug) that exist in DB.
- Create or use 3–5 seed users (with UserProfile first_name/last_name for display).
- Insert 2–5 approved reviews per product: mix of ratings (3–5), some with `review_text`, optional `review_images` (array of paths).
- If Product has `rating_aggregate` and `review_count`, run an update after seeding reviews (e.g. `UPDATE products SET rating_aggregate = X, review_count = Y WHERE id = Z`).

---

## 10. Migration file naming and seed script

- **Migration:** e.g. `database/migrations/YYYYMMDDHHMMSS_world_class_content/migration.sql` (or Prisma migrate naming).
- **Seed:** `database/seed.ts` or `prisma/seed.ts` that:
  1. Inserts hero_slides, trust_badges, testimonials, site_policies, homepage_sections, settings (using upsert where needed).
  2. Optionally seeds product reviews and updates product aggregates.
- Run after deploy: `npx prisma migrate deploy` then `npx prisma db seed` (or `ts-node database/seed.ts`).

This spec gives a complete picture for implementing migrations and seed so the site has a real, world-class feel and all content is manageable from the admin panel.
