# World-Class Enhancements — Safe Implementation Phases

This document tracks what has been implemented and what remains, in safe phases.

---

## Phase 1 — Security & correctness ✅ DONE

Implemented in this phase:

| Item | Status | Notes |
|------|--------|------|
| **Global ValidationPipe** | ✅ | `main.ts`: `whitelist`, `forbidNonWhitelisted`, `transform`. All request bodies validated. |
| **Auth DTOs** | ✅ | `LoginDto`, `RegisterDto`, `ForgotPasswordDto` in `backend/src/auth/dto/`. Auth controller and service use them. |
| **JWT_SECRET required** | ✅ | Backend throws at startup if `JWT_SECRET` is not set. No fallback. |
| **Rate limiting** | ✅ | `@nestjs/throttler`: global 10 req/15s + 100 req/60s. `ThrottlerGuard` applied globally; `@SkipThrottle()` on `AppController` (/, /health). |
| **CORS** | ✅ | If `FRONTEND_URL` or `CORS_ORIGIN` is set (comma-separated), CORS restricted to those origins with credentials. Otherwise allow-all for local dev. |
| **Helmet** | ✅ | `helmet()` in backend (CSP disabled for now to avoid breaking inline scripts). |
| **Health endpoint** | ✅ | `GET /health` returns `{ status: 'ok', timestamp }`. Used for health checks. |
| **Next.js security headers** | ✅ | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` in `next.config.mjs`. |
| **Env docs** | ✅ | `.env.example` documents `JWT_SECRET` (required) and `FRONTEND_URL`. |

**How to run after Phase 1**

- Backend: set `JWT_SECRET` (and optionally `FRONTEND_URL` for CORS). Then start as usual.
- Set `FRONTEND_URL` to your web URL so CORS allows the frontend.

---

## Phase 2 — Observability & email ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Request logging** | ✅ | Middleware in `main.ts` logs method, url, statusCode, duration. |
| **Sentry** | ✅ | Optional: set `SENTRY_DSN` in env; backend inits Sentry when set. |
| **Email processor** | ✅ | `backend/scripts/process-email-queue.ts`; run `npm run email:process`. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM. |

---

## Phase 3 — Performance & resilience ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Prisma indexes** | ✅ | Migration `20260225140000_add_perf_indexes`: products(category_id, is_active), orders(user_id, created_at), orders(status). |
| **Cache-Control** | ✅ | `GET /products` and `GET /categories` send `Cache-Control: public, max-age=60`. |

---

## Phase 4 — Quality & DX ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Swagger** | ✅ | `GET /api/docs` (Swagger UI). `DocumentBuilder` + `SwaggerModule` in `main.ts`. |
| **Backend tests** | ✅ | `auth.service.spec.ts`: validateUser (null when not found / wrong password), login returns token. |
| **CI** | ✅ | `.github/workflows/ci.yml`: install, prisma generate, build backend, test backend, build web. |
| **test:local** | ✅ | Root script: build backend, test backend, build web. |

---

## Rollback / safety

- **Phase 1**: To revert CORS to allow-all, remove the `frontendUrl` block in `main.ts` and leave only `app.enableCors()`. To revert rate limiting, remove `ThrottlerModule` and `APP_GUARD` from `AppModule` and `@SkipThrottle()` from `AppController`. ValidationPipe and DTOs can stay; they only make invalid payloads fail with 400.
- **Env**: Keep `JWT_SECRET` set everywhere. Add `FRONTEND_URL` to your web URL so CORS works in production.

---

## Next steps

1. Deploy Phase 1: commit, push, redeploy backend. Set `FRONTEND_URL` to your web app URL in the backend service.
2. When ready, proceed to Phase 2 (logging, Sentry, email sender) in a separate branch or incrementally.

---

## Phase 5 — Live-safe hardening (current) ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Paystack webhook signature check** | ✅ | `payment.controller.ts` now validates `x-paystack-signature` using HMAC SHA-512 and rejects invalid payloads. |
| **Webhook payment correlation fix** | ✅ | `verifyWebhook()` now resolves by `transaction_ref` and stores `paystack_reference` idempotently. |
| **Raw request body capture** | ✅ | `main.ts` stores `req.rawBody` for secure webhook digest verification. |
| **Transfer payment/status consistency** | ✅ | New Paystack transfer starts as `processing`; payment confirmation sets `payment_status=success` and `status=payment_received`. |
| **Admin dashboard pending transfers metric** | ✅ | Uses `payment_status === 'pending'` to avoid enum mismatch. |
| **Order total tamper protection** | ✅ | `order.service.ts` validates client total against server-calculated total before creating order. |
| **User order cancellation (safe rule)** | ✅ | Added `PATCH /orders/:id/cancel` for unpaid pending orders only. |
| **JWT fallback secret removed in guard** | ✅ | `auth.guard.ts` uses `process.env.JWT_SECRET` only. |
| **Runtime DB admin endpoint safety gate** | ✅ | Requires `ENABLE_RUNTIME_DB_ADMIN=true`; default disabled in compose files. |
| **Proxy response header forwarding** | ✅ | API proxy now forwards upstream headers (including `Set-Cookie`) instead of only `Content-Type`. |
| **Broken wishlist route** | ✅ | Dashboard account link now points to `/wishlist`. |
| **Sidebar active state unification** | ✅ | Sidebar highlights nested routes via prefix-safe matcher. |

---

## Phase 6 — RBAC + audit + DTO hardening ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Permission-based authorization guard** | ✅ | Added `RequirePermission` decorator + `PermissionGuard` with role→permission map in `auth/permissions.ts`. |
| **Global permission guard registration** | ✅ | `PermissionGuard` registered as `APP_GUARD` in `app.module.ts`. |
| **Admin audit log service** | ✅ | Added `AuditService` + `AuditModule` writing to `admin_logs` without blocking requests on failures. |
| **Transfer admin endpoints hardened** | ✅ | `transfer.controller.ts` now uses permission checks for admin list/rate/status/fulfillment and logs audit actions. |
| **Logistics admin endpoints hardened** | ✅ | `logistics.controller.ts` now uses permission checks and audit logging for freight/shipment mutations. |
| **Procurement admin endpoints hardened** | ✅ | `procurement.controller.ts` now uses permission checks and audit logging for status/quote actions. |
| **DTO enforcement for money/logistics/procurement** | ✅ | Added strict DTOs in `finance/dto/transfer.dto.ts`, `logistics/dto/logistics.dto.ts`, `procurement/dto/procurement.dto.ts`. |
| **User profile update DTO** | ✅ | Added `user/dto/update-profile.dto.ts` and wired controller/service to validated payloads. |

---

## Phase 7 — Frontend route/SEO unification ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Auth pages noindex** | ✅ | Added `web/app/(main)/(auth)/layout.tsx` with robots noindex/nofollow metadata. |
| **Sitemap route coverage** | ✅ | `sitemap.ts` now includes `/track` and dynamic category routes (`/shop/:category`). |
| **Robots disallow auth URLs** | ✅ | `robots.ts` now disallows `/login`, `/register`, `/forgot-password` in addition to private routes. |
| **Dead social placeholders removed** | ✅ | Navbar/Footer now render social icons only when real `NEXT_PUBLIC_*` URLs are configured. |
| **Social URL env docs** | ✅ | Added optional social URL env vars to `.env.example`. |

---

## Phase 8 — Support + returns workflow wiring ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Support ticket backend endpoint** | ✅ | Added `POST /support/tickets` in new `SupportModule` with validated DTO payload. |
| **Support ticket delivery path** | ✅ | Ticket submissions now queue an email to support inbox and notify both customer + admin users in-app. |
| **Dashboard support page wiring** | ✅ | `dashboard/support` now calls backend API instead of local-only toast flow. |
| **Customer return request flow** | ✅ | Added `POST /orders/:id/return-request` (delivered orders only, one-time request guard). |
| **Return request escalation** | ✅ | Return requests create order tracking event + support email + admin/user notifications. |
| **Order timeline visibility** | ✅ | User/admin order detail pages now include tracking events; admin can see return-request notes in timeline. |
| **Order admin permissions + audit** | ✅ | `orders/admin/*` now uses permission guard and audit logging for status updates. |

---

## Phase 9 — Authoritative checkout shipping quote ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Server-side checkout quote endpoint** | ✅ | Added `GET /orders/quote/checkout?shipping_address_id=` for authoritative pricing. |
| **Order pricing source unified** | ✅ | `order.service.ts` now computes subtotal/shipping/tax/discount/total in one place used by both quote + create. |
| **Total tamper protection extended** | ✅ | `create()` validates client total against authoritative total including shipping. |
| **Order financial fields persisted** | ✅ | `shipping_fee`, `tax`, `discount` are now set explicitly during order creation. |
| **Checkout UI quote wiring** | ✅ | `CheckoutClient` now fetches quote after address select and uses quoted total for wallet checks/payment request. |
| **Storefront shipping setting support** | ✅ | Added `standard_shipping_fee_ghs` to settings DTO/service, admin storefront UI, and seed data. |
| **Order detail UI clarity** | ✅ | User/admin order detail pages now display shipping fee line item. |

---

## Phase 10 — Admin return resolution workflow ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Admin return action endpoint** | ✅ | Added `PATCH /orders/admin/:id/return` with actions: `approve`, `reject`, `refund`. |
| **Validation and idempotency guards** | ✅ | Resolution requires existing `return_requested` event and blocks duplicate resolutions. |
| **Refund status wiring** | ✅ | `refund` action marks order `payment_status=refunded` and appends tracking event. |
| **User notification on outcome** | ✅ | Customer receives in-app notification when return is approved/rejected/refunded. |
| **Audit logging** | ✅ | Return resolution action logged via `AuditService` for admin traceability. |
| **Admin UI controls** | ✅ | Admin order detail shows pending return banner with Approve/Reject/Refund actions. |

---

## Phase 11 — Full admin permission/audit migration ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Manual role checks removed** | ✅ | Replaced remaining inline `admin/superadmin` checks with permission decorators across backend controllers. |
| **Product/category/review admin controls** | ✅ | `product.controller.ts` now uses permissions + audit logs for create/update/delete/review moderation actions. |
| **Invoice and invoice-rate admin controls** | ✅ | `invoice.controller.ts` and `invoice-rate.controller.ts` now use permissions + audit logs for mutating actions. |
| **Variation admin controls** | ✅ | `variation.controller.ts` now uses permission checks + audit logs for option/value CRUD. |
| **Wallet admin controls** | ✅ | `wallet.controller.ts` admin list/adjust now permission-guarded; adjustments are audited. |
| **Media and email-template admin controls** | ✅ | `media.controller.ts` and `email-template.controller.ts` now use permission checks + audit logs. |
| **Permission map expanded** | ✅ | Added domain-scoped permissions (`products`, `invoices`, `variations`, `wallets`, `media`, `email_templates`, etc.). |
| **Module wiring for audit injection** | ✅ | Added `AuditModule` imports in affected feature modules for controller-level audit service usage. |

---

## Phase 12 — Admin audit viewer (read-only) ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Audit log read permission** | ✅ | Added `PERMISSION_MAP.AUDIT_READ` and granted to `admin` role. |
| **Admin audit logs endpoint** | ✅ | Added `GET /admin/audit-logs` in `audit.controller.ts`, guarded by auth + permission checks. |
| **Server-side pagination/filtering** | ✅ | Endpoint supports `page`, `limit`, and `action` filtering; returns structured `meta` payload. |
| **Actor enrichment** | ✅ | Audit rows include resolved actor `name/email` by joining `admin_id` with users. |
| **Admin UI page** | ✅ | Added `web/app/(main)/admin/audit-logs/page.tsx` with table view, filter, refresh, and paging controls. |
| **Navigation wiring** | ✅ | Added `Audit logs` link in admin sidebar and linked from admin settings card. |

---

## Phase 13 — Audit operations filters + CSV export ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Extended backend filtering** | ✅ | `GET /admin/audit-logs` now supports `table_name`, `from`, and `to` filters in addition to action/admin/paging. |
| **CSV export endpoint** | ✅ | Added `GET /admin/audit-logs/export.csv` with auth + permission guard and download headers. |
| **Export safety caps** | ✅ | CSV export is capped (max 5,000 rows) to prevent excessive load. |
| **UI filter controls** | ✅ | Audit page now includes action + table filters and date-time range fields with Apply/Clear flow. |
| **No auto-fetch while typing** | ✅ | Filter inputs are now draft state; fetch only runs after applying filters (or paging/refresh). |
| **UI CSV download** | ✅ | Added Export CSV button to download filtered audit logs directly from admin UI. |

---

## Phase 14 — CMS-friendly admin wording polish ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Transfer status language cleanup** | ✅ | `admin/transfers` now displays title-cased status labels and uses user-friendly confirmation prompts/messages. |
| **Transfer list UX copy polish** | ✅ | Improved search/help text and customer/recipient display wording to be clearer for operations users. |
| **Logistics detail label normalization** | ✅ | `admin/logistics/[id]` now formats service/status/payment labels in human-readable CMS style. |
| **Logistics summary enrichment** | ✅ | Added readable payment method and payment status fields in shipment summary card. |
| **Procurement detail label normalization** | ✅ | `admin/procurement/[id]` now uses friendly labels for request type/status and status selector options. |
| **Operator terminology standardization** | ✅ | Replaced terse technical labels (`Qty`, raw enums) with clearer terms (`Quantity`, `Budget range`, readable enums). |

---

## Phase 15 — CMS-friendly wording polish (orders/products) ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Order detail status readability** | ✅ | `admin/orders/[id]` now renders payment/order/tracking labels with title-cased human-readable wording. |
| **Order financial clarity** | ✅ | Added visible payment status chip and improved quantity copy in line items. |
| **Product admin copy clarity** | ✅ | `admin/products` header and search guidance now use operator-friendly catalog wording. |
| **Specification input UX** | ✅ | Product specifications helper text now favors line-based CMS entry (`Label: Value`) instead of technical JSON wording. |
| **Description guidance simplification** | ✅ | Product description placeholder now uses content-editor language instead of developer-centric terminology. |

---

## Phase 16 — CMS-friendly wording polish (invoices/reviews) ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Invoice list label normalization** | ✅ | `admin/invoices` now uses readable status labels and clearer search/help copy for operations users. |
| **Invoice detail status readability** | ✅ | `admin/invoices/[id]` status badge/dropdown now present title-cased, human-friendly labels. |
| **Invoice editing wording cleanup** | ✅ | Replaced technical line-item wording (`line`, terse rate labels) with clearer CMS language (`item`, `Apply saved rate`). |
| **Invoice table clarity** | ✅ | Updated invoice item table header from `Qty` to `Quantity` for consistency with other admin pages. |
| **Review moderation copy polish** | ✅ | `admin/reviews` header and action affordances now use moderation-focused wording (`Decline`) and less technical text. |

---

## Phase 17 — CMS-friendly wording polish (users/content) ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **User list language cleanup** | ✅ | `admin/users` now uses clearer operator copy for page subtitle, search guidance, and quick filtering. |
| **User role label normalization** | ✅ | User role chips now render in human-friendly title case instead of raw enum-style values. |
| **User detail role readability** | ✅ | `admin/users/[id]` role badge now uses readable title-cased labels. |
| **Content page framing polish** | ✅ | `admin/content` subtitle now uses CMS/editor language instead of technical shorthand. |
| **Policy editor helper wording** | ✅ | Policy text placeholders now use customer-facing wording (`summary`, `full policy text`) for non-technical editors. |
| **Homepage section label normalization** | ✅ | Section keys in content toggles are now rendered in readable title case. |

---

## Phase 18 — CMS-friendly wording polish (settings/storefront/wallet) ✅ DONE

| Item | Status | Notes |
|------|--------|-------|
| **Settings page framing cleanup** | ✅ | `admin/settings` subtitle now uses operations-focused wording and clearer helper text for exchange/procurement values. |
| **Storefront page framing cleanup** | ✅ | `admin/storefront` subtitle now clearly describes business-facing content and contact settings. |
| **Wallet page framing cleanup** | ✅ | `admin/wallet` subtitle now uses customer wallet operations language instead of terse technical copy. |
| **Wallet search guidance update** | ✅ | Wallet search placeholder now explains supported search fields (name/email/phone). |
| **Wallet adjustment helper text** | ✅ | Credit/debit modal now explains the balance impact before submitting the action. |
