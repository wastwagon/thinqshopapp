-- Guest checkout: orders and shipping addresses may exist without a user account.

ALTER TABLE "addresses" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_email" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_access_token_hash" VARCHAR(64);

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_user_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_guest_access_token_hash_key" ON "orders"("guest_access_token_hash");
CREATE INDEX IF NOT EXISTS "orders_guest_email_idx" ON "orders"("guest_email");
