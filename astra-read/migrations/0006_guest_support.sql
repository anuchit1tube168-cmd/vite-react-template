PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  reader_id TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_support_requests_reader
ON support_requests(reader_id,status,created_at);

CREATE INDEX IF NOT EXISTS idx_support_requests_email
ON support_requests(contact_email,status,created_at);
