-- AlterTable
ALTER TABLE "money_transfers" ADD COLUMN IF NOT EXISTS "qr_fulfillments" JSONB;
