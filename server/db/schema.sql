-- Catholic Parish Event Finder — schema
-- SQLite now, written to be a straightforward port to Postgres later
-- (INTEGER PK -> SERIAL/IDENTITY, TEXT booleans -> BOOLEAN, TEXT JSON -> JSONB).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS dioceses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  website TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  diocese_id INTEGER NOT NULL REFERENCES dioceses(id) ON DELETE CASCADE,
  address TEXT,
  lat REAL,
  lng REAL,
  website TEXT,
  phone TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_parishes_diocese ON parishes(diocese_id);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parish_id INTEGER NOT NULL REFERENCES parishes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('feast','adoration','fish_fry','festival','retreat','novena','other')),
  audience_tags TEXT NOT NULL DEFAULT '[]', -- JSON array: young_adults, kids, men, women, married_couples, families, general
  start_datetime TEXT NOT NULL,
  end_datetime TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_parish ON events(parish_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

CREATE TABLE IF NOT EXISTS sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  category TEXT,
  website TEXT,
  logo_url TEXT,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('featured','standard')),
  active_until TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  contact_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parish_id INTEGER REFERENCES parishes(id) ON DELETE SET NULL,
  parish_name_text TEXT, -- used when submitter's parish isn't in the system yet
  parish_address_text TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('feast','adoration','fish_fry','festival','retreat','novena','other')),
  audience_tags TEXT NOT NULL DEFAULT '[]',
  start_datetime TEXT NOT NULL,
  end_datetime TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_by_email TEXT NOT NULL,
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
