-- Phase 2: admin can pause escrow payout (e.g. buyer dispute)
ALTER TABLE "consignment_submissions" ADD COLUMN "escrow_on_hold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "consignment_submissions" ADD COLUMN "escrow_hold_reason" TEXT;
