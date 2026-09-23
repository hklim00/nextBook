ALTER TABLE books ADD COLUMN original_published_year INTEGER;
ALTER TABLE books ADD COLUMN edition_published_at TEXT;
ALTER TABLE books ADD COLUMN edition_type TEXT NOT NULL DEFAULT 'standard'
  CHECK (edition_type IN ('standard','reissue','revised','new_translation','anniversary'));
ALTER TABLE books ADD COLUMN translator TEXT;
ALTER TABLE books ADD COLUMN short_description TEXT NOT NULL DEFAULT '';
ALTER TABLE books ADD COLUMN work_key TEXT;
ALTER TABLE books ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft','published','hidden'));
ALTER TABLE people ADD COLUMN is_fictional INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sources ADD COLUMN archive_url TEXT;
ALTER TABLE sources ADD COLUMN accessed_at TEXT NOT NULL DEFAULT '';
UPDATE sources SET accessed_at = CURRENT_TIMESTAMP WHERE accessed_at = '';
ALTER TABLE book_mentions ADD COLUMN quote TEXT;
CREATE INDEX IF NOT EXISTS idx_books_status_category ON books(status, primary_category);
CREATE INDEX IF NOT EXISTS idx_books_work_key ON books(work_key);
