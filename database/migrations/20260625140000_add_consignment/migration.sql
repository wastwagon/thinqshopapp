-- CreateEnum
CREATE TYPE "ConsignmentCondition" AS ENUM ('new', 'like_new', 'good', 'fair');

-- CreateEnum
CREATE TYPE "ConsignmentStatus" AS ENUM ('submitted', 'under_review', 'changes_requested', 'listed', 'rejected', 'sold', 'paid_out');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "is_consignment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "consignor_user_id" INTEGER;
ALTER TABLE "products" ADD COLUMN "commission_pct" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "consignment_submissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "submission_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "asking_price" DECIMAL(10,2) NOT NULL,
    "approved_price" DECIMAL(10,2),
    "compare_price" DECIMAL(10,2),
    "commission_pct" DECIMAL(5,2),
    "condition" "ConsignmentCondition" NOT NULL DEFAULT 'good',
    "images" JSONB,
    "specifications" JSONB,
    "pickup_details" TEXT,
    "status" "ConsignmentStatus" NOT NULL DEFAULT 'submitted',
    "product_id" INTEGER,
    "admin_notes" TEXT,
    "rejection_reason" TEXT,
    "reviewed_by_admin_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "payout_order_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consignment_submissions_submission_number_key" ON "consignment_submissions"("submission_number");

-- CreateIndex
CREATE UNIQUE INDEX "consignment_submissions_product_id_key" ON "consignment_submissions"("product_id");

-- CreateIndex
CREATE INDEX "consignment_submissions_user_id_status_idx" ON "consignment_submissions"("user_id", "status");

-- CreateIndex
CREATE INDEX "consignment_submissions_status_created_at_idx" ON "consignment_submissions"("status", "created_at");

-- AddForeignKey
ALTER TABLE "consignment_submissions" ADD CONSTRAINT "consignment_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_submissions" ADD CONSTRAINT "consignment_submissions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_submissions" ADD CONSTRAINT "consignment_submissions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
