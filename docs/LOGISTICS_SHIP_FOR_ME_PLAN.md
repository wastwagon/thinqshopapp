# Logistics – Ship for Me – Implementation Plan

## Reference: Your current admin dashboard (Shipping Rates Management)

Your admin already has **Shipping Rates Management** with:

- **Air Shipping Rates:** air_express ($17/KG, 3-5 days), air_laptop ($200/KG), air_normal ($13/KG, 7-14 days), air_phone ($150/UNIT), air_special ($20/KG). Columns: Rate ID, Name, Rate, Type (KG/UNIT), Duration, Status (ACTIVE), Sort, Actions (Edit, Delete).
- **Sea Shipping Rates:** sea_standard ($245/CBM, 45-60 days). Same columns; Type = CBM.
- **Add Shipping Rate** button; Edit and Delete per row.

We implement the same structure (two tables by method, same columns and behaviour) in this app so your workflow stays familiar.

---

## 1. Current state (from your form & codebase)

- **User flow:** User selects "Ship for me" → picks China warehouse (origin) → picks Ghana warehouse + delivery address → enters **carrier tracking number** (from supplier) → weight, COD, items declaration → books. No admin-configurable freight rates yet; price is TBD (0).
- **Admin:** Sees all shipments; can update status manually; "simulate webhook" advances status. No scan-by-tracking or configurable air/sea rates.
- **Data:** `Shipment` has `tracking_number` (SHP-xxx), `carrier_tracking_number`, `origin_warehouse_id`, `destination_warehouse_id`, `shipping_method` (air_freight/sea_freight), `ShipmentTracking[]`. No table for freight rates (air/sea per kg or per unit).
- **Notifications:** Already sent when admin updates status.

---

## 2. Target flow (Ship for me only)

1. **User** sees only the **local pickup address** (China warehouse) – "Send your parcel here" with copy. No need to "select" origin warehouse if there is only one; or keep one default.
2. **User** enters **supplier’s tracking number** when the order has been shipped by the supplier.
3. **ThinqShop** uses that tracking number to follow up until the parcel **arrives at the China warehouse**.
4. When it **arrives at warehouse**, admin **scans/enters tracking** in the app → system **auto-updates** that shipment to "Received at warehouse".
5. ThinqShop then ships to Ghana; admin (or process) updates status: **In transit → Out for delivery → Delivered** (pick up at Ghana warehouse).
6. **User** is **notified at each status change** (already in place; ensure all new statuses trigger notifications).
7. **Admin** can **configure shipping method rates** (by air now; by sea when you share). Users see and pay by these rates when booking.

---

## 3. Implementation phases

### Phase A – Data model & admin rates (match current admin dashboard)

Your **Shipping Rates Management** already defines the structure. We mirror it in the app:

- **3A.1 Freight rate table**  
  `ShippingMethodRate` (or `FreightRate`):
  - **rate_id** (string, unique) – e.g. `air_express`, `air_normal`, `air_laptop`, `air_phone`, `air_special`, `sea_standard`.
  - **method** – `air_freight` | `sea_freight` (or derived from rate_id prefix).
  - **name** – e.g. "Express (3-5 days)", "Sea Standard".
  - **price** – decimal (e.g. 17.00, 245.00).
  - **type** – `KG` | `UNIT` | `CBM` (unit for display and calculation).
  - **duration** – string, e.g. "3-5 days", "7-14 days", "45-60 days".
  - **is_active** – boolean (STATUS: ACTIVE/inactive).
  - **sort_order** – int (SORT column, default 0).

  **Air rates (from your dashboard):**

  | RATE ID      | NAME                    | RATE        | TYPE | DURATION   |
  |--------------|-------------------------|-------------|------|------------|
  | air_express  | Express (3-5 days)      | $17.00/KG   | KG   | 3-5 days   |
  | air_laptop   | Laptop                  | $200.00/KG  | KG   | —          |
  | air_normal   | Normal (7-14 days)      | $13.00/KG   | KG   | 7-14 days  |
  | air_phone    | Phone                   | $150.00/UNIT| UNIT | —          |
  | air_special  | Special/Battery Goods   | $20.00/KG   | KG   | —          |

  **Sea rates:**

  | RATE ID      | NAME          | RATE        | TYPE | DURATION   |
  |--------------|---------------|-------------|------|------------|
  | sea_standard | Sea Standard  | $245.00/CBM | CBM  | 45-60 days |

- **3A.2 Admin CRUD**  
  - **Admin UI:** "Shipping Rates Management" – two tables (Air Shipping Rates, Sea Shipping Rates), **Add Shipping Rate** button, per-row **Edit** and **Delete**. Columns: Rate ID, Name, Rate (display as $X.XX/TYPE), Type, Duration, Status (ACTIVE/inactive), Sort, Actions.
  - **API:** `GET /logistics/freight-rates` (for user booking, filter by method and is_active), `GET /logistics/admin/freight-rates` (all), `POST /logistics/admin/freight-rates`, `PATCH /logistics/admin/freight-rates/:id`, `DELETE /logistics/admin/freight-rates/:id`.
- **3A.3 Price calculation**  
  - User selects method (air/sea) and a rate row (e.g. Express per KG). Enters weight (kg) and/or units (for UNIT/CBM). Backend computes total from `price` and `type` (KG → price × weight; UNIT → price × units; CBM → price × cbm).  
  - Store in `Shipment`: `shipping_method`, `shipping_rate_id` (or name), `base_price`/`total_price`, etc.

### Phase B – User experience (Ship for me only)

- **3B.1 Single flow**  
  - Remove or hide "Local courier" from the main booking wizard so the dashboard shows **only "Ship for me"** (or keep courier in a separate section if you still need it later).
- **3B.2 Local pickup address only**  
  - User sees **one clear block**: "Send your parcel to this address" – China warehouse address + receiver (ThinQ + user identifier) + phone + copy button. No dropdown of warehouses if there is only one China warehouse; otherwise default to "ThinQShopping Main 1" or first China warehouse.
- **3B.3 Tracking number first**  
  - Prominent field: "Carrier tracking number (from your supplier)". Required. Optional: "Add tracking later" with a follow-up step to add it to an existing booking (see Phase D).
- **3B.4 Shipping method & rate**  
  - Dropdown: Air Freight (and Sea when added). Then "Shipping rate" dropdown populated from admin rates (e.g. Express, Normal, Laptop, Phone, Special/Battery). Show price per KG or per UNIT.  
  - Weight (kg) and, if needed, "units" for rate types like "Phone – per unit".  
  - Calculate and show total; user pays (wallet/card) before or after (e.g. pay on arrival at Ghana – COD) depending on your business rule.
- **3B.5 Destination**  
  - Ghana warehouse (or delivery address) + delivery address in Ghana for final delivery/pickup. Keep as today.

### Phase C – Status flow & tracking

- **3C.1 Status enum**  
  Add (or map) statuses so the flow is clear:
  - `booked` – User submitted; may or may not have added carrier tracking yet.
  - `awaiting_supplier` (optional) – User added carrier tracking; waiting for parcel to reach China warehouse.
  - `received_at_warehouse` – Parcel scanned/received at China warehouse (admin scan or manual update).
  - `in_transit` – Shipped to Ghana.
  - `out_for_delivery` – At Ghana hub / out for delivery.
  - `delivered` – Delivered / picked up at Ghana warehouse.

  If you prefer not to add new statuses, reuse e.g. `picked_up` for "received at warehouse" and keep the rest as is. Important: **one clear "received at China warehouse"** step so users see "Your parcel has arrived at our warehouse."
- **3C.2 Notifications**  
  - Every status change (including "received at warehouse") triggers a notification to the user (title + message + link to tracking). Already partially there; ensure all transitions are covered.
- **3C.3 Tracking timeline**  
  - User dashboard: shipment detail shows a **timeline** of statuses (from `ShipmentTracking`) with dates and optional notes. Public track page (e.g. `/track?number=SHP-xxx`) can show the same.

### Phase D – Admin: review, update, scan

- **3D.1 List & filters**  
  - Admin list of shipments with filters: status, date range, carrier tracking number, our tracking number (SHP-xxx). Show carrier_tracking_number prominently.
- **3D.2 Update status & notes**  
  - Admin can set status to received_at_warehouse, in_transit, out_for_delivery, delivered and add notes. Each update appends a row to `ShipmentTracking` and sends a notification.
- **3D.3 Scan to mark "Received at warehouse"**  
  - **Option A (simple):** Admin page has a text field "Enter carrier tracking number". On submit, backend finds shipment by `carrier_tracking_number`, then updates status to `received_at_warehouse` and creates a tracking record.  
  - **Option B (barcode/QR):** Same flow but the input is filled by a barcode scanner or QR scan (camera or file). Backend still matches `carrier_tracking_number` and updates the same way.  
  - Validation: only allow "received at warehouse" if current status is booked (or awaiting_supplier). Optional: prevent duplicate scan (idempotent).

### Phase E – Optional enhancements

- **3E.1 Add tracking later**  
  - User creates booking without carrier tracking; later, "Add tracking number" on that shipment (e.g. in "My shipments") and submits. Backend updates `carrier_tracking_number` and optionally status to awaiting_supplier.
- **3E.2 Sea freight**  
  - Your dashboard already has **Sea Standard** ($245.00/CBM, 45-60 days). Same table and admin UI; user selects "Sea Freight" and the sea rate; rest of flow unchanged.
- **3E.3 Public tracking**  
  - `/track?number=SHP-xxx` (and optionally by carrier number) shows status timeline and last status for unauthenticated viewers.

---

## 4. Suggested order of work

1. **Phase A** – Freight rates table + admin CRUD + GET for user. Then wire booking to use these rates and calculate price.
2. **Phase B** – Simplify user UI to "Ship for me" only, local pickup address block, tracking number, method + rate + weight, then destination.
3. **Phase C** – Add or map "received at warehouse" status; ensure notifications for all status changes; add tracking timeline on user shipment detail.
4. **Phase D** – Admin: scan/enter carrier tracking to set "received at warehouse"; list filters and status updates with notes.
5. **Phase E** – Add tracking later, sea freight, public track page as needed.

---

## 5. Summary

- **Admin:** Configure air (and later sea) rates; review shipments; update status with notes; scan or enter carrier tracking to auto-update "Received at warehouse."
- **User:** Sees only the China warehouse address to send parcels; enters supplier tracking number; selects method + rate; gets notified at every status change and can view tracking timeline.
- **System:** One clear status path from booked → received at warehouse → in transit → out for delivery → delivered, with notifications and optional scan-to-receive.

If you confirm this plan, next step is Phase A (data model + admin rates) and then Phase B (user flow and UI).
