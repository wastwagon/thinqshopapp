-- CreateTable
CREATE TABLE "invoice_rates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "rate_per_unit" DECIMAL(12,2) NOT NULL,
    "mode" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_rates_unit_idx" ON "invoice_rates"("unit");

-- CreateIndex
CREATE INDEX "invoice_rates_is_active_idx" ON "invoice_rates"("is_active");
