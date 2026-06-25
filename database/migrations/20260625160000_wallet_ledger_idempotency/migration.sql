-- Prevent duplicate ledger entries for the same business reference (e.g. consignment payout)
CREATE UNIQUE INDEX "wallet_transactions_source_reference_unique"
ON "wallet_transactions" ("source", "reference_id")
WHERE "reference_id" IS NOT NULL;
