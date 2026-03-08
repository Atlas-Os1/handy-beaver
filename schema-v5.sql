-- Schema v5: Add portfolio tables for gallery and service images

-- Portfolio Categories
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon class
  display_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Portfolio Images (gallery, hero, service images)
CREATE TABLE IF NOT EXISTS portfolio_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL, -- R2 object key
  category_id INTEGER REFERENCES portfolio_categories(id),
  title TEXT,
  description TEXT,
  alt_text TEXT,
  image_type TEXT NOT NULL DEFAULT 'gallery', -- gallery, hero, service, before, after, about
  is_before_after INTEGER DEFAULT 0,
  paired_image_id INTEGER REFERENCES portfolio_images(id), -- For before/after pairs
  is_featured INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  tags TEXT, -- JSON array of tags
  created_at INTEGER DEFAULT (unixepoch())
);

-- Seed initial categories
INSERT OR IGNORE INTO portfolio_categories (slug, name, description, icon, display_order) VALUES
  ('bathroom-remodels', 'Bathroom Remodels', 'Full bathroom transformations with tile, shiplap, and custom woodwork', '🛁', 1),
  ('specialty-wood', 'Specialty Wood', 'Blue pine, beetle kill, live-edge, and premium woodwork', '🪵', 2),
  ('trim-carpentry', 'Trim & Carpentry', 'Crown molding, door trim, T&G accent walls', '🔨', 3),
  ('flooring', 'Flooring', 'Hardwood installation, repair, and refinishing', '🏠', 4),
  ('stairs-railings', 'Stairs & Railings', 'Custom stairs, modern metal railings, and handrails', '🪜', 5),
  ('decks-outdoor', 'Decks & Outdoor', 'Deck builds, repairs, staining, and outdoor living', '🏡', 6),
  ('doors', 'Door Installation', 'Entry doors, French doors, and custom trim work', '🚪', 7);

CREATE INDEX IF NOT EXISTS idx_portfolio_images_category ON portfolio_images(category_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_type ON portfolio_images(image_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_featured ON portfolio_images(is_featured);
