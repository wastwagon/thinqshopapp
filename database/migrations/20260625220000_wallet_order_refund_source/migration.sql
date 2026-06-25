-- Refunds are credited to ThinQ Wallet, not reversed via Paystack
ALTER TYPE "WalletTransactionSource" ADD VALUE IF NOT EXISTS 'order_refund';
