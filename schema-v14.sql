-- v14: Blog Posts Table
-- AI-generated blog content for handybeaver.co/blog

CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,           -- HTML content
  
  -- Metadata
  category TEXT DEFAULT 'General', -- Safety, DIY, Seasonal, Tips, etc.
  tags TEXT,                       -- JSON array of tags
  featured_image TEXT,             -- R2 URL
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',     -- draft, published, archived
  
  -- Audit
  author TEXT DEFAULT 'lil-beaver',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  published_at INTEGER,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Index for listing published posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published 
ON blog_posts(status, published_at DESC) WHERE status = 'published';

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug 
ON blog_posts(slug);
