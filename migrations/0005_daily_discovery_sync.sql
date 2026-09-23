ALTER TABLE collections ADD COLUMN basis TEXT;
ALTER TABLE collections ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE collections ADD COLUMN refreshed_at TEXT;

CREATE TABLE discovery_sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK(status IN ('running','completed','failed')),
  discovery_date TEXT,
  book_count INTEGER NOT NULL DEFAULT 0,
  collection_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX discovery_sync_runs_status_date
  ON discovery_sync_runs(status, discovery_date DESC);
CREATE INDEX collections_source_order
  ON collections(source, display_order);
