-- AlterTable
ALTER TABLE "money_transfers" ADD COLUMN     "admin_reply_images" JSONB,
ADD COLUMN     "qr_codes" JSONB;

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "carrier_tracking_number" VARCHAR(100),
ADD COLUMN     "destination_warehouse_id" INTEGER,
ADD COLUMN     "is_cod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "items_declaration" JSONB,
ADD COLUMN     "origin_warehouse_id" INTEGER,
ADD COLUMN     "shipping_method" VARCHAR(50);
