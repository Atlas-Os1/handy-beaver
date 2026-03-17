-- v16: Social Posts Table for Lil Beaver's content engine
-- Tracks post styles, performance, and learns what works

CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content
  caption TEXT NOT NULL,
  image_url TEXT,
  image_description TEXT,
  
  -- Creative metadata
  style TEXT NOT NULL,  -- tip, before-after, behind-scenes, etc.
  theme TEXT,           -- bathroom-remodel, flooring, etc.
  tone TEXT,            -- casual, professional, humorous, etc.
  hashtags TEXT,        -- JSON array
  
  -- Platform
  platform TEXT DEFAULT 'both',  -- facebook, instagram, both
  
  -- Status & scheduling
  status TEXT DEFAULT 'draft',   -- draft, pending, published, failed
  scheduled_for INTEGER,         -- Unix timestamp
  published_at TEXT,             -- ISO timestamp
  
  -- Platform IDs (after publishing)
  fb_post_id TEXT,
  ig_media_id TEXT,
  
  -- Performance metrics
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,  -- Weighted score
  
  -- Audit
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_style ON social_posts(style);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_posts_engagement ON social_posts(engagement_score);
