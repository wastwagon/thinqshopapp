-- AlterTable
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "declaration_image_urls" JSONB;
