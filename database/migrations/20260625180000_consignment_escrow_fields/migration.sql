-- Escrow: track expected payout while order is in transit (status = sold, not yet paid_out)
ALTER TABLE "consignment_submissions" ADD COLUMN "sale_order_id" INTEGER;
ALTER TABLE "consignment_submissions" ADD COLUMN "expected_payout_ghs" DECIMAL(10, 2);
ALTER TABLE "consignment_submissions" ADD COLUMN "sold_at" TIMESTAMP(3);

CREATE INDEX "consignment_submissions_sale_order_id_idx" ON "consignment_submissions"("sale_order_id");
