-- v10: Add social_messages table for FB/IG messaging integration

CREATE TABLE IF NOT EXISTS social_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL, -- 'facebook', 'instagram'
  sender_id TEXT NOT NULL,
  page_id TEXT,
  post_id TEXT,
  message_text TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound', -- 'inbound' or 'outbound'
  message_type TEXT DEFAULT 'dm', -- 'dm', 'comment'
  created_at INTEGER NOT NULL
);

-- Index for querying conversations
CREATE INDEX IF NOT EXISTS idx_social_messages_sender ON social_messages(platform, sender_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_created ON social_messages(created_at DESC);

-- Add source column to leads if not exists (for tracking messenger/dm leads)
-- Note: Using INSERT to avoid ALTER TABLE issues with D1
