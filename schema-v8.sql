-- Schema v8: Allow null customer_id for admin visualizer usage
-- Run: wrangler d1 execute handy-beaver-db --file=./schema-v8.sql --remote

-- Drop and recreate table without NOT NULL constraint on customer_id
-- First backup existing data
CREATE TABLE IF NOT EXISTS visualizer_usage_backup AS SELECT * FROM visualizer_usage;

-- Drop old table
DROP TABLE IF EXISTS visualizer_usage;

-- Recreate with nullable customer_id (matching existing 8 columns)
CREATE TABLE visualizer_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,                 -- NULL for admin usage (was NOT NULL)
  image_key TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result_key TEXT,
  result_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  saved_indefinitely INTEGER DEFAULT 0,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Restore data
INSERT INTO visualizer_usage SELECT * FROM visualizer_usage_backup;

-- Drop backup
DROP TABLE IF EXISTS visualizer_usage_backup;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_visualizer_usage_customer_date 
ON visualizer_usage(customer_id, created_at);

CREATE INDEX IF NOT EXISTS idx_visualizer_usage_expires 
ON visualizer_usage(saved_indefinitely, created_at);
