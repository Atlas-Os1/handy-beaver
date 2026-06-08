-- v20: Add visualizer_quotes table for storing AI project quote estimates
-- Quote estimates are linked to visualizer usage records and customers
-- Stores structured line items as JSON for admin visibility and history
CREATE TABLE IF NOT EXISTS visualizer_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  usage_id INTEGER,
  project_type TEXT,
  style TEXT,
  description TEXT,
  line_items TEXT,       -- JSON array of {type,description,qty,unit,price_per_unit,total}
  total_amount REAL,
  summary TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_visualizer_quotes_customer ON visualizer_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_visualizer_quotes_created ON visualizer_quotes(created_at DESC);
