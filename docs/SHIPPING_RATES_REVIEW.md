# Shipping Rates (By Air & By Sea) – Review & Implementation

## Summary

**You have full shipping rates by Air and Sea implemented:** database model, migration with seed data, backend APIs (public + admin), admin UI linked in the sidebar, and user dashboard using rates in the Create New Shipment form.

---

## Important: Logistics only (not ecommerce)

These rates are **only for the logistics “Ship for Me” flow** (freight from China warehouse to Ghana). They **do not affect**:

- **Shop / ecommerce checkout** – Product orders use a separate mechanism (e.g. `ShippingZone` with base + per-kg for local delivery, or your own rules). The admin “Logistics Shipping Rates” page and `ShippingMethodRate` table are not used when calculating shipping for the store.
- **Cart or order total** – Order creation and cart shipping are independent of `shipping_method_rates`.

So: **Logistics freight rates** = Ship for Me only. **Ecommerce shipping** = your zones/checkout logic elsewhere (e.g. `ShippingZone` table with base_price and per_kg_price for local delivery).

---

## 1. Database

**Model:** `ShippingMethodRate` (table `shipping_method_rates`)

| Column      | Type     | Purpose |
|------------|----------|---------|
| id         | Int (PK) | Auto |
| rate_id    | String   | Unique, e.g. `air_express`, `sea_standard` |
| method     | String   | `air_freight` \| `sea_freight` |
| name       | String   | Display name, e.g. "Express (3-5 days)" |
| price      | Decimal  | e.g. 17.00 |
| type       | String   | `KG` \| `UNIT` \| `CBM` (per-unit for display/calculation) |
| duration   | String?  | e.g. "3-5 days", "45-60 days" |
| is_active  | Boolean  | Only active rates shown to users |
| sort_order | Int      | Order in lists |

**Migration:** `database/migrations/20260224200000_add_shipping_method_rates/migration.sql`  
- Creates the table and seeds default rates (see below).

**Shipment link:** `Shipment.shipping_rate_id` (String, e.g. `air_express`) and `Shipment.shipping_method` (`air_freight` \| `sea_freight`) store the user’s chosen rate and method when they book.

---

## 2. Default Rates (from seed)

**Air Freight**

| rate_id      | name                     | price   | currency | type | duration   |
|-------------|---------------------------|--------|----------|------|------------|
| air_express | Express (3-5 days)       | 17     | USD      | KG   | 3-5 days   |
| air_normal  | Normal (7-14 days)       | 13     | USD      | KG   | 7-14 days  |
| air_special | Special/Battery goods    | 20     | USD      | KG   | —          |
| air_phone   | Phone                    | 150    | RMB      | UNIT | —          |
| air_laptop  | Laptop                   | 200    | RMB      | KG   | —          |

**Sea Freight**

| rate_id      | name | price | currency | type | duration   |
|-------------|------|-------|----------|------|------------|
| sea_standard| Sea  | 245   | USD      | CBM  | 45-60 days |

(Phone and Laptop use RMB; all other rates use USD.)

---

## 3. Backend APIs

**Public (no auth)**  
- `GET /logistics/freight-rates?method=air_freight|sea_freight`  
  - Returns active rates for that method only.  
  - Used by the dashboard Create New Shipment form.

**Admin (auth + admin/superadmin role)**  
- `GET /logistics/admin/freight-rates` – all rates (Air + Sea)  
- `POST /logistics/admin/freight-rates` – create (body: rate_id, method, name, price, type, duration?, currency?, is_active?, sort_order?)  
- `PATCH /logistics/admin/freight-rates/:id` – update  
- `DELETE /logistics/admin/freight-rates/:id` – delete  

Implemented in:  
- `backend/src/logistics/logistics.controller.ts`  
- `backend/src/logistics/logistics.service.ts` (getFreightRates, getAllFreightRates, createFreightRate, updateFreightRate, deleteFreightRate)

---

## 4. Admin linking

- **Sidebar:** Admin menu includes **“Shipping Rates”** → `/admin/shipping-rates`  
  - `web/components/layout/Sidebar.tsx` (adminLinks).
- **Page:** `web/app/(main)/admin/shipping-rates/page.tsx`  
  - “Shipping Rates Management”  
  - Fetches `GET /logistics/admin/freight-rates`  
  - Two tables: **Air Shipping Rates**, **Sea Shipping Rates**  
  - Add / Edit (modal) / Delete per rate  
  - Columns: Rate ID, Name, Rate ($X.XX/type), Type, Duration, Status (ACTIVE/Inactive), Sort, Actions  

Admin can change prices, add new rates, deactivate old ones, and set order. Users only see active rates in the booking form.

---

## 5. User dashboard (Create New Shipment)

- **Page:** `web/app/(main)/dashboard/logistics/page.tsx`  
- **Flow:**  
  1. User selects **Shipping Method**: Air Freight or Sea Freight.  
  2. Frontend calls `GET /logistics/freight-rates?method=air_freight|sea_freight`.  
  3. **Select Rate** dropdown is filled with active rates (e.g. “Express (3-5 days) - $17.00/KG”).  
  4. On submit, payload includes `shipping_method` and `shipping_rate_id`; backend saves them on `Shipment`.

---

## 6. Optional: re-seed default rates

If the table is empty (e.g. migration ran without the INSERT, or rates were deleted), you can re-seed defaults:

```bash
cd database && npx ts-node seed-shipping-rates.ts
```

Or run the script your project uses for DB seeds. The migration’s `INSERT ... ON CONFLICT (rate_id) DO NOTHING` also prevents duplicate rate_ids if the migration is re-applied in a way that re-runs the INSERT.

---

## 7. Checklist

| Item                          | Status |
|-------------------------------|--------|
| DB model `ShippingMethodRate`  | Done   |
| Migration + seed (Air + Sea)  | Done   |
| Public GET freight-rates      | Done   |
| Admin GET/POST/PATCH/DELETE   | Done   |
| Admin UI at /admin/shipping-rates | Done   |
| Sidebar link “Shipping Rates” | Done   |
| User form: method + rate dropdown | Done   |
| Shipment.shipping_rate_id saved on book | Done   |

No further implementation is required for “shipping rates by Air and By Sea” and admin linking/database; you can adjust copy or add more rates via the admin UI as needed.
