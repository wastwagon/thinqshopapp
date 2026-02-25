-- CreateTable
CREATE TABLE IF NOT EXISTS "shipping_method_rates" (
    "id" SERIAL NOT NULL,
    "rate_id" VARCHAR(50) NOT NULL,
    "method" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "duration" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_method_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "shipping_method_rates_rate_id_key" ON "shipping_method_rates"("rate_id");

-- Seed Air and Sea rates (match admin dashboard)
INSERT INTO "shipping_method_rates" ("rate_id", "method", "name", "price", "type", "duration", "is_active", "sort_order", "created_at", "updated_at") VALUES
  ('air_express', 'air_freight', 'Express (3-5 days)', 17.00, 'KG', '3-5 days', true, 0, NOW(), NOW()),
  ('air_laptop', 'air_freight', 'Laptop', 200.00, 'KG', NULL, true, 0, NOW(), NOW()),
  ('air_normal', 'air_freight', 'Normal (7-14 days)', 13.00, 'KG', '7-14 days', true, 0, NOW(), NOW()),
  ('air_phone', 'air_freight', 'Phone', 150.00, 'UNIT', NULL, true, 0, NOW(), NOW()),
  ('air_special', 'air_freight', 'Special/Battery Goods', 20.00, 'KG', NULL, true, 0, NOW(), NOW()),
  ('sea_standard', 'sea_freight', 'Sea Standard', 245.00, 'CBM', '45-60 days', true, 0, NOW(), NOW())
ON CONFLICT ("rate_id") DO NOTHING;
