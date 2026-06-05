-- v18: Job Media — Photos & Videos linked to jobs/customers
-- Uploaded via admin panel or Discord bot (Hermes agent)

CREATE TABLE IF NOT EXISTS job_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  taken_at TEXT,
  source TEXT NOT NULL DEFAULT 'admin',
  discord_message_id TEXT,
  discord_channel_id TEXT,
  uploaded_by TEXT DEFAULT 'admin',
  visible_to_client INTEGER NOT NULL DEFAULT 1,
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_media_booking ON job_media(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_media_customer ON job_media(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_media_source ON job_media(source);
CREATE INDEX IF NOT EXISTS idx_job_media_visible ON job_media(visible_to_client);
