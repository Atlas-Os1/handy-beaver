-- v11: Invoice System - Phase 1
-- Tables for full invoicing with line items, payments tracking, and business settings

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date TEXT NOT NULL, -- ISO date
  due_date TEXT,
  subtotal REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  amount_paid REAL DEFAULT 0,
  balance_due REAL DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, sent, partial, paid, overdue, cancelled
  notes TEXT,
  terms TEXT,
  square_invoice_id TEXT,
  square_status TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  rate REAL NOT NULL,
  amount REAL GENERATED ALWAYS AS (quantity * rate) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Invoice payments (separate from booking payments)
CREATE TABLE IF NOT EXISTS invoice_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL, -- ISO date
  method TEXT, -- cash, check, square, venmo, zelle, etc
  reference TEXT, -- check number, transaction ID, last 4 of card
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Business settings (branding, defaults)
CREATE TABLE IF NOT EXISTS business_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);

-- Insert default business settings
INSERT OR IGNORE INTO business_settings (key, value) VALUES 
  ('business_name', 'The Handy Beaver'),
  ('business_address', 'Clayton, OK'),
  ('phone', '(580) 566-7017'),
  ('email', 'noreply@handybeaver.co'),
  ('default_terms', 'Payment due within 30 days. Thank you for your business!'),
  ('default_due_days', '30'),
  ('square_enabled', 'false'),
  ('logo_url', '');
