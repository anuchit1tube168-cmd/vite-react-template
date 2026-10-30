CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reader_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_reader ON notifications(reader_id,is_read,created_at);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  reader_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_support_reader ON support_tickets(reader_id,status,created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  key_hash TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_reset ON rate_limits(reset_at);
