CREATE TABLE book_relations (
  book_id INTEGER NOT NULL REFERENCES books(id),
  related_book_id INTEGER NOT NULL REFERENCES books(id),
  provider TEXT NOT NULL DEFAULT 'data4library',
  relation_type TEXT NOT NULL DEFAULT 'usage_analysis',
  display_order INTEGER NOT NULL DEFAULT 0,
  refreshed_at TEXT NOT NULL,
  PRIMARY KEY (book_id, related_book_id, provider)
);

CREATE INDEX book_relations_book_order
  ON book_relations(book_id, provider, display_order);

CREATE TABLE book_relation_refreshes (
  book_id INTEGER PRIMARY KEY REFERENCES books(id),
  provider TEXT NOT NULL DEFAULT 'data4library',
  status TEXT NOT NULL,
  refreshed_at TEXT NOT NULL,
  error_message TEXT
);

