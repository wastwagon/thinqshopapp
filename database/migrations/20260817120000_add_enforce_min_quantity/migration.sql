-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "enforce_min_quantity" BOOLEAN NOT NULL DEFAULT false;
