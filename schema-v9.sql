-- Schema v9: calendar sync fields for bookings
-- Run: wrangler d1 execute handy-beaver-db --file=./schema-v9.sql --remote

ALTER TABLE bookings ADD COLUMN google_event_id TEXT;
ALTER TABLE bookings ADD COLUMN google_event_link TEXT;
ALTER TABLE bookings ADD COLUMN calendar_sync_status TEXT DEFAULT 'not_synced';
ALTER TABLE bookings ADD COLUMN calendar_last_synced_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON bookings(google_event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_calendar_sync_status ON bookings(calendar_sync_status);
