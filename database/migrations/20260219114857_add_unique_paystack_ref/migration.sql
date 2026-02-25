/*
  Warnings:

  - A unique constraint covering the columns `[paystack_reference]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payments_paystack_reference_key" ON "payments"("paystack_reference");
