ALTER TABLE reader_preferences ADD COLUMN auto_purchase INTEGER NOT NULL DEFAULT 0 CHECK(auto_purchase IN (0,1));
