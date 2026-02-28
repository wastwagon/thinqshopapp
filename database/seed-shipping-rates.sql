-- Seed default Air and Sea logistics shipping rates (run if dropdown is empty).
-- From project root: npx prisma db execute --file database/seed-shipping-rates.sql --schema database/schema.prisma

-- Run migration 20260228100000_add_shipping_rate_currency first to add currency column.
INSERT INTO "shipping_method_rates" ("rate_id", "method", "name", "price", "type", "duration", "currency", "is_active", "sort_order", "created_at", "updated_at") VALUES
  ('air_express', 'air_freight', 'Express (3-5 days)', 17.00, 'KG', '3-5 days', 'USD', true, 0, NOW(), NOW()),
  ('air_normal', 'air_freight', 'Normal (7-14 days)', 13.00, 'KG', '7-14 days', 'USD', true, 1, NOW(), NOW()),
  ('air_special', 'air_freight', 'Special/Battery goods', 20.00, 'KG', NULL, 'USD', true, 2, NOW(), NOW()),
  ('air_phone', 'air_freight', 'Phone', 150.00, 'UNIT', NULL, 'RMB', true, 3, NOW(), NOW()),
  ('air_laptop', 'air_freight', 'Laptop', 200.00, 'KG', NULL, 'RMB', true, 4, NOW(), NOW()),
  ('sea_standard', 'sea_freight', 'Sea', 245.00, 'CBM', '45-60 days', 'USD', true, 0, NOW(), NOW())
ON CONFLICT ("rate_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price",
  "type" = EXCLUDED."type",
  "duration" = EXCLUDED."duration",
  "currency" = EXCLUDED."currency",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();
