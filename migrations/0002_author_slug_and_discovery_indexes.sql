ALTER TABLE authors ADD COLUMN slug TEXT;

UPDATE authors SET slug = 'author-' || id WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS authors_slug_unique ON authors(slug);
CREATE INDEX IF NOT EXISTS books_publisher_lookup ON books(publisher_id);
CREATE INDEX IF NOT EXISTS book_authors_author_lookup ON book_authors(author_id, book_id);
CREATE INDEX IF NOT EXISTS collection_books_order_lookup
  ON collection_books(collection_id, display_order);
CREATE INDEX IF NOT EXISTS book_mentions_person_public_lookup
  ON book_mentions(person_id, verified);
