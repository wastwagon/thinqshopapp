# Admin Invoice System – Implementation Plan (Phased)

This plan extracts logic, calculations, and UI patterns from the **Shipping Fee Estimator** (Sea/Air, weight- and dimension-based) and applies them to an **admin invoice** feature: prepare invoices, generate PDFs for customers, and keep records.

---

## 1. Extracted Logic & Calculations (from Estimator)

### 1.1 Input parameters (mapped to invoices)

| Estimator field           | Invoice equivalent              | Notes |
|---------------------------|----------------------------------|-------|
| Shipping mode (Sea / Air) | Service type / Invoice type      | Optional: e.g. “Standard” vs “Proforma”. |
| Item type (dropdown)      | Line item description / Product  | Admin selects or types; can have preset rates. |
| Weight (kg)               | Quantity or weight per line      | Numeric with spinner. |
| Quantity                  | Quantity per line item           | Multiplier for line total. |
| Length, Width, Height + Unit | Optional: volumetric line items | CBM-style: `L×W×H → volume × rate × qty`. |
| **Admin-defined rates**       | Pricing/rates setup              | Admin configures name, unit, rate (e.g. $10/kg, $250/CBM), optional mode (Sea/Air). Used to prefill unit price when building invoice lines. |

### 1.2 Core calculation formulas

**Weight-based (from estimator):**

- `Line total = Weight (kg) × Rate per kg × Quantity`
- Example: `20 kg × $10/kg × 1 item = $200.00`

**Volume-based (CBM):**

- `Volume (CBM) = (L×W×H)` in chosen unit, converted to cubic meters.
- `Line total = Volume × Rate per CBM × Quantity`
- Example: `0.001 CBM × $250/CBM × 1 item = $0.25`

**Generic line item (for invoices):**

- `Line total = Quantity × Unit price`
- Optional: support “by weight” or “by volume” lines using the above.

**Invoice totals:**

- `Subtotal = sum(Line totals)`
- `Tax = Subtotal × Tax rate` (or per-line tax if needed)
- `Discount` = fixed amount or percentage
- `Total = Subtotal − Discount + Tax` (and optional shipping/fees)

### 1.3 Transparent breakdown (design requirement)

- Show per-line formula, e.g. `20.00 kg × $10/kg × 1 item = $200.00`.
- For simple invoices: `Qty × Unit price = Line total`.
- Display subtotal, discount, tax, total clearly.

### 1.4 UI patterns to reuse

- Section headers (e.g. “Package Details” → “Invoice details” / “Line items”).
- Mode/type selector: two large buttons (e.g. Sea/Air → Invoice type or default “Standard”).
- Dropdown for “Item type” → line item description or product picker.
- Numeric inputs with spinner arrows (quantity, weight, dimensions).
- Unit dropdown (kg, CBM, pcs, hours, etc.) per line or global.
- **Calculate** → **Update totals** / **Preview** (real-time or on action).
- **Reset** → **Clear form** / **New invoice**.
- Results box (orange-tinted) → **Invoice summary** (breakdown + total).
- “Share This Estimate” → **Generate PDF** / **Download PDF** / **Email to customer**.

---

## 2. Phased Implementation Plan

### Phase 1 – Data model & list/create (no PDF yet)

**Goal:** Admin can create and save invoices; view list and basic details. No PDF, no email.

**Backend**

- **Schema (Prisma):**
  - `Invoice`: id, invoice_number (unique), status (draft | sent | paid | overdue), issue_date, due_date, customer_name, customer_email, customer_phone, customer_address (optional), subtotal, discount_amount, discount_percent, tax_rate, tax_amount, total, currency (e.g. GHS), notes (optional), created_at, updated_at, created_by (user_id for admin).
  - `InvoiceLineItem`: id, invoice_id, description, quantity, unit (e.g. pcs, kg, CBM), unit_price, line_total, sort_order. Optional: weight_kg, volume_cbm for breakdown display.
- **Migrations:** Add `invoices` and `invoice_line_items` tables.
- **API (NestJS):**
  - `POST /invoices` – create (draft) with line items; compute subtotal/tax/discount/total server-side.
  - `GET /invoices` – list (admin only), filter by status, date range.
  - `GET /invoices/:id` – one invoice with line items (admin only).
  - `PATCH /invoices/:id` – update draft (recalculate totals).

**Frontend (admin)**

- **Sidebar:** Add “Invoices” (e.g. under Orders or Shipping Rates).
- **List page:** `/admin/invoices` – table of invoice number, customer name, date, total, status; “New invoice” button.
- **Create/Edit page:** Form with:
  - Customer: name, email, phone, address (optional).
  - Issue date, due date.
  - Line items table: description, quantity, unit, unit price, line total (computed). “Add line” / “Remove line”. Optional: weight or dimensions for selected “types” later.
  - Subtotal, discount (amount or %), tax rate %, tax amount, total (all computed).
  - Buttons: “Save draft”, “Cancel”. No PDF yet.

**Deliverables:** DB tables, CRUD API, list + create/edit UI with calculations and transparent breakdown.

---

### Phase 2 – PDF generation & download

**Goal:** Admin can generate a PDF for an invoice and download it; design matches “calculation + total” clarity.

**Backend**

- **PDF library:** e.g. `@react-pdf/renderer` (React-based, good for templates) or `puppeteer`/`pdf-lib` (Node). Prefer one that can render from shared template (company logo, breakdown, totals).
- **Endpoint:** `GET /invoices/:id/pdf` (or `POST /invoices/:id/generate-pdf`) returns PDF file (admin only). Use same totals as stored (no recalculation at PDF time, or recalc and then store).

**Frontend**

- **Invoice detail page:** “Download PDF” button; call API and trigger download (or open in new tab).
- **PDF content:** Header (ThinQShop, invoice number, dates), customer block, line items table (description, qty, unit, unit price, line total), subtotal, discount, tax, total. Optional: “Calculation” line per item (e.g. “20 kg × $10/kg × 1 = $200.00”) for transparency.

**Deliverables:** PDF generation endpoint, download from admin UI, simple but clear PDF layout.

---

### Phase 3 – Record keeping & status

**Goal:** Reliable records; admin can filter and track status.

**Backend**

- **PATCH /invoices/:id/status** – set status to `sent` | `paid` | `overdue` (admin).
- **GET /invoices** – already in Phase 1; ensure filters (status, date range, customer search) and sorting; pagination.

**Frontend**

- **List page:** Filters (status, date range); optional search by customer name or invoice number.
- **Detail page:** Show status; allow “Mark as sent”, “Mark as paid”, “Mark overdue”.
- **Persistence:** All created/updated invoices already stored in DB (Phase 1); no extra “records” step beyond ensuring list/detail use the same API.

**Deliverables:** Status workflow, filters and search, clear record of all generated invoices.

---

### Phase 4 – Optional: email PDF to customer

**Goal:** Admin can send the same PDF to the customer’s email.

**Backend**

- Reuse existing email/queue if present; otherwise simple send (e.g. Nodemailer).
- **POST /invoices/:id/send-email** – body: optional `to` override; default to `invoice.customer_email`. Attach generated PDF; subject/body template.

**Frontend**

- “Email to customer” on invoice detail; confirm dialog; show success/error.

**Deliverables:** Send PDF by email; optional “Mark as sent” when email is sent.

---

### Phase 5 – Admin pricing/rates setup

**Goal:** Admin can **set up and manage pricing rates** (e.g. per item type, per unit like kg or CBM, and optionally per mode like Sea/Air). These rates are then used when building invoice lines so the admin can pick a rate and have unit price prefilled – same idea as the estimator’s “Item type + mode → rate”.

**Backend**

- **Schema (Prisma):**
  - `InvoiceRate`: id, name (e.g. “Regular Goods”, “Phones”, “Sea – per CBM”), unit (kg | CBM | pcs | hour), rate_per_unit (decimal), optional mode (sea | air | standard – for freight-style), optional sort_order, is_active, created_at, updated_at.
- **API (NestJS, admin-only):**
  - `GET /invoice-rates` – list all rates (filter by unit, mode if needed).
  - `POST /invoice-rates` – create rate (name, unit, rate_per_unit, mode optional).
  - `PATCH /invoice-rates/:id` – update rate.
  - `DELETE /invoice-rates/:id` – soft-delete or hard-delete.
- **Usage:** When creating/editing an invoice line, frontend calls `GET /invoice-rates` and, when admin selects a rate, prefills **unit** and **unit price** (and optionally description from rate name). Line total = quantity × unit price (or weight × rate × quantity if using weight-based line).

**Frontend (admin)**

- **Sidebar:** Add “Invoice rates” or “Pricing (invoices)” under Invoices or Settings.
- **List page:** `/admin/invoice-rates` – table: name, unit, rate per unit, mode (if any), actions (Edit, Delete). “Add rate” button.
- **Create/Edit rate form:** Name, Unit (dropdown: kg, CBM, pcs, hour), Rate per unit (number), optional Mode (Sea / Air / —). Save / Cancel.

**Deliverables:** DB table and CRUD API for rates; admin UI to set up pricing; invoice form can use these rates to prefill line unit and unit price.

---

### Phase 6 – Optional: item types & rate presets in invoice (estimator-style)

**Goal:** When adding an invoice line, admin can **select** a saved rate (from Phase 5); description, unit, and unit price are prefilled. Optional: weight or dimensions for that line and show “Calculation: 20 kg × $10/kg × 1 = $200.00” in UI and in PDF.

**Backend**

- No new schema; use `InvoiceRate` from Phase 5. Optional: add `description` or `item_type` label on `InvoiceRate` for display in line item.
- **API:** Already have `GET /invoice-rates`; optional `GET /invoice-rates?unit=kg` for filtering by unit when adding a line.

**Frontend**

- Invoice create/edit: Line item row has “Rate” or “Item type” dropdown (options from `GET /invoice-rates`). On select: fill description (rate name), unit, unit price. Admin can still override. Optional: if unit is kg, show “Weight (kg)” input and compute line total as weight × unit price × quantity; if unit is CBM, show L/W/H and compute volume then line total.

**Deliverables:** Invoice form uses admin-configured rates for fast data entry; optional weight/volume breakdown like the estimator.

---

## 3. Design interface checklist (from estimator)

- [ ] Clear title and subtitle (e.g. “Invoices” / “Create invoice”).
- [ ] Mode/type selector if needed (e.g. Standard vs Proforma) – large buttons like Sea/Air.
- [ ] Section “Customer” and “Line items” with clear headings.
- [ ] Line items: description, quantity, unit, unit price, line total (auto).
- [ ] Numeric inputs with spinners where useful (quantity, weight, dimensions).
- [ ] “Add line” / “Remove line”.
- [ ] Calculation breakdown visible (e.g. “Qty × Unit price = Line total” per line).
- [ ] Subtotal, discount, tax, total in a highlighted summary block.
- [ ] Buttons: Save draft, Preview, Download PDF, Email to customer, Mark as sent/paid.
- [ ] List view: columns (number, customer, date, total, status); filters and search.
- [ ] **Pricing/rates (admin):** List of rates (name, unit, rate, mode); add/edit/delete; used to prefill invoice line unit price.

---

## 4. Safe implementation notes

- **Phase 1 first:** No PDF or email until create/edit and list work and totals are correct.
- **Permissions:** All invoice routes admin-only (reuse existing admin guard).
- **Idempotent totals:** Store subtotal, tax, discount, total in DB; PDF uses stored values (or recalc and save in same transaction).
- **Invoice number:** Unique, human-readable (e.g. `INV-2026-0001`); generate on first save.
- **Currency:** Single currency per invoice (e.g. GHS); configurable later if needed.

---

## 5. Summary

| Phase | Focus                           | Outcome                                                |
|-------|----------------------------------|--------------------------------------------------------|
| 1     | Data model, API, list + form     | Create/edit invoices; view list; calculations          |
| 2     | PDF                             | Download PDF for customers                             |
| 3     | Records & status                | Filters, search, status workflow                       |
| 4     | Email                           | Send PDF to customer email                             |
| 5     | **Admin pricing/rates setup**   | Admin configures rates (name, unit, rate, mode); CRUD  |
| 6     | Item types / presets in invoice | Select rate when adding line; prefill unit & price     |

Start with **Phase 1**; then PDF (Phase 2), then records and status (Phase 3). **Phase 5 (pricing/rates setup)** can be done next so admins can define rates; then Phase 6 wires those rates into the invoice form. Phase 4 (email) when needed.
