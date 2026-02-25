# Paystack, Wallet & Checkout — Implementation Plan

Safe phased implementation: live Paystack keys (via env), wallet top-up, transfer payments, ecommerce checkout (wallet-first + Paystack), order thank-you page, and email templates in admin.

---

## Implementation status (done)

- **Phase 1–6** implemented: env docs, wallet top-up via Paystack, ecommerce wallet-first + Paystack + order confirm, thank-you page with order details, transfers (use env keys), email templates table + admin UI + order_placed trigger.
- **You must:** Set `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env` / `backend/.env` and `web/.env` (use your live keys; never commit them). Run `npx prisma migrate dev --schema database/schema.prisma` to apply the `email_templates` migration.

---

## Security: API keys

- **Never commit live keys.** Use environment variables only.
- **Backend:** `PAYSTACK_SECRET_KEY` (e.g. `sk_live_...`) in `backend/.env`.
- **Frontend:** `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (e.g. `pk_live_...`) in `.env` or `web/.env`.
- Set these in your deployment environment; see `.env.example` for placeholders.

---

## Phase 1: Env and key documentation

- [x] Document `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env.example`.
- [x] Ensure backend uses `PAYSTACK_SECRET_KEY` for verification; frontend uses `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` for popup.
- No keys in code; all from env.

---

## Phase 2: Wallet top-up via Paystack

- **Backend:** `POST /finance/wallet/topup` — create Payment record, call Paystack Initialize Transaction API, return `authorization_url` and `reference` (or same ref for popup flow). Webhook or verify endpoint to credit wallet on success.
- **Frontend (dashboard wallet):** On "Top up", call backend; open Paystack (popup with reference + amount in pesewas). On success, call backend verify/confirm to credit wallet and refresh balance.
- **Backend verify:** `POST /finance/wallet/confirm-topup` with `reference` — verify with Paystack API, then credit `UserWallet` and update Payment + Payment status.

---

## Phase 3: Ecommerce checkout — wallet-first + Paystack

- **Wallet-first:** Always show "ThinQ Wallet" and user balance. If balance >= cart total, user can choose "Pay with Wallet" and complete without Paystack (existing backend flow).
- **Card / Mobile Money:** If user chooses card or mobile money, or wallet has insufficient funds:
  - Backend: Create order with status `pending`, payment_status `pending`, create Payment record with unique `transaction_ref`, **do not clear cart yet**. Return `order_id`, `order_number`, `paystack_reference` (same as transaction_ref for popup).
  - Frontend: Open Paystack popup with that reference, amount in pesewas (GHS × 100), user email.
  - On Paystack success: `POST /orders/confirm-payment` with `order_id` and `paystack_reference`. Backend verifies with Paystack, updates order (`payment_status`, `paystack_reference`), then clears cart. Redirect to thank-you page with order id.
- **Thank-you page:** After successful Paystack payment, redirect to `/checkout/success?order=...` and show order details (Phase 4).

---

## Phase 4: Order thank-you page

- Route: `/checkout/success`. Accept `order` (order_id or order_number) in query or state.
- Fetch order details (authenticated) and show: thank you message, order number, total, status. Links: "View order", "Continue shopping".
- If no order in query/state (e.g. wallet/COD), show generic success and link to dashboard/orders.

---

## Phase 5: Transfer money — Paystack

- Already implemented: card payment creates transfer with `paystack_reference`, frontend opens PaystackTrigger, on success calls `POST /finance/transfers/:id/confirm-payment`. Ensure live keys are set in env; no code change except env.

---

## Phase 6: Email templates and triggers (admin)

- **Data:** Add `email_templates` table or store templates in `settings`: trigger key, name, subject, body (with placeholders e.g. `{{order_number}}`, `{{user_name}}`), `is_enabled`.
- **Triggers:** Order placed (ecommerce), Wallet top-up success, Transfer initiated, Transfer status update, etc. Each trigger queues an email (insert into `email_queue`) using the template and replacing placeholders.
- **Admin UI:** New page (or section) "Email templates" in admin: list all templates, edit subject/body, toggle "Enabled". "Test send" optional.
- **Enable all triggers:** After adding templates, enable all by default (or toggles per trigger).

---

## Implementation order

1. Phase 1 — Env and keys (done in same PR as doc).
2. Phase 2 — Wallet top-up (backend init + verify, frontend popup + confirm).
3. Phase 3 — Ecommerce: order create branch for card, confirm-payment endpoint, checkout UI (wallet balance, Paystack flow, redirect).
4. Phase 4 — Thank-you page with order details.
5. Phase 5 — Transfers: verify with live keys (env only).
6. Phase 6 — Email templates table/seed, backend queue on triggers, admin UI, enable all.

---

## Files to touch (summary)

- **Env:** `.env.example`, `backend/.env.example` (if exists).
- **Backend:** `wallet.controller` + `wallet.service` (Paystack init, confirm top-up); `order.service` + `order.controller` (create pending for card, confirm-payment); `transfer.service` (already uses Paystack verify); optional Paystack webhook route.
- **Frontend:** `dashboard/wallet/page.tsx` (top-up with Paystack popup); `checkout/CheckoutClient.tsx` (wallet balance fetch, wallet-first UI, Paystack ref from backend, confirm then redirect); `checkout/success/page.tsx` (order id, fetch order, thank you content).
- **Email:** New migration `email_templates`, seed defaults, notification/email service to queue from triggers, admin page for templates.
