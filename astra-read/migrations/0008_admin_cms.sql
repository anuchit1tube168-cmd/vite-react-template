PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS user_roles (
  reader_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('owner','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_reader_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(actor_reader_id) REFERENCES reader_profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_reader_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cms_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(updated_by) REFERENCES reader_profiles(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO cms_settings(key,value) VALUES('payments_enabled','false');
INSERT OR IGNORE INTO cms_settings(key,value) VALUES('public_signup_enabled','true');
