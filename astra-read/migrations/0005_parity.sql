PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS reader_preferences (
  reader_id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'sepia' CHECK(theme IN ('white','sepia','dark')),
  font_family TEXT NOT NULL DEFAULT 'serif' CHECK(font_family IN ('serif','sans')),
  font_size INTEGER NOT NULL DEFAULT 18 CHECK(font_size BETWEEN 14 AND 30),
  reading_width INTEGER NOT NULL DEFAULT 50 CHECK(reading_width BETWEEN 0 AND 100),
  ambient INTEGER NOT NULL DEFAULT 50 CHECK(ambient BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vip_memberships (
  reader_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'VIP',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK(status IN ('inactive','active','expired')),
  source TEXT NOT NULL DEFAULT 'demo',
  started_at TEXT,
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_ledger_reader_ref
ON coin_ledger(reader_id, reference_id)
WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vip_status_expires
ON vip_memberships(status, expires_at);
