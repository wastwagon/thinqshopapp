-- World-class content tables (hero, trust badges, testimonials, policies, homepage sections)
CREATE TABLE "hero_slides" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "subtitle" VARCHAR(500),
    "cta_text" VARCHAR(100),
    "cta_url" VARCHAR(500),
    "image_path" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trust_badges" (
    "id" SERIAL NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "optional_link" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_badges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "testimonials" (
    "id" SERIAL NOT NULL,
    "quote" TEXT NOT NULL,
    "author_name" VARCHAR(255) NOT NULL,
    "author_role" VARCHAR(255),
    "avatar_path" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "site_policies" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "short_text" VARCHAR(500),
    "full_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_policies_type_key" ON "site_policies"("type");

CREATE TABLE "homepage_sections" (
    "id" SERIAL NOT NULL,
    "section_key" VARCHAR(50) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "homepage_sections_section_key_key" ON "homepage_sections"("section_key");

-- ProductReview: add display_name and index
ALTER TABLE "product_reviews" ADD COLUMN IF NOT EXISTS "display_name" VARCHAR(100);
CREATE INDEX IF NOT EXISTS "product_reviews_product_id_is_approved_idx" ON "product_reviews"("product_id", "is_approved");

-- Product: add rating_aggregate and review_count
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating_aggregate" DECIMAL(3,2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_count" INTEGER NOT NULL DEFAULT 0;
