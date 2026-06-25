-- Phase 4: immutable audit trail for Sell for Me escrow lifecycle
CREATE TYPE "ConsignmentEscrowEvent" AS ENUM (
  'locked',
  'hold_placed',
  'hold_released',
  'released',
  'voided',
  'auto_released'
);

CREATE TABLE "consignment_escrow_ledger" (
  "id" SERIAL NOT NULL,
  "consignment_submission_id" INTEGER NOT NULL,
  "order_id" INTEGER,
  "event_type" "ConsignmentEscrowEvent" NOT NULL,
  "amount_ghs" DECIMAL(10, 2),
  "note" TEXT,
  "actor_user_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consignment_escrow_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consignment_escrow_ledger_submission_created_idx"
  ON "consignment_escrow_ledger"("consignment_submission_id", "created_at");

CREATE INDEX "consignment_escrow_ledger_order_id_idx"
  ON "consignment_escrow_ledger"("order_id");

ALTER TABLE "consignment_escrow_ledger"
  ADD CONSTRAINT "consignment_escrow_ledger_submission_id_fkey"
  FOREIGN KEY ("consignment_submission_id") REFERENCES "consignment_submissions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
