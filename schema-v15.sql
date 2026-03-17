-- v15: Calendar Notes Table
-- Day-by-day notes, hours worked, and job counts for calendar view

CREATE TABLE IF NOT EXISTS calendar_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Date (one row per day)
  date TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD format
  
  -- Work tracking
  hours_worked REAL DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  
  -- Notes
  note TEXT,
  
  -- Audit
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_notes_date 
ON calendar_notes(date);
