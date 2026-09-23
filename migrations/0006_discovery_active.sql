ALTER TABLE books ADD COLUMN discovery_active INTEGER NOT NULL DEFAULT 1;

CREATE INDEX books_active_source_lookup
  ON books(discovery_active, metadata_source, updated_at DESC);
