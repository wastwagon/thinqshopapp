-- Add stock quantity to Sell for Me submissions
ALTER TABLE "consignment_submissions" ADD COLUMN IF NOT EXISTS "stock_quantity" INTEGER NOT NULL DEFAULT 1;
