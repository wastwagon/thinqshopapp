-- CreateTable
CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "trigger_key" VARCHAR(80) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_trigger_key_key" ON "email_templates"("trigger_key");

-- Seed default templates (placeholders: {{order_number}}, {{total}}, {{user_name}}, {{amount}}, {{transfer_token}}, etc.)
INSERT INTO "email_templates" ("trigger_key", "name", "subject", "body", "is_enabled", "updated_at") VALUES
('order_placed', 'Order confirmation', 'Order {{order_number}} confirmed', 'Hi {{user_name}},\n\nThank you for your order. Order number: {{order_number}}\nTotal: ₵{{total}}\n\nWe will notify you when it ships.', true, NOW()),
('wallet_topup_success', 'Wallet top-up successful', 'Your wallet was credited ₵{{amount}}', 'Hi {{user_name}},\n\nYour ThinQ Wallet was credited ₵{{amount}}. New balance: ₵{{balance}}.', true, NOW()),
('transfer_initiated', 'Transfer initiated', 'Transfer {{transfer_token}} received', 'Hi {{user_name}},\n\nWe have received your transfer {{transfer_token}} for ₵{{amount}}. We will process it and update you.', true, NOW());
