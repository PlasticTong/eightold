CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  site_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  route TEXT NOT NULL,
  title TEXT NOT NULL,
  referrer_origin TEXT NOT NULL DEFAULT '',
  browser TEXT NOT NULL DEFAULT 'Unknown',
  os TEXT NOT NULL DEFAULT 'Unknown',
  device TEXT NOT NULL DEFAULT 'desktop',
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  is_bot INTEGER NOT NULL DEFAULT 0,
  dedupe_key TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_events_received_at ON events(received_at);
CREATE INDEX IF NOT EXISTS idx_events_visitor_time ON events(visitor_hash, received_at);
CREATE INDEX IF NOT EXISTS idx_events_route_time ON events(route, received_at);
CREATE INDEX IF NOT EXISTS idx_events_site_time ON events(site_id, received_at);
CREATE INDEX IF NOT EXISTS idx_events_site_bot_time ON events(site_id, is_bot, received_at);
CREATE INDEX IF NOT EXISTS idx_events_site_bot_id ON events(site_id, is_bot, id DESC);
CREATE INDEX IF NOT EXISTS idx_events_site_bot_visitor_time ON events(site_id, is_bot, visitor_hash, received_at DESC);
