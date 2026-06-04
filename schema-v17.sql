-- v17: Job Media — Photos & Videos linked to jobs/customers
-- Uploaded via admin panel or Discord bot (Hermes agent)

CREATE TABLE IF NOT EXISTS job_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Associations
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,

  -- File info
  r2_key TEXT NOT NULL,              -- R2 object key e.g. job-media/123/photo.jpg
  url TEXT NOT NULL,                 -- Public-facing URL
  media_type TEXT NOT NULL DEFAULT 'image',  -- image | video
  filename TEXT,
  file_size INTEGER,
  mime_type TEXT,

  -- Metadata
  title TEXT,
  description TEXT,
  taken_at TEXT,                     -- ISO date the work was done

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'admin',  -- admin | discord
  discord_message_id TEXT,           -- Discord message ID if uploaded via bot
  discord_channel_id TEXT,           -- Channel it came from
  uploaded_by TEXT DEFAULT 'admin',  -- Who uploaded it

  -- Visibility
  visible_to_client INTEGER NOT NULL DEFAULT 1,  -- 1 = show in portal

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_media_booking ON job_media(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_media_customer ON job_media(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_media_source ON job_media(source);
CREATE INDEX IF NOT EXISTS idx_job_media_visible ON job_media(visible_to_client);
