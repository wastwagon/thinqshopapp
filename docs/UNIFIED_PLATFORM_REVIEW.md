# ThinQShop – Unified Platform Review

This document describes how the **admin backend**, **database**, and **user dashboard** link into one platform and what best-practice fixes have been applied.

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Web (Next.js) – Port 7001 / 7081                                │
│  • User: /dashboard, /shop, /checkout, /track                    │
│  • Admin: /admin (products, orders, logistics, transfers, etc.)   │
│  • Auth: /login, /register, /forgot-password                     │
│  • API proxy: /api/* → Backend (see below)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ /api/* (axios baseURL /api)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API route: app/api/[...path]/route.ts                   │
│  • Forwards to BACKEND_URL (NEXT_PUBLIC_API_URL or BACKEND_URL)  │
│  • Used so frontend always calls same origin; no CORS/port issues │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (NestJS) – Port 7000                                     │
│  • auth, users, products, orders, cart, addresses                │
│  • finance (wallet, transfers, payments)                          │
│  • logistics (shipments, zones, warehouses, freight-rates)       │
│  • procurement, notifications                                    │
│  • All protected routes use AuthGuard; admin routes check role    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                            │
│  • Prisma schema: database/schema.prisma                          │
│  • Migrations: database/migrations/                              │
│  • Docker: db (5440)                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend ↔ database linking

- **Single schema:** `database/schema.prisma` is the source of truth; backend uses `PrismaService` (generated client).
- **Run migrations:** `cd database && npx prisma migrate deploy` (or `migrate dev`).
- **Generate client:** `npx prisma generate --schema=database/schema.prisma` (often run from backend or root).
- **Env:** Backend uses `DATABASE_URL` from `.env`; ensure it matches Postgres (e.g. `localhost:5440` if using Docker).

**Main models and usage**

| Area | Main models | Backend usage |
|------|-------------|----------------|
| Auth / users | User, UserProfile, UserWallet | auth.service, user.service, all modules |
| Shop | Product, Category, CartItem, Order, OrderItem | product, cart, order |
| Finance | MoneyTransfer, Payment, UserWallet | finance (transfers, wallet, payment) |
| Logistics | Shipment, ShipmentTracking, Warehouse, ShippingZone, ShippingMethodRate | logistics.service |
| Procurement | ProcurementRequest, ProcurementQuote, ProcurementOrder | procurement.service |
| Notifications | Notification | notification.service |

---

## 3. User dashboard ↔ backend

- **Base URL:** In the browser, axios uses `baseURL: '/api'`, so all requests go to the same origin and are proxied to the backend.
- **Auth:** Token in `localStorage`; axios request interceptor adds `Authorization: Bearer <token>`.
- **Session cookie:** `thinq_session` is set on login and cleared on logout/401 so middleware can protect `/dashboard` and `/admin` (see below).

**User dashboard pages and main API usage**

| Page | Backend endpoints (prefix with /api) |
|------|-------------------------------------|
| /dashboard | GET /users/profile, GET /logistics/history, GET /finance/transfers, etc. |
| /dashboard/wallet | GET /finance/wallet, GET /finance/wallet/transactions, POST /finance/wallet/topup |
| /dashboard/transfers | GET /finance/transfers, POST /finance/transfers, GET /finance/transfers/:id, etc. |
| /dashboard/logistics | GET /logistics/warehouses, GET /logistics/freight-rates, POST /logistics/book, GET /logistics/history |
| /dashboard/procurement | GET /procurement/user, POST /procurement/request, GET /procurement/user/request/:id, etc. |
| /dashboard/orders | GET /orders, GET /orders/:id |
| /dashboard/profile | GET /users/profile, PATCH /users/profile |
| /dashboard/settings | (settings UI; PATCH as needed) |
| /dashboard/delete-account | DELETE /auth/account |

---

## 4. Admin dashboard ↔ backend

- **Same API base:** Admin pages use the same axios instance (`/api`), so same proxy and auth.
- **Role check:** Backend admin routes require `req.user.role === 'admin' || 'superadmin'`; frontend uses `<DashboardLayout isAdmin={true}>` and redirects non-admins to `/dashboard`.

**Admin pages and main API usage**

| Page | Backend endpoints (prefix with /api) |
|------|-------------------------------------|
| /admin | GET /logistics/admin/shipments, GET /finance/transfers/admin/all, GET /procurement/admin/requests (overview) |
| /admin/products | GET /products/admin/list, POST/PATCH/DELETE /products, GET /products/categories/admin |
| /admin/categories | GET/POST/PATCH/DELETE /products/categories, GET /products/categories/admin |
| /admin/orders | GET /orders/admin/list, PATCH /orders/admin/:id/status |
| /admin/logistics | GET /logistics/admin/shipments, PATCH /logistics/admin/shipments/:id/status, POST /logistics/admin/simulate-webhook/:id |
| /admin/shipping-rates | GET/POST/PATCH/DELETE /logistics/admin/freight-rates |
| /admin/transfers | GET /finance/transfers/admin/all, PATCH /finance/transfers/admin/:id/status, PATCH /finance/transfers/admin/rate, etc. |
| /admin/procurement | GET /procurement/admin/requests, PATCH /procurement/admin/:id/status, POST /procurement/admin/:id/quote |
| /admin/users | GET /users/admin/list |
| /admin/wallet | (admin wallet; adjust as implemented) |
| /admin/settings | PATCH /finance/transfers/admin/rate (exchange rate), other settings as needed |

---

## 5. Auth and protection (best practices applied)

**Backend**

- **AuthGuard** on all sensitive routes; JWT from `Authorization: Bearer <token>`.
- **Role checks** on admin routes: `req.user.role === 'admin' || 'superadmin'`.
- **Payments:** `POST /payments/init` is now protected with AuthGuard; `userId` is taken from `req.user.sub` (no client-supplied userId).

**Frontend**

- **Middleware** (`web/middleware.ts`): Protects `/dashboard/*` and `/admin/*` by requiring the `thinq_session` cookie; if missing, redirects to `/login?from=...`.
- **Session cookie:** Set on login and on successful profile load; cleared on logout and on 401 response (see below).
- **401 handling:** Axios response interceptor clears token and session cookie and redirects to `/login?session=expired` (except for auth requests like `/auth/login`).
- **DashboardLayout:** Still enforces role for admin: non-admin users who hit `/admin` are redirected to `/dashboard`.

---

## 6. Env and config

- **.env.example** documents:
  - `NEXT_PUBLIC_API_URL` – backend base URL (e.g. `http://localhost:7000`). Used by Next.js API proxy and SSR. Must point to the NestJS backend, not the Next.js app.
  - Optional `BACKEND_URL` – server-side override for the API proxy (e.g. in Docker: `http://host.docker.internal:7000`).
- **Backend:** `PORT` (default 7000), `DATABASE_URL`, `JWT_SECRET`, `PAYSTACK_SECRET_KEY`, etc., in backend `.env` or root `.env`.

---

## 7. Fixes applied in this review

| Issue | Fix |
|-------|-----|
| Logistics admin simulate-webhook | Removed incorrect `trackShipment(id)` call (id is numeric; trackShipment expects tracking number). Simulate now uses only `simulateWebhookAdvance(Number(id))`. |
| Payments init security | `POST /payments/init` now uses AuthGuard and `req.user.sub` for userId; client cannot pass arbitrary userId. |
| 401 handling | Axios response interceptor clears token and session cookie and redirects to login on 401 (except auth routes). |
| .env.example | `NEXT_PUBLIC_API_URL` set to `http://localhost:7000`; added comment and optional `BACKEND_URL`. |
| Admin/dashboard protection | Next.js middleware added; requires `thinq_session` cookie for `/dashboard/*` and `/admin/*`; AuthContext sets/clears cookie on login, logout, and 401. |

---

## 8. Checklist for a unified platform

- [x] Single Prisma schema and one backend using it
- [x] Frontend calls backend via `/api` proxy (same origin)
- [x] Auth: JWT in header; session cookie for middleware
- [x] Admin routes guarded by role on backend and by layout + middleware on frontend
- [x] Sensible env docs (NEXT_PUBLIC_API_URL, BACKEND_URL)
- [x] 401 → logout and redirect to login
- [x] Payments init secured with AuthGuard and server-derived userId
- [x] Logistics simulate-webhook fixed (no wrong trackShipment call)

---

## 9. Optional next steps

- **Paystack webhook:** Ensure `POST /payments/webhook` validates Paystack signature.
- **Admin middleware:** Middleware cannot distinguish admin vs user; role redirect remains in DashboardLayout. For stricter admin-only protection, consider a short-lived admin cookie or server-side role check in a layout/server component.
- **Loading/error UX:** Standardize loading and error states across dashboard and admin pages.
- **Logistics freight rates:** Keep DB seeded (e.g. `database/seed-shipping-rates.sql`) so the “Select Rate” dropdown always has options.

This keeps the system consistent, secure, and easy to run (single backend URL, clear env, protected routes, and no cutting corners on auth or payments).
