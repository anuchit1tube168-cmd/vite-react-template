CREATE TABLE IF NOT EXISTS auth_accounts (
  reader_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_email ON auth_accounts(email);

CREATE TABLE IF NOT EXISTS sessions (
  session_hash TEXT PRIMARY KEY,
  reader_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_reader ON sessions(reader_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
