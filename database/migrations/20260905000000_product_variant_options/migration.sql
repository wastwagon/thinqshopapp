-- Combinatorial product variants: option axes on product + option_values on each SKU row
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variant_options" JSONB;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "option_values" JSONB;
