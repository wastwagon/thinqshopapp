INSERT INTO "email_templates" ("trigger_key", "name", "subject", "body", "is_enabled", "updated_at")
VALUES (
    'password_reset',
    'Password reset',
    'Reset your ThinQShop password',
    'Hi {{user_name}},

We received a request to reset your password. Open this link within 1 hour:

{{reset_url}}

If you did not request this, you can ignore this email.

ThinQShop',
    true,
    NOW()
)
ON CONFLICT ("trigger_key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "subject" = EXCLUDED."subject",
    "body" = EXCLUDED."body",
    "is_enabled" = EXCLUDED."is_enabled",
    "updated_at" = NOW();
