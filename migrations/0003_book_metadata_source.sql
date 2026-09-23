ALTER TABLE books ADD COLUMN metadata_source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE books ADD COLUMN review_required INTEGER NOT NULL DEFAULT 1;

UPDATE books
SET metadata_source = 'mock', review_required = 0
WHERE isbn13 LIKE '979119000%';

CREATE INDEX IF NOT EXISTS books_metadata_source_lookup
  ON books(metadata_source, created_at DESC);
