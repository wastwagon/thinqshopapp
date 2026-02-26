-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_delivery_address_id_fkey";

-- AlterTable
ALTER TABLE "shipments" ALTER COLUMN "delivery_address_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
