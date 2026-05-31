-- Schema v17: Cabin Design Studio
-- Adds design_sessions, design_quotes, material_catalog

-- Design sessions: track each visualization attempt with full context
CREATE TABLE IF NOT EXISTS design_sessions (
  id TEXT PRIMARY KEY,                    -- UUID
  customer_id INTEGER REFERENCES customers(id),
  mode TEXT NOT NULL DEFAULT 'remodel',   -- 'remodel' | 'addition' | 'sign' | 'material'
  style_preset TEXT,                      -- 'rustic_cedar' | 'mountain_lodge' | 'modern_farmhouse' | 'lakeside'
  area_type TEXT,                         -- 'deck' | 'interior' | 'exterior' | 'entry' | 'kitchen' | 'bathroom' | 'loft'
  input_image_key TEXT,
  result_image_key TEXT,
  prompt TEXT,
  enhanced_prompt TEXT,
  design_params TEXT,                     -- JSON: { sqft, materials[], dimensions, style }
  quote_data TEXT,                        -- JSON: { line_items[], totals }
  generation_model TEXT,
  status TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'generated' | 'quoted' | 'requested'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Design quotes: itemized cost breakdowns generated from sessions
CREATE TABLE IF NOT EXISTS design_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES design_sessions(id),
  customer_id INTEGER REFERENCES customers(id),
  title TEXT,
  line_items TEXT NOT NULL,               -- JSON array: [{ category, description, qty, unit, unit_cost, total }]
  sqft REAL,
  materials_total REAL NOT NULL DEFAULT 0,
  labor_total REAL NOT NULL DEFAULT 0,
  overhead_total REAL NOT NULL DEFAULT 0,
  markup_total REAL NOT NULL DEFAULT 0,
  grand_total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'sent' | 'approved' | 'converted'
  converted_quote_id INTEGER REFERENCES quotes(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Material catalog: real pricing for SE Oklahoma / Hochatown area
CREATE TABLE IF NOT EXISTS material_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,                 -- 'lumber' | 'decking' | 'stain' | 'hardware' | 'roofing' | 'sign'
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,                     -- 'lf' | 'sqft' | 'gallon' | 'each' | 'lb'
  unit_cost REAL NOT NULL,               -- our cost
  retail_cost REAL NOT NULL,             -- what we charge customer
  coverage REAL,                         -- sqft per unit (for paint/stain)
  style_tags TEXT,                       -- JSON array of applicable styles
  active INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Seed material catalog with realistic Hochatown pricing
INSERT OR IGNORE INTO material_catalog (category, name, description, unit, unit_cost, retail_cost, coverage, style_tags) VALUES
  -- Lumber
  ('lumber', 'Cedar 1x6', 'Western red cedar, clear grade', 'lf', 3.20, 5.50, NULL, '["rustic_cedar","mountain_lodge","lakeside"]'),
  ('lumber', 'Cedar 2x6', 'Western red cedar, #2 grade', 'lf', 4.80, 7.50, NULL, '["rustic_cedar","mountain_lodge","lakeside"]'),
  ('lumber', 'Pine 1x6', 'Southern yellow pine, common grade', 'lf', 1.80, 3.25, NULL, '["modern_farmhouse","budget"]'),
  ('lumber', 'Pine 2x6', 'Southern yellow pine, #2 grade', 'lf', 2.40, 4.00, NULL, '["modern_farmhouse","budget"]'),
  ('lumber', 'PT 2x6', 'Pressure treated, ground contact', 'lf', 3.10, 5.00, NULL, '["deck","exterior"]'),
  ('lumber', 'PT 2x8', 'Pressure treated, ground contact', 'lf', 4.20, 6.50, NULL, '["deck","exterior"]'),
  ('lumber', 'PT 2x10', 'Pressure treated, ground contact', 'lf', 5.50, 8.50, NULL, '["deck","exterior"]'),
  -- Decking
  ('decking', 'Cedar Deck Boards 5/4x6', 'Smooth cedar, great for staining', 'sqft', 3.80, 6.50, NULL, '["rustic_cedar","mountain_lodge"]'),
  ('decking', 'PT Deck Boards 5/4x6', 'Pressure treated pine', 'sqft', 2.90, 4.75, NULL, '["budget","modern_farmhouse"]'),
  ('decking', 'Composite Decking', 'TimberTech composite, 20yr warranty', 'sqft', 8.50, 14.00, NULL, '["modern_farmhouse","lakeside"]'),
  -- Stain / Finish
  ('stain', 'TWP 100 Series (Cedar)', 'Total Wood Preservative, semi-transparent cedar', 'gallon', 38.00, 65.00, 150.0, '["rustic_cedar","mountain_lodge"]'),
  ('stain', 'TWP 100 Series (Dark Oak)', 'Total Wood Preservative, semi-transparent dark oak', 'gallon', 38.00, 65.00, 150.0, '["mountain_lodge","lakeside"]'),
  ('stain', 'Cabot Australian Timber Oil', 'Penetrating oil finish, hardwood compatible', 'gallon', 42.00, 70.00, 175.0, '["modern_farmhouse","lakeside"]'),
  ('stain', 'Armstrong Clark Semi-Trans', 'Semi-transparent deck stain, mold resistant', 'gallon', 36.00, 60.00, 200.0, '["rustic_cedar","budget"]'),
  ('stain', 'Solid Color Deck Stain', 'Full hide solid stain, any color', 'gallon', 34.00, 55.00, 250.0, '["modern_farmhouse"]'),
  ('stain', 'Sikkens Cetol Log & Siding', 'Log cabin specific, UV resistant', 'gallon', 52.00, 85.00, 120.0, '["rustic_cedar","mountain_lodge","lakeside"]'),
  -- Hardware
  ('hardware', 'Deck Screws (1 lb box)', 'Stainless steel, #8 x 2.5"', 'each', 8.50, 14.00, NULL, '["deck","exterior"]'),
  ('hardware', 'Joist Hangers (50 pack)', 'Simpson Strong-Tie LUS26', 'each', 28.00, 45.00, NULL, '["deck"]'),
  ('hardware', 'Post Base (each)', 'Simpson ABA44, 4x4 post base', 'each', 12.00, 22.00, NULL, '["deck"]'),
  ('hardware', 'Lag Bolts (box of 50)', '1/2" x 4" hot-dip galvanized', 'each', 22.00, 38.00, NULL, '["deck","exterior"]'),
  -- Signs
  ('sign', 'Cedar Sign Blank 12x24', 'Hand-selected cedar, sanded smooth', 'each', 28.00, 55.00, NULL, '["sign"]'),
  ('sign', 'Cedar Sign Blank 16x32', 'Hand-selected cedar, sanded smooth', 'each', 45.00, 85.00, NULL, '["sign"]'),
  ('sign', 'Cedar Sign Blank 20x48', 'Large format, book-matched cedar', 'each', 75.00, 140.00, NULL, '["sign"]'),
  ('sign', 'Black Exterior Paint (qt)', 'Sign lettering paint, UV fade resistant', 'each', 14.00, 24.00, NULL, '["sign"]'),
  ('sign', 'Sign Mounting Hardware', 'Stainless chain + hooks, rustic look', 'each', 18.00, 35.00, NULL, '["sign"]'),
  ('sign', 'Wood Burning/Routing', 'Hand-routed lettering, per letter', 'each', 3.50, 8.00, NULL, '["sign"]'),
  -- Roofing
  ('roofing', 'Architectural Shingles (sq)', 'Owens Corning Duration, 30yr', 'each', 95.00, 160.00, NULL, '["addition","roofing"]'),
  ('roofing', 'Metal Roofing (sqft)', 'Standing seam, 26 gauge', 'sqft', 6.50, 11.00, NULL, '["rustic_cedar","mountain_lodge","addition"]'),
  ('roofing', 'Roofing Felt (roll)', '15# felt underlayment', 'each', 28.00, 45.00, NULL, '["roofing","addition"]'),
  -- Flooring
  ('lumber', 'LVP Flooring (sqft)', 'Luxury vinyl plank, 12mil wear layer', 'sqft', 2.80, 5.50, NULL, '["interior","modern_farmhouse"]'),
  ('lumber', 'Hardwood Flooring (sqft)', 'Oak, 3/4" solid, unfinished', 'sqft', 4.50, 8.00, NULL, '["interior","modern_farmhouse","lakeside"]');

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_design_sessions_customer ON design_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_design_sessions_status ON design_sessions(status);
CREATE INDEX IF NOT EXISTS idx_design_quotes_session ON design_quotes(session_id);
CREATE INDEX IF NOT EXISTS idx_design_quotes_customer ON design_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_material_catalog_category ON material_catalog(category);
