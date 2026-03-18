-- The Handy Beaver Database Schema

-- Customers (email-based auth)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  magic_token TEXT, -- For passwordless login
  token_expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Bookings/Jobs
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL, -- carpentry, flooring, deck, general
  status TEXT DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  scheduled_date TEXT, -- ISO date
  estimated_hours REAL,
  labor_rate REAL,
  helper_needed INTEGER DEFAULT 0,
  helper_rate REAL,
  materials_estimate REAL,
  deposit_paid REAL DEFAULT 0,
  total_paid REAL DEFAULT 0,
  notes TEXT,
  google_event_id TEXT,
  google_event_link TEXT,
  calendar_sync_status TEXT DEFAULT 'not_synced',
  calendar_last_synced_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Messages (customer <-> business chat)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  sender TEXT NOT NULL, -- 'customer' or 'business' or 'ai'
  content TEXT NOT NULL,
  read_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Payments (Square transactions)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  square_payment_id TEXT,
  amount REAL NOT NULL,
  type TEXT NOT NULL, -- deposit, labor, materials, final
  status TEXT DEFAULT 'pending', -- pending, completed, refunded, failed
  created_at INTEGER DEFAULT (unixepoch())
);

-- Project Images (before/after + AI visualizations)
CREATE TABLE IF NOT EXISTS project_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id),
  customer_id INTEGER REFERENCES customers(id),
  r2_key TEXT NOT NULL, -- R2 object key
  type TEXT NOT NULL, -- before, after, ai_visualization
  prompt TEXT, -- AI generation prompt if applicable
  created_at INTEGER DEFAULT (unixepoch())
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Service Types (handyman_block, handyman_subscription, residential_sqft, tiny_home_package)
CREATE TABLE IF NOT EXISTS service_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- 'handyman_block', 'handyman_subscription', 'residential_sqft', 'tiny_home_package'
  display_name TEXT NOT NULL,
  description TEXT,
  pricing_model TEXT NOT NULL, -- 'fixed', 'hourly', 'sqft', 'package'
  base_price REAL,
  price_unit TEXT, -- 'per_hour', 'per_sqft', 'per_month', 'flat'
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- 'basic', 'standard', 'premium'
  display_name TEXT NOT NULL,
  hours_per_month REAL NOT NULL,
  monthly_price REAL NOT NULL,
  annual_price REAL, -- Optional annual discount
  features TEXT, -- JSON array of features
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Customer Subscriptions
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'cancelled'
  square_subscription_id TEXT, -- Square Subscriptions API reference
  current_period_start INTEGER,
  current_period_end INTEGER,
  hours_used_this_period REAL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  cancelled_at INTEGER
);

-- Subscription Task Queue
CREATE TABLE IF NOT EXISTS subscription_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL REFERENCES customer_subscriptions(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  description TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
  estimated_hours REAL,
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
  photos TEXT, -- JSON array of R2 keys
  scheduled_date TEXT,
  completed_at INTEGER,
  hours_spent REAL,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Tiny Home Projects
CREATE TABLE IF NOT EXISTS tiny_home_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  package_type TEXT NOT NULL, -- 'modern_minimal', 'rustic_cabin'
  square_footage REAL NOT NULL,
  total_price REAL NOT NULL, -- calculated: sqft * rate
  status TEXT DEFAULT 'quoted', -- 'quoted', 'deposit_paid', 'in_progress', 'completed'
  deposit_amount REAL,
  deposit_paid INTEGER DEFAULT 0,
  address TEXT,
  notes TEXT,
  inspiration_photos TEXT, -- JSON array of R2 keys
  quote_id INTEGER REFERENCES quotes(id),
  created_at INTEGER DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON customer_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_tasks_subscription ON subscription_tasks(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tasks_status ON subscription_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tiny_home_customer ON tiny_home_projects(customer_id);
