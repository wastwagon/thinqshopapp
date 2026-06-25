-- Phase F: buyer refund email + returns policy (wallet credits, not Paystack reversal)
INSERT INTO "email_templates" ("trigger_key", "name", "subject", "body", "is_enabled", "updated_at") VALUES
(
  'order_refund_wallet',
  'Order refund — wallet credit',
  'Refund credited to your ThinQ Wallet — order {{order_number}}',
  'Hi {{user_name}},\n\nYour return for order {{order_number}} has been approved.\n\nWe have credited ₵{{refund_amount}} to your ThinQ Wallet. This is not a reversal to your card or mobile money — you can use the balance on shop purchases and services, or request a withdrawal from your wallet dashboard.\n\nView your wallet: {{wallet_url}}\n\nThank you for shopping with ThinQShop.',
  true,
  NOW()
)
ON CONFLICT ("trigger_key") DO NOTHING;

UPDATE "site_policies"
SET
  "short_text" = '14-day returns. Approved refunds are credited to your ThinQ Wallet.',
  "full_text" = 'You may return most unused items within 14 days of delivery. Items must be in original packaging and condition. Request a return from your order history after delivery.\n\nWhen we approve a refund, the amount is credited to your ThinQ Wallet — not reversed to your card or mobile money. You can spend the balance on shop purchases and services, or request a withdrawal subject to wallet rules.\n\nContact support if you need help starting a return.',
  "updated_at" = NOW()
WHERE "type" = 'returns';
