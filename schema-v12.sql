-- v12: Invoice System - Phase 2
-- Add missing columns for full invoice management

-- Add invoice_date and terms columns to invoices
ALTER TABLE invoices ADD COLUMN invoice_date TEXT;
ALTER TABLE invoices ADD COLUMN terms TEXT;
ALTER TABLE invoices ADD COLUMN balance_due REAL DEFAULT 0;

-- Create trigger to auto-update balance_due when total or amount_paid changes
-- (Not needed for SQLite - we'll compute on read)

-- Update existing invoices to have balance_due calculated
UPDATE invoices SET balance_due = COALESCE(total, 0) - COALESCE(amount_paid, 0);

-- Update existing invoices to have invoice_date from created_at
UPDATE invoices SET invoice_date = date(created_at, 'unixepoch') WHERE invoice_date IS NULL;

-- Add default terms from business_settings
UPDATE invoices SET terms = (SELECT value FROM business_settings WHERE key = 'default_terms') 
WHERE terms IS NULL;
