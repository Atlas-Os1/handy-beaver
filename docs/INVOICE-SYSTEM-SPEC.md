# Invoice System Spec — Handy Beaver

**Owner:** Dev  
**Reviewer:** Flo  
**Priority:** HIGH  
**Created:** 2026-03-14

---

## Overview

Build a full invoicing/quoting system for Handy Beaver with:
- Web UI for manual creation/editing
- Lil Beaver agent access via API
- Square sync integration
- Payment tracking (partial + full)
- PDF generation
- Customizable branding

---

## UI Pages

### 1. `/admin/invoices` — Invoice List
- Table: Invoice #, Customer, Amount, Status, Date, Due Date
- Status badges: Draft, Sent, Partial, Paid, Overdue
- Quick actions: View, Edit, Send, Mark Paid
- Filter by status

### 2. `/admin/invoices/new` — Create Invoice
UI like the reference screenshots:
- **Customer selector** (dropdown, searchable)
- **Invoice Number** (auto-generated: INV-0000001)
- **Invoice Date** (default: today)
- **Due Date** (default: +30 days, configurable)
- **Line Items** section:
  - Add Item button
  - Each item: Description, Qty, Rate, Amount (calculated)
  - Delete item button
  - Subtotal, Tax (optional), Total
- **Notes** (free text, shown on invoice)
- **Terms & Conditions** (pull from settings, editable per-invoice)
- **Actions:** Save Draft, Generate Invoice (PDF), Send to Customer

### 3. `/admin/invoices/:id` — View/Edit Invoice
- Same form as create, pre-filled
- Payment section:
  - Amount Paid: $XXX of $XXX
  - Add Payment button (amount, date, method, reference)
  - Payment history list
  - "Mark Paid in Full" button
- Status indicator
- Send/Resend button
- Square status (if synced)

### 4. `/admin/invoices/:id/pdf` — PDF Generation
- Clean PDF with:
  - Business logo (from settings)
  - Business name & contact
  - Customer name & contact
  - Invoice details
  - Line items table
  - Payment summary
  - Notes & Terms
- Return as downloadable PDF or inline view

### 5. `/admin/settings` — Business Settings
- **Logo Upload** (store in R2)
- **Business Name**
- **Business Address**
- **Phone / Email**
- **Default Payment Terms** (text)
- **Default Due Days** (number)
- **Square Integration** (API key, sync toggle)

---

## Database Schema

### `invoice_items` table
```sql
CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  rate REAL NOT NULL,
  amount REAL GENERATED ALWAYS AS (quantity * rate) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### `payments` table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  method TEXT, -- cash, check, square, venmo, etc
  reference TEXT, -- check number, transaction ID
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### `business_settings` table
```sql
CREATE TABLE business_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
-- Keys: logo_url, business_name, business_address, phone, email, 
--       default_terms, default_due_days, square_enabled
```

### Update `invoices` table
Add columns if not present:
```sql
ALTER TABLE invoices ADD COLUMN subtotal REAL;
ALTER TABLE invoices ADD COLUMN tax_rate REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN tax_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN total REAL;
ALTER TABLE invoices ADD COLUMN amount_paid REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN balance_due REAL;
ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'draft';
-- status: draft, sent, partial, paid, overdue, cancelled
ALTER TABLE invoices ADD COLUMN due_date TEXT;
ALTER TABLE invoices ADD COLUMN terms TEXT;
ALTER TABLE invoices ADD COLUMN square_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN square_status TEXT;
```

---

## API Endpoints

### Invoices
```
GET    /api/admin/invoices              — List all
POST   /api/admin/invoices              — Create new
GET    /api/admin/invoices/:id          — Get one
PATCH  /api/admin/invoices/:id          — Update
DELETE /api/admin/invoices/:id          — Delete (soft?)

POST   /api/admin/invoices/:id/send     — Send to customer (email)
GET    /api/admin/invoices/:id/pdf      — Generate PDF
POST   /api/admin/invoices/:id/square   — Sync to Square
```

### Line Items
```
GET    /api/admin/invoices/:id/items    — List items
POST   /api/admin/invoices/:id/items    — Add item
PATCH  /api/admin/invoices/:id/items/:itemId — Update item
DELETE /api/admin/invoices/:id/items/:itemId — Remove item
```

### Payments
```
GET    /api/admin/invoices/:id/payments — List payments
POST   /api/admin/invoices/:id/payments — Record payment
DELETE /api/admin/invoices/:id/payments/:paymentId — Remove payment
POST   /api/admin/invoices/:id/mark-paid — Mark fully paid
```

### Settings
```
GET    /api/admin/settings              — Get all settings
PATCH  /api/admin/settings              — Update settings
POST   /api/admin/settings/logo         — Upload logo (multipart)
```

---

## Chat API → Gateway → Lil Beaver

**IMPORTANT:** The `/api/chat` endpoint on handybeaver.co should route to Lil Beaver through the OpenClaw gateway.

### Current Issue
The chat endpoint needs to call the gateway at the correct URL with proper auth.

### Required Flow
```
Customer → handybeaver.co/api/chat 
        → Gateway (VPS) 
        → Lil Beaver agent 
        → Response
```

### Implementation
```typescript
// In chat endpoint handler
const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GATEWAY_TOKEN}`,
    'Content-Type': 'application/json',
    'X-OpenClaw-Agent': 'lil-beaver'  // Route to Lil Beaver
  },
  body: JSON.stringify({
    messages: [...],
    // Include customer context
  })
});
```

### Secrets Needed
- `GATEWAY_URL` — The gateway endpoint (Tailscale or public)
- `GATEWAY_TOKEN` — Auth token for gateway

---

## AI Visualizer Tool

Lil Beaver should be able to call the AI visualizer when customers ask about projects.

### Trigger Phrases
- "What would X look like?"
- "Can you show me..."
- "Visualize this project"
- "AI rendering of..."

### Integration
Add to Lil Beaver's SKILL.md:
```markdown
### AI Visualizer

Generate project visualization:
```bash
curl -X POST "https://handybeaver.co/api/visualizer" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A stained deck with new railings on a rural Oklahoma home",
    "style": "realistic"
  }'
```

Returns: Image URL of the visualization
```

---

## Verification Checklist (Flo)

### UI Testing
- [ ] Create invoice via UI
- [ ] Add line items
- [ ] Generate PDF
- [ ] Edit existing invoice
- [ ] Record partial payment
- [ ] Mark paid in full
- [ ] Upload logo in settings
- [ ] Verify PDF has correct logo

### Lil Beaver Testing
- [ ] "Create a quote for John Smith - deck staining, full day"
- [ ] "Add a line item to invoice 1: materials $50"
- [ ] "Mark invoice 3 as paid"
- [ ] "What's the balance on invoice 2?"
- [ ] "Show me all unpaid invoices"

### Chat API Testing
- [ ] Customer message routes to Lil Beaver
- [ ] Lil Beaver responds with customer context
- [ ] Visualizer tool works when requested

---

## Timeline

1. **Day 1:** Database schema + API endpoints
2. **Day 2:** Invoice list + create UI
3. **Day 3:** Edit UI + payments + PDF
4. **Day 4:** Settings page + logo upload
5. **Day 5:** Chat API → Gateway integration
6. **Day 6:** Flo verification + fixes

---

## Reference

Screenshots provided by Minte show an invoicing app with:
- Clean form layout
- Customer dropdown
- Auto-incrementing invoice number
- Date pickers
- Line item management
- Notes/terms sections
- Generate button

Build something similar but tailored for Handy Beaver's workflow.
