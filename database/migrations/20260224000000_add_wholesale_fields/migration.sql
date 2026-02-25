-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "wholesale_min_quantity" INTEGER,
ADD COLUMN IF NOT EXISTS "wholesale_discount_pct" DECIMAL(5,2);
