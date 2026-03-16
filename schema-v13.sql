-- v13: Content Queue System
-- Agents generate content, worker publishes from queue

CREATE TABLE IF NOT EXISTS content_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content
  caption TEXT NOT NULL,
  image_url TEXT,                    -- R2 URL for generated image
  image_prompts TEXT,                -- JSON array of prompts used (for reels = 3 prompts)
  hashtags TEXT,                     -- Space-separated hashtags
  
  -- Metadata
  theme TEXT,                        -- e.g., 'tip', 'question', 'seasonal', 'testimonial', 'behindscenes'
  persona TEXT DEFAULT 'lil-beaver', -- 'lil-beaver', 'handy-beaver', 'owner'
  content_type TEXT DEFAULT 'post',  -- 'post', 'reel', 'story', 'blog'
  
  -- Targeting
  platform TEXT DEFAULT 'both',      -- 'fb', 'ig', 'both', 'blog'
  
  -- Scheduling
  scheduled_for INTEGER,             -- Unix timestamp for publish time
  publish_window_start INTEGER,      -- Optional: earliest publish time
  publish_window_end INTEGER,        -- Optional: latest publish time (for randomization)
  
  -- Status
  status TEXT DEFAULT 'pending',     -- 'pending', 'generating', 'ready', 'publishing', 'published', 'failed'
  error_message TEXT,
  
  -- Tracking
  fb_post_id TEXT,                   -- Facebook post ID after publishing
  ig_media_id TEXT,                  -- Instagram media ID after publishing
  
  -- Audit
  created_by TEXT,                   -- 'flo', 'lil-beaver', 'cron', 'manual'
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  published_at INTEGER,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Index for efficient queue polling
CREATE INDEX IF NOT EXISTS idx_content_queue_status_scheduled 
ON content_queue(status, scheduled_for);

-- Index for finding unpublished content
CREATE INDEX IF NOT EXISTS idx_content_queue_pending
ON content_queue(status) WHERE status IN ('pending', 'ready');

-- Content themes for variety tracking
CREATE TABLE IF NOT EXISTS content_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  last_used_at INTEGER,
  use_count INTEGER DEFAULT 0
);

-- Seed default themes
INSERT OR IGNORE INTO content_themes (name, description) VALUES
  ('tip', 'Helpful handyman tips and advice'),
  ('question', 'Engaging questions to spark conversation'),
  ('seasonal', 'Season-specific content (spring cleaning, winter prep, etc)'),
  ('testimonial', 'Customer success stories and reviews'),
  ('behindscenes', 'Behind the scenes of projects'),
  ('transformation', 'Before/after project showcases'),
  ('diy', 'Simple DIY tips homeowners can do'),
  ('safety', 'Home safety and maintenance reminders'),
  ('local', 'Local area specific content (Broken Bow, McCurtain County)'),
  ('humor', 'Light-hearted handyman humor');

-- Track what we've posted recently to avoid repetition
CREATE TABLE IF NOT EXISTS content_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme TEXT,
  topic_keywords TEXT,               -- Key topics covered
  published_at INTEGER,
  platform TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_history_recent
ON content_history(published_at DESC);
