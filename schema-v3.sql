-- The Handy Beaver Database Schema v3
-- Adds invoices, job notes, and agent tracking

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  booking_id INTEGER REFERENCES bookings(id),
  quote_id INTEGER REFERENCES quotes(id),
  invoice_number TEXT UNIQUE,
  labor_amount REAL DEFAULT 0,
  helper_amount REAL DEFAULT 0,
  materials_amount REAL DEFAULT 0,
  equipment_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  subtotal REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, partial, paid, overdue, cancelled
  due_date INTEGER,
  sent_at INTEGER,
  paid_at INTEGER,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Job Notes (internal notes for each job)
CREATE TABLE IF NOT EXISTS job_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  admin_id INTEGER REFERENCES admins(id),
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- general, work_log, materials, issue, followup
  created_at INTEGER DEFAULT (unixepoch())
);

-- Agent Conversations (track agent interactions)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id),
  agent_type TEXT NOT NULL, -- 'customer' (website) or 'admin' (discord)
  channel_id TEXT, -- Discord channel ID if applicable
  thread_id TEXT, -- Discord thread ID if applicable
  context TEXT, -- JSON context for the conversation
  created_at INTEGER DEFAULT (unixepoch()),
  last_message_at INTEGER
);

-- Agent Actions (track what the agent does)
CREATE TABLE IF NOT EXISTS agent_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER REFERENCES agent_conversations(id),
  action_type TEXT NOT NULL, -- quote_created, invoice_sent, message_sent, blog_drafted, etc.
  action_data TEXT, -- JSON data about the action
  created_at INTEGER DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_job_notes_booking ON job_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_customer ON agent_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_channel ON agent_conversations(channel_id);
