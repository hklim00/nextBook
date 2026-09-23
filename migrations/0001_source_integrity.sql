CREATE UNIQUE INDEX IF NOT EXISTS sources_url_unique ON sources(url);
CREATE UNIQUE INDEX IF NOT EXISTS book_mentions_relation_unique ON book_mentions(book_id, person_id, source_id, relation_type);
CREATE INDEX IF NOT EXISTS book_mentions_public_lookup ON book_mentions(book_id, verified);
