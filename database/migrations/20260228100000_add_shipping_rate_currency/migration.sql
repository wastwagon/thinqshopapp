-- Add currency column to shipping_method_rates (USD | RMB)
ALTER TABLE "shipping_method_rates" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(5);

-- Set RMB for Phone and Laptop, USD for others
UPDATE "shipping_method_rates" SET "currency" = 'RMB' WHERE "rate_id" IN ('air_phone', 'air_laptop');
UPDATE "shipping_method_rates" SET "currency" = 'USD' WHERE "currency" IS NULL OR "currency" = '';
