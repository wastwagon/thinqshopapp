-- Offline payment proof fields for money transfers
ALTER TABLE "money_transfers" ADD COLUMN IF NOT EXISTS "payment_transaction_id" VARCHAR(100);
ALTER TABLE "money_transfers" ADD COLUMN IF NOT EXISTS "payment_sender_name" VARCHAR(255);

-- Widen proof URL column for media paths
ALTER TABLE "money_transfers" ALTER COLUMN "proof_of_transfer" TYPE VARCHAR(500);
