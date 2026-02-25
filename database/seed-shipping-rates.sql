-- Seed default Air and Sea logistics shipping rates (run if dropdown is empty).
-- From project root: npx prisma db execute --file database/seed-shipping-rates.sql --schema database/schema.prisma

INSERT INTO "shipping_method_rates" ("rate_id", "method", "name", "price", "type", "duration", "is_active", "sort_order", "created_at", "updated_at") VALUES
  ('air_express', 'air_freight', 'Express (3-5 days)', 17.00, 'KG', '3-5 days', true, 0, NOW(), NOW()),
  ('air_laptop', 'air_freight', 'Laptop', 200.00, 'KG', NULL, true, 1, NOW(), NOW()),
  ('air_normal', 'air_freight', 'Normal (7-14 days)', 13.00, 'KG', '7-14 days', true, 2, NOW(), NOW()),
  ('air_phone', 'air_freight', 'Phone', 150.00, 'UNIT', NULL, true, 3, NOW(), NOW()),
  ('air_special', 'air_freight', 'Special/Battery Goods', 20.00, 'KG', NULL, true, 4, NOW(), NOW()),
  ('sea_standard', 'sea_freight', 'Sea Standard', 245.00, 'CBM', '45-60 days', true, 0, NOW(), NOW())
ON CONFLICT ("rate_id") DO NOTHING;
