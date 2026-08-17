-- CreateIndex
CREATE INDEX "cart_user_id_idx" ON "cart"("user_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "order_tracking_order_id_idx" ON "order_tracking"("order_id");

-- CreateIndex
CREATE INDEX "money_transfers_user_id_created_at_idx" ON "money_transfers"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "shipments_user_id_created_at_idx" ON "shipments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_service_type_service_id_idx" ON "payments"("service_type", "service_id");
