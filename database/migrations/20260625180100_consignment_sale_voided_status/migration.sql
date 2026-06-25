-- Order refunded before consignor payout — void escrow without crediting wallet
ALTER TYPE "ConsignmentStatus" ADD VALUE IF NOT EXISTS 'sale_voided';
