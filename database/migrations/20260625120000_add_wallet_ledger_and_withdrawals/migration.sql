-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "WalletTransactionSource" AS ENUM ('wallet_topup', 'consignment_payout', 'shop_payment', 'transfer_payment', 'procurement_payment', 'logistics_payment', 'withdrawal', 'admin_adjust', 'other');

-- CreateEnum
CREATE TYPE "WalletLedgerStatus" AS ENUM ('success', 'pending', 'failed');

-- CreateEnum
CREATE TYPE "WalletWithdrawalMethod" AS ENUM ('mobile_money', 'bank_transfer');

-- CreateEnum
CREATE TYPE "WalletWithdrawalStatus" AS ENUM ('pending', 'paid', 'rejected', 'cancelled');

-- AlterEnum
ALTER TYPE "ServiceTypeFinance" ADD VALUE 'consignment_payout';

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount_ghs" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "source" "WalletTransactionSource" NOT NULL,
    "reference_id" INTEGER,
    "description" VARCHAR(500),
    "status" "WalletLedgerStatus" NOT NULL DEFAULT 'success',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_withdrawals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount_ghs" DECIMAL(10,2) NOT NULL,
    "fee_ghs" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "net_amount_ghs" DECIMAL(10,2) NOT NULL,
    "method" "WalletWithdrawalMethod" NOT NULL,
    "recipient_details" JSONB NOT NULL,
    "status" "WalletWithdrawalStatus" NOT NULL DEFAULT 'pending',
    "admin_id" INTEGER,
    "admin_note" TEXT,
    "rejection_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_created_at_idx" ON "wallet_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_withdrawals_user_id_status_idx" ON "wallet_withdrawals"("user_id", "status");

-- CreateIndex
CREATE INDEX "wallet_withdrawals_status_created_at_idx" ON "wallet_withdrawals"("status", "created_at");

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "wallet_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
