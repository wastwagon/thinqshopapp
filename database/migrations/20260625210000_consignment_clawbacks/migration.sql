-- Phase C: track consignor clawbacks when refund happens after payout
CREATE TYPE "ConsignmentClawbackStatus" AS ENUM ('pending', 'recovered', 'waived');

CREATE TABLE "consignment_clawbacks" (
  "id" SERIAL NOT NULL,
  "consignment_submission_id" INTEGER NOT NULL,
  "order_id" INTEGER NOT NULL,
  "consignor_user_id" INTEGER NOT NULL,
  "amount_ghs" DECIMAL(10, 2) NOT NULL,
  "recovered_ghs" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "status" "ConsignmentClawbackStatus" NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "settled_at" TIMESTAMP(3),
  "settled_by_admin_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "consignment_clawbacks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consignment_clawbacks_status_created_idx" ON "consignment_clawbacks"("status", "created_at");
CREATE INDEX "consignment_clawbacks_consignor_idx" ON "consignment_clawbacks"("consignor_user_id");
CREATE INDEX "consignment_clawbacks_order_idx" ON "consignment_clawbacks"("order_id");

ALTER TABLE "consignment_clawbacks"
  ADD CONSTRAINT "consignment_clawbacks_submission_id_fkey"
  FOREIGN KEY ("consignment_submission_id") REFERENCES "consignment_submissions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consignment_clawbacks"
  ADD CONSTRAINT "consignment_clawbacks_consignor_id_fkey"
  FOREIGN KEY ("consignor_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "ConsignmentEscrowEvent" ADD VALUE IF NOT EXISTS 'clawback_pending';
