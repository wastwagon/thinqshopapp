-- Shop display currency rates (GHS to USD, CNY). Fetched from FXR-API daily.
-- Separate from exchange_rates which is for transfers (manual admin).
CREATE TABLE "shop_currency_rates" (
    "id" SERIAL NOT NULL,
    "rate_ghs_to_usd" DECIMAL(12, 6) NOT NULL,
    "rate_ghs_to_cny" DECIMAL(12, 6) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_currency_rates_pkey" PRIMARY KEY ("id")
);
