PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Ongoing','Completed')),
  rating REAL NOT NULL DEFAULT 0,
  chapter_count INTEGER NOT NULL DEFAULT 0,
  accent TEXT NOT NULL DEFAULT '#5B5BD6',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  chapter_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_free INTEGER NOT NULL DEFAULT 1 CHECK(is_free IN (0,1)),
  coin_price INTEGER NOT NULL DEFAULT 0 CHECK(coin_price >= 0),
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE(book_id, chapter_no)
);
CREATE INDEX IF NOT EXISTS idx_chapters_book_no ON chapters(book_id, chapter_no);

CREATE TABLE IF NOT EXISTS reader_profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  external_subject TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS library_items (
  reader_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(reader_id, book_id),
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reading_progress (
  reader_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  chapter_no INTEGER NOT NULL DEFAULT 1 CHECK(chapter_no >= 1),
  progress_pct REAL NOT NULL DEFAULT 0 CHECK(progress_pct >= 0 AND progress_pct <= 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(reader_id, book_id),
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entitlements (
  reader_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'demo',
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  PRIMARY KEY(reader_id, chapter_id),
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coin_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reader_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reader_id) REFERENCES reader_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_coin_ledger_reader ON coin_ledger(reader_id, created_at);
