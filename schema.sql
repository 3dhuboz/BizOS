-- BizOS — Universal Business Platform — Cloudflare D1 Schema
-- Run: wrangler d1 execute bizos-db --file=schema.sql

-- ═══════════════════════════════════════════════════════════
-- CORE TABLES (existing)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER',
  is_verified INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  address TEXT,
  dietary_preferences TEXT,
  stamps INTEGER DEFAULT 0,
  has_catering_discount INTEGER DEFAULT 0,
  -- CRM fields
  tags TEXT,                          -- JSON: ["VIP","Corporate"]
  notification_prefs TEXT,            -- JSON: {email,sms,marketing}
  lifetime_value REAL DEFAULT 0,
  last_order_date TEXT,
  tier TEXT DEFAULT 'bronze',         -- bronze/silver/gold
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  unit TEXT,
  min_quantity INTEGER,
  preparation_options TEXT,
  image TEXT,
  category TEXT NOT NULL,
  available INTEGER NOT NULL DEFAULT 1,
  availability_type TEXT DEFAULT 'everyday',
  specific_date TEXT,
  specific_dates TEXT,
  is_pack INTEGER DEFAULT 0,
  pack_groups TEXT,
  available_for_catering INTEGER DEFAULT 0,
  catering_category TEXT,
  moq INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  items TEXT NOT NULL,
  total REAL NOT NULL,
  deposit_amount REAL,
  status TEXT NOT NULL DEFAULT 'Pending',
  cook_day TEXT NOT NULL,
  type TEXT NOT NULL,
  pickup_time TEXT,
  created_at TEXT NOT NULL,
  temperature TEXT,
  fulfillment_method TEXT,
  delivery_address TEXT,
  delivery_fee REAL,
  tracking_number TEXT,
  courier TEXT,
  collection_pin TEXT,
  pickup_location TEXT,
  discount_applied INTEGER DEFAULT 0,
  payment_intent_id TEXT,
  square_checkout_id TEXT,
  -- Payment tracking
  balance_due REAL DEFAULT 0,
  reminder_sent INTEGER DEFAULT 0,
  contract_id TEXT
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  time TEXT,
  start_time TEXT,
  end_time TEXT,
  order_id TEXT,
  image TEXT,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  scheduled_for TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  hashtags TEXT,
  published_at TEXT,
  platform_post_id TEXT,
  publish_error TEXT
);

CREATE TABLE IF NOT EXISTS gallery_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TEXT NOT NULL,
  approved INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  liked_by TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cook_days (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  is_open INTEGER DEFAULT 1
);

-- ═══════════════════════════════════════════════════════════
-- NEW TABLES (universal platform features)
-- ═══════════════════════════════════════════════════════════

-- Customer Notes (CRM)
CREATE TABLE IF NOT EXISTS customer_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Self-service Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  event_date TEXT NOT NULL,
  service_type TEXT,
  guest_count INTEGER,
  package_id TEXT,
  package_name TEXT,
  estimated_total REAL NOT NULL,
  deposit_amount REAL,
  deposit_paid INTEGER DEFAULT 0,
  balance_due REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  square_checkout_id TEXT,
  order_id TEXT
);

-- Shareable Group Planning
CREATE TABLE IF NOT EXISTS shared_plans (
  id TEXT PRIMARY KEY,
  host_name TEXT NOT NULL,
  host_email TEXT,
  title TEXT NOT NULL,
  event_date TEXT,
  package_id TEXT,
  selected_items TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS shared_plan_responses (
  id TEXT PRIMARY KEY,
  shared_plan_id TEXT NOT NULL,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT,
  dietary_preferences TEXT,
  headcount INTEGER DEFAULT 1,
  item_votes TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Digital Contracts / Agreements
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  booking_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  terms_text TEXT NOT NULL,
  signed INTEGER DEFAULT 0,
  signed_at TEXT,
  signature_data TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payment Reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  order_id TEXT,
  type TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
