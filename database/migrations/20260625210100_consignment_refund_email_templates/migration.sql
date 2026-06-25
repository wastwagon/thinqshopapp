INSERT INTO "email_templates" ("trigger_key", "name", "subject", "body", "is_enabled", "updated_at") VALUES
('consignment_sale_voided', 'Sell for Me — sale cancelled', 'Sale cancelled — {{item_name}}', 'Hi {{user_name}},\n\nThe sale of your listing "{{item_name}}" ({{submission_number}}) for order {{order_number}} was cancelled due to a refund.\n\nNo payout was released for this sale. If you have questions, contact support.', true, NOW()),
('consignment_clawback', 'Sell for Me — payout adjustment', 'Payout adjustment for refunded order {{order_number}}', 'Hi {{user_name}},\n\nOrder {{order_number}} for "{{item_name}}" was refunded after your Sell for Me payout was credited.\n\n{{clawback_message}}\n\nView your wallet for details.', true, NOW())
ON CONFLICT ("trigger_key") DO NOTHING;
